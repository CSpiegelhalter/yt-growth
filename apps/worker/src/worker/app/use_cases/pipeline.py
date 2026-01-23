"""
Full pipeline use case.

Responsibility: Orchestrate all pipeline stages together.
"""

import logging
from typing import Any

from ...ports.metrics import MetricsCollectorProtocol
from ...ports.youtube import YouTubeClientProtocol
from ...ports.embeddings import EmbedderProtocol
from ...ports.repositories import (
    VideoRepositoryProtocol,
    SnapshotRepositoryProtocol,
    ClusterRepositoryProtocol,
    ScoreRepositoryProtocol,
    ChannelRepositoryProtocol,
    IngestionStateRepositoryProtocol,
    EmbeddingRepositoryProtocol,
)

from .ingest import run_ingest_pipeline
from .snapshot import run_snapshot_pipeline
from .process import run_process_pipeline

logger = logging.getLogger(__name__)


def run_all_pipelines(
    youtube_client: YouTubeClientProtocol,
    embedder: EmbedderProtocol,
    video_repo: VideoRepositoryProtocol,
    snapshot_repo: SnapshotRepositoryProtocol,
    cluster_repo: ClusterRepositoryProtocol,
    score_repo: ScoreRepositoryProtocol,
    channel_repo: ChannelRepositoryProtocol,
    state_repo: IngestionStateRepositoryProtocol,
    embedding_repo: EmbeddingRepositoryProtocol,
    metrics: MetricsCollectorProtocol,
    window: str = "7d",
    # Ingest config
    max_per_channel: int = 5,
    seeds_per_run: int = 5,
    videos_per_seed: int = 10,
    longtail_queries: int = 5,
    # Snapshot config
    snapshot_batch_size: int = 50,
    snapshot_max_per_run: int = 500,
    tier_a_hours: int = 4,
    tier_b_hours: int = 12,
    tier_c_hours: int = 24,
    # Process config
    embedding_batch_size: int = 100,
    umap_n_components: int = 25,
    umap_n_neighbors: int = 15,
    cluster_min_size: int = 5,
) -> dict[str, Any]:
    """
    Run the complete pipeline:
    1. Ingest (YouTube search -> discovered_videos)
    2. Snapshot (YouTube videos.list -> video_stat_snapshots)
    3. Process (embed -> cluster -> score -> rank)
    
    Args:
        youtube_client: YouTube API client
        embedder: Text embedding client
        video_repo: Video repository
        snapshot_repo: Snapshot repository
        cluster_repo: Cluster repository
        score_repo: Score repository
        channel_repo: Channel repository
        state_repo: Ingestion state repository
        embedding_repo: Embedding repository
        metrics: Metrics collector
        window: Time window
        ... additional config params
        
    Returns:
        Summary of all pipeline stages
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Running full pipeline for window: {window}")
    logger.info(f"{'='*60}\n")
    
    results: dict[str, Any] = {
        "window": window,
        "stages": {},
    }
    
    # Stage 1: Ingest
    logger.info("\n[Pipeline] Stage 1/3: Ingestion")
    results["stages"]["ingest"] = run_ingest_pipeline(
        youtube_client=youtube_client,
        video_repo=video_repo,
        score_repo=score_repo,
        channel_repo=channel_repo,
        state_repo=state_repo,
        metrics=metrics,
        window=window,
        max_per_channel=max_per_channel,
        seeds_per_run=seeds_per_run,
        videos_per_seed=videos_per_seed,
        longtail_queries=longtail_queries,
    )
    
    # Stage 2: Snapshot
    logger.info("\n[Pipeline] Stage 2/3: Snapshotting")
    results["stages"]["snapshot"] = run_snapshot_pipeline(
        youtube_client=youtube_client,
        snapshot_repo=snapshot_repo,
        channel_repo=channel_repo,
        metrics=metrics,
        batch_size=snapshot_batch_size,
        max_per_run=snapshot_max_per_run,
        tier_a_hours=tier_a_hours,
        tier_b_hours=tier_b_hours,
        tier_c_hours=tier_c_hours,
    )
    
    # Stage 3: Process
    logger.info("\n[Pipeline] Stage 3/3: Processing")
    results["stages"]["process"] = run_process_pipeline(
        embedder=embedder,
        video_repo=video_repo,
        embedding_repo=embedding_repo,
        cluster_repo=cluster_repo,
        score_repo=score_repo,
        metrics=metrics,
        window=window,
        embedding_batch_size=embedding_batch_size,
        umap_n_components=umap_n_components,
        umap_n_neighbors=umap_n_neighbors,
        cluster_min_size=cluster_min_size,
    )
    
    # Summary
    results["summary"] = {
        "videos_ingested": results["stages"]["ingest"].get("videos_inserted", 0),
        "videos_snapshotted": results["stages"]["snapshot"].get("videos_snapshotted", 0),
        "videos_scored": results["stages"]["process"].get("videos_scored", 0),
        "clusters_created": results["stages"]["process"].get("clusters_created", 0),
    }
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Full pipeline complete for window: {window}")
    logger.info(f"Summary: {results['summary']}")
    logger.info(f"{'='*60}\n")
    
    return results
