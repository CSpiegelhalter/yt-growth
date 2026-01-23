"""
Ranking service - coordinate cluster ranking.

Responsibility: Orchestrate computation of opportunity scores.
Depends on: Domain scoring logic, repository protocols.
"""

import logging
from typing import Any

import numpy as np

from ...domain.scoring import compute_opportunity_score, compute_winner_concentration
from ...ports.repositories import ClusterRepositoryProtocol, ScoreRepositoryProtocol

logger = logging.getLogger(__name__)


class RankingService:
    """
    Coordinates ranking of clusters.
    
    Computes opportunity scores for niches.
    """
    
    def __init__(
        self,
        cluster_repo: ClusterRepositoryProtocol,
        score_repo: ScoreRepositoryProtocol,
    ):
        """
        Initialize the ranking service.
        
        Args:
            cluster_repo: Cluster repository for fetching clusters
            score_repo: Score repository for updating metrics
        """
        self.cluster_repo = cluster_repo
        self.score_repo = score_repo
    
    def rank_clusters(self, window: str) -> dict[str, Any]:
        """
        Update cluster metrics and compute opportunity scores.
        
        Args:
            window: Time window (e.g., '7d', '30d')
            
        Returns:
            Summary of ranking operation
        """
        clusters = self.cluster_repo.fetch_clusters_with_scores(window)
        
        if not clusters:
            return {
                "status": "no_data",
                "message": "No clusters found for ranking",
                "ranked": 0,
            }
        
        logger.info(f"[Rank] Computing metrics for {len(clusters)} clusters")
        
        ranked = 0
        for c in clusters:
            try:
                cluster_id = c["cluster_id"]
                
                # Filter out None values
                velocities = [v for v in (c["velocities"] or []) if v is not None]
                view_counts = [v for v in (c["view_counts"] or []) if v is not None]
                subs = [s for s in (c["subscriber_counts"] or []) if s is not None]
                
                # Compute metrics
                median_velocity = float(np.median(velocities)) if velocities else None
                avg_subs = float(np.mean(subs)) if subs else None
                concentration = compute_winner_concentration(view_counts)
                opportunity = compute_opportunity_score(median_velocity, avg_subs, concentration)
                
                # Update cluster
                self.score_repo.update_cluster_metrics(
                    cluster_id=cluster_id,
                    median_velocity=median_velocity,
                    avg_subs=avg_subs,
                    concentration=concentration,
                    opportunity=opportunity,
                )
                
                ranked += 1
                
            except Exception as e:
                logger.error(f"[Rank] Error ranking cluster {c.get('cluster_id')}: {e}")
                continue
        
        logger.info(f"[Rank] Ranked {ranked} clusters")
        
        return {
            "status": "success",
            "message": f"Ranked {ranked} clusters",
            "ranked": ranked,
            "total_found": len(clusters),
        }
