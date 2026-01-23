"""
Clustering service - coordinate video clustering.

Responsibility: Orchestrate clustering of embedded videos.
Depends on: Domain clustering logic, repository protocols.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np

from ...domain.models import Cluster, ClusterMetrics
from ...domain.clustering import reduce_dimensions, run_hdbscan, normalize_embeddings, stable_cluster_id
from ...domain.labeling import label_cluster
from ...ports.repositories import EmbeddingRepositoryProtocol, ClusterRepositoryProtocol

logger = logging.getLogger(__name__)


class ClusteringService:
    """
    Coordinates clustering of videos by semantic similarity.
    
    Handles UMAP reduction, HDBSCAN clustering, and persistence.
    """
    
    def __init__(
        self,
        embedding_repo: EmbeddingRepositoryProtocol,
        cluster_repo: ClusterRepositoryProtocol,
        umap_n_components: int = 25,
        umap_n_neighbors: int = 15,
        cluster_min_size: int = 5,
    ):
        """
        Initialize the clustering service.
        
        Args:
            embedding_repo: Embedding repository for fetching embeddings
            cluster_repo: Cluster repository for persistence
            umap_n_components: UMAP target dimensions
            umap_n_neighbors: UMAP n_neighbors parameter
            cluster_min_size: HDBSCAN minimum cluster size
        """
        self.embedding_repo = embedding_repo
        self.cluster_repo = cluster_repo
        self.umap_n_components = umap_n_components
        self.umap_n_neighbors = umap_n_neighbors
        self.cluster_min_size = cluster_min_size
    
    def cluster_videos(self, window: str) -> dict[str, Any]:
        """
        Cluster videos for a given time window.
        
        This is idempotent - running it multiple times produces the same clusters
        (modulo any new videos added).
        
        Args:
            window: Time window (e.g., '7d', '30d')
            
        Returns:
            Summary of clustering operation
        """
        # Fetch embeddings
        videos = self.embedding_repo.fetch_embeddings_for_window(window)
        
        if not videos:
            return {
                "status": "no_data",
                "message": "No videos with embeddings found",
                "clusters_created": 0,
            }
        
        logger.info(f"[Cluster] Found {len(videos)} videos with embeddings for window {window}")
        
        # Parse embeddings into numpy array
        embeddings = []
        for v in videos:
            emb_str = v["embedding"]
            if emb_str.startswith("["):
                emb = json.loads(emb_str)
            else:
                # Handle postgres vector format
                emb = [float(x) for x in emb_str.strip("[]").split(",")]
            embeddings.append(emb)
        
        embeddings_array = np.array(embeddings)
        
        # Normalize embeddings
        embeddings_normalized = normalize_embeddings(embeddings_array)
        
        # Reduce dimensions with UMAP
        logger.info("[Cluster] Reducing dimensions with UMAP...")
        reduced = reduce_dimensions(
            embeddings_normalized,
            n_components=self.umap_n_components,
            n_neighbors=self.umap_n_neighbors,
        )
        
        # Run HDBSCAN
        logger.info("[Cluster] Running HDBSCAN clustering...")
        labels = run_hdbscan(reduced, min_cluster_size=self.cluster_min_size)
        
        # Group videos by cluster
        cluster_groups: dict[int, list[dict]] = {}
        for i, label in enumerate(labels):
            if label == -1:  # Skip noise
                continue
            if label not in cluster_groups:
                cluster_groups[label] = []
            cluster_groups[label].append(videos[i])
        
        logger.info(f"[Cluster] Found {len(cluster_groups)} clusters (excluded {sum(1 for l in labels if l == -1)} noise points)")
        
        # Create/update clusters
        created_cluster_ids: set[str] = set()
        
        for label, cluster_videos in cluster_groups.items():
            video_ids = [v["video_id"] for v in cluster_videos]
            cluster_id = stable_cluster_id(window, video_ids)
            created_cluster_ids.add(cluster_id)
            
            # Generate label and keywords
            titles = [v["title"] for v in cluster_videos]
            label_data = label_cluster(titles)
            
            # Compute metrics
            metrics = self._compute_cluster_metrics(cluster_videos)
            
            # Create cluster object
            cluster = Cluster(
                cluster_id=cluster_id,
                window=window,
                label=label_data["label"],
                keywords=label_data["keywords"],
                video_ids=video_ids,
                metrics=metrics,
            )
            
            self.cluster_repo.upsert_cluster(cluster)
            self.cluster_repo.upsert_cluster_videos(cluster_id, video_ids)
            
            logger.info(f"[Cluster] Created/updated cluster '{label_data['label']}' with {len(video_ids)} videos")
        
        # Clean up stale clusters
        deleted = self.cluster_repo.delete_stale_clusters(window, created_cluster_ids)
        if deleted:
            logger.info(f"[Cluster] Deleted {deleted} stale clusters")
        
        return {
            "status": "success",
            "message": f"Created {len(created_cluster_ids)} clusters",
            "clusters_created": len(created_cluster_ids),
            "total_videos": len(videos),
            "noise_points": sum(1 for l in labels if l == -1),
        }
    
    def _compute_cluster_metrics(self, videos: list[dict]) -> ClusterMetrics:
        """Compute aggregate metrics for a cluster."""
        if not videos:
            return ClusterMetrics()
        
        now = datetime.now(timezone.utc)
        channel_ids = set()
        days_old = []
        
        for v in videos:
            channel_ids.add(v.get("channel_id"))
            published = v.get("published_at")
            if published:
                if isinstance(published, str):
                    published = datetime.fromisoformat(published.replace("Z", "+00:00"))
                age_days = max(0.01, (now - published).total_seconds() / 86400)
                days_old.append(age_days)
        
        avg_days = int(np.mean(days_old)) if days_old else None
        
        return ClusterMetrics(
            unique_channels=len(channel_ids),
            total_videos=len(videos),
            avg_days_old=avg_days,
        )
