"""
Snapshot use case.

Responsibility: Orchestrate the complete snapshot pipeline.
"""

import logging
from dataclasses import asdict
from typing import Any

from ...ports.metrics import MetricsCollectorProtocol
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import SnapshotRepositoryProtocol, ChannelRepositoryProtocol
from ...infra.youtube import QuotaExceededError, get_quota_tracker
from ..services import SnapshotService

logger = logging.getLogger(__name__)


def run_snapshot_pipeline(
    youtube_client: YouTubeClientProtocol,
    snapshot_repo: SnapshotRepositoryProtocol,
    channel_repo: ChannelRepositoryProtocol,
    metrics: MetricsCollectorProtocol,
    batch_size: int = 50,
    max_per_run: int = 500,
    tier_a_hours: int = 4,
    tier_b_hours: int = 12,
    tier_c_hours: int = 24,
) -> dict[str, Any]:
    """
    Run the snapshot pipeline:
    1. Select videos due for snapshot (tiered)
    2. Fetch stats from YouTube (batched)
    3. Insert snapshots into video_stat_snapshots
    4. Update channel profiles
    5. Compute channel baselines
    
    Returns:
        Summary of snapshot run
    """
    metrics_obj = metrics.start_snapshot_run()
    
    logger.info("[Snapshot] Starting snapshot pipeline")
    
    try:
        service = SnapshotService(
            youtube_client=youtube_client,
            snapshot_repo=snapshot_repo,
            channel_repo=channel_repo,
            batch_size=batch_size,
            max_per_run=max_per_run,
            tier_a_hours=tier_a_hours,
            tier_b_hours=tier_b_hours,
            tier_c_hours=tier_c_hours,
        )
        stats = service.run()
        
        metrics_obj.videos_due = stats.total_due
        metrics_obj.videos_snapshotted = stats.snapshotted
        metrics_obj.channels_updated = stats.channels_updated
        
        # Compute channel baselines after snapshotting
        if stats.snapshotted > 0:
            logger.info("[Snapshot] Computing channel baselines...")
            service.compute_channel_baselines()
        
        # Log quota status
        quota = get_quota_tracker()
        metrics_obj.quota_used = quota.used_today
        metrics_obj.quota_remaining = quota.remaining
        
    except QuotaExceededError as e:
        logger.warning(f"[Snapshot] Quota exceeded: {e}")
        metrics_obj.errors += 1
        metrics.log_error(str(e))
    except Exception as e:
        logger.exception(f"[Snapshot] Error: {e}")
        metrics_obj.errors += 1
        metrics.log_error(str(e))
    
    metrics.finish_snapshot_run(metrics_obj)
    return asdict(metrics_obj)
