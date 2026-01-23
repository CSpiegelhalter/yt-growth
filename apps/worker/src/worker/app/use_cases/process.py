"""
Processing use case.

Responsibility: Orchestrate the complete processing pipeline.
"""

import logging
from dataclasses import asdict
from typing import Any

from ...ports.metrics import MetricsCollectorProtocol
from ...ports.embeddings import EmbedderProtocol
from ...ports.repositories import (
    VideoRepositoryProtocol,
    EmbeddingRepositoryProtocol,
    ClusterRepositoryProtocol,
    ScoreRepositoryProtocol,
)
from ...infra.metrics import Timer
from ..services import (
    EmbeddingService,
    ClusteringService,
    ScoringService,
    RankingService,
)

logger = logging.getLogger(__name__)


def run_process_pipeline(
    embedder: EmbedderProtocol,
    video_repo: VideoRepositoryProtocol,
    embedding_repo: EmbeddingRepositoryProtocol,
    cluster_repo: ClusterRepositoryProtocol,
    score_repo: ScoreRepositoryProtocol,
    metrics: MetricsCollectorProtocol,
    window: str = "7d",
    embedding_batch_size: int = 100,
    umap_n_components: int = 25,
    umap_n_neighbors: int = 15,
    cluster_min_size: int = 5,
) -> dict[str, Any]:
    """
    Run the processing pipeline (no YouTube calls):
    1. Embed video titles
    2. Cluster by similarity
    3. Score videos (velocity, breakout)
    4. Rank clusters (opportunity)
    
    Args:
        embedder: Text embedding client
        video_repo: Video repository
        embedding_repo: Embedding repository
        cluster_repo: Cluster repository
        score_repo: Score repository
        metrics: Metrics collector
        window: Time window
        embedding_batch_size: Batch size for embedding
        umap_n_components: UMAP components
        umap_n_neighbors: UMAP neighbors
        cluster_min_size: Minimum cluster size
        
    Returns:
        Summary of processing run
    """
    metrics_obj = metrics.start_process_run()
    
    logger.info(f"[Process] Starting processing pipeline for window: {window}")
    
    steps = {}
    
    try:
        # Step 1: Embed
        logger.info("[Process] Step 1/4: Embedding video titles...")
        embedding_service = EmbeddingService(
            embedder=embedder,
            video_repo=video_repo,
            embedding_repo=embedding_repo,
            batch_size=embedding_batch_size,
        )
        with Timer("embed") as t:
            steps["embed"] = embedding_service.embed_videos(window)
        metrics_obj.embed_duration_seconds = t.duration
        metrics_obj.videos_embedded = steps["embed"].get("embedded", 0)
        
        # Step 2: Cluster
        logger.info("[Process] Step 2/4: Clustering videos...")
        clustering_service = ClusteringService(
            embedding_repo=embedding_repo,
            cluster_repo=cluster_repo,
            umap_n_components=umap_n_components,
            umap_n_neighbors=umap_n_neighbors,
            cluster_min_size=cluster_min_size,
        )
        with Timer("cluster") as t:
            steps["cluster"] = clustering_service.cluster_videos(window)
        metrics_obj.cluster_duration_seconds = t.duration
        metrics_obj.clusters_created = steps["cluster"].get("clusters_created", 0)
        metrics_obj.noise_points = steps["cluster"].get("noise_points", 0)
        
        # Step 3: Score
        logger.info("[Process] Step 3/4: Computing scores...")
        scoring_service = ScoringService(score_repo=score_repo)
        with Timer("score") as t:
            steps["score"] = scoring_service.compute_video_scores(window)
        metrics_obj.score_duration_seconds = t.duration
        metrics_obj.videos_scored = steps["score"].get("scored", 0)
        
        # Step 4: Rank
        logger.info("[Process] Step 4/4: Ranking clusters...")
        ranking_service = RankingService(
            cluster_repo=cluster_repo,
            score_repo=score_repo,
        )
        with Timer("rank") as t:
            steps["rank"] = ranking_service.rank_clusters(window)
        metrics_obj.rank_duration_seconds = t.duration
        metrics_obj.clusters_ranked = steps["rank"].get("ranked", 0)
        
        logger.info(f"[Process] Pipeline complete for window: {window}")
        
    except Exception as e:
        logger.exception(f"[Process] Error: {e}")
        metrics_obj.errors += 1
        metrics.log_error(str(e))
    
    metrics.finish_process_run(metrics_obj)
    
    return {
        **asdict(metrics_obj),
        "steps": steps,
    }
