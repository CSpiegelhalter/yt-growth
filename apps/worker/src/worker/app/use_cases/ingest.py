"""
Ingestion use case.

Responsibility: Orchestrate the complete ingestion pipeline.
"""

import logging
from dataclasses import asdict
from typing import Any

from ...domain.models import DiscoveredVideo
from ...ports.metrics import MetricsCollectorProtocol
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import (
    VideoRepositoryProtocol,
    ScoreRepositoryProtocol,
    ChannelRepositoryProtocol,
    IngestionStateRepositoryProtocol,
)
from ...infra.youtube import QuotaExceededError, get_quota_tracker
from ..services import GatingService
from ..feeders import run_all_feeders

logger = logging.getLogger(__name__)


def run_ingest_pipeline(
    youtube_client: YouTubeClientProtocol,
    video_repo: VideoRepositoryProtocol,
    score_repo: ScoreRepositoryProtocol,
    channel_repo: ChannelRepositoryProtocol,
    state_repo: IngestionStateRepositoryProtocol,
    metrics: MetricsCollectorProtocol,
    window: str = "7d",
    max_per_channel: int = 5,
    seeds_per_run: int = 5,
    videos_per_seed: int = 10,
    longtail_queries: int = 5,
) -> dict[str, Any]:
    """
    Run the ingestion pipeline:
    1. Generate candidates from feeders (YouTube search)
    2. Apply gating rules (filter, dedupe, per-channel caps)
    3. Insert accepted candidates into discovered_videos
    
    Args:
        youtube_client: YouTube API client
        video_repo: Video repository
        score_repo: Score repository
        channel_repo: Channel repository
        state_repo: Ingestion state repository
        metrics: Metrics collector
        window: Time window for candidate eligibility
        max_per_channel: Max videos per channel
        seeds_per_run: Seeds per ingestion run
        videos_per_seed: Videos per seed query
        
    Returns:
        Summary of ingestion run
    """
    metrics_obj = metrics.start_ingest_run()
    
    logger.info(f"[Ingest] Starting ingestion pipeline for window: {window}")
    
    try:
        # Run feeders to generate candidates
        logger.info("[Ingest] Running feeders...")
        feeder_result = run_all_feeders(
            youtube_client=youtube_client,
            video_repo=video_repo,
            score_repo=score_repo,
            state_repo=state_repo,
            window=window,
            seeds_per_run=seeds_per_run,
            videos_per_seed=videos_per_seed,
            longtail_queries=longtail_queries,
        )
        
        candidates = feeder_result["candidates"]
        metrics_obj.candidates_found = len(candidates)
        metrics_obj.seeds_processed = feeder_result["stats"]["intent_seed"].get("candidates", 0)
        
        if not candidates:
            logger.info("[Ingest] No candidates found")
            metrics.finish_ingest_run(metrics_obj)
            return asdict(metrics_obj)
        
        # Apply gating
        logger.info(f"[Ingest] Applying gating to {len(candidates)} candidates...")
        gating = GatingService(
            video_repo=video_repo,
            channel_repo=channel_repo,
            max_per_channel=max_per_channel,
        )
        gating_results = gating.gate_batch(candidates)
        
        accepted = gating.get_accepted(gating_results)
        metrics_obj.candidates_accepted = len(accepted)
        metrics_obj.candidates_rejected_duplicate = gating.stats.rejected_duplicate
        metrics_obj.candidates_rejected_too_old = gating.stats.rejected_too_old
        metrics_obj.candidates_rejected_channel_cap = gating.stats.rejected_channel_cap
        
        if not accepted:
            logger.info("[Ingest] No candidates passed gating")
            metrics.finish_ingest_run(metrics_obj)
            return asdict(metrics_obj)
        
        # Prepare for batch insert
        videos_to_insert = [
            DiscoveredVideo.from_search_result(
                result.video,
                feeder=result.feeder_source,
            )
            for result in accepted
        ]
        
        # Batch insert
        logger.info(f"[Ingest] Inserting {len(videos_to_insert)} videos...")
        inserted, updated = video_repo.upsert_videos_batch(videos_to_insert)
        
        metrics_obj.videos_inserted = inserted
        metrics_obj.videos_updated = updated
        
        logger.info(f"[Ingest] Inserted {inserted}, updated {updated} videos")
        
        # Log quota status
        quota = get_quota_tracker()
        metrics_obj.quota_used = quota.used_today
        metrics_obj.quota_remaining = quota.remaining
        
    except QuotaExceededError as e:
        logger.warning(f"[Ingest] Quota exceeded: {e}")
        metrics_obj.errors += 1
        metrics.log_error(str(e))
    except Exception as e:
        logger.exception(f"[Ingest] Error: {e}")
        metrics_obj.errors += 1
        metrics.log_error(str(e))
    
    metrics.finish_ingest_run(metrics_obj)
    return asdict(metrics_obj)
