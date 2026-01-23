"""
Snapshot service - coordinate video stat snapshotting.

Responsibility: Orchestrate tiered snapshotting of video stats.
Depends on: YouTube client protocol, repository protocols.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from ...domain.models import Snapshot, Channel, SnapshotCandidate
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import SnapshotRepositoryProtocol, ChannelRepositoryProtocol
from ...infra.youtube import QuotaExceededError

logger = logging.getLogger(__name__)


@dataclass
class SnapshotStats:
    """Statistics about a snapshot run."""
    total_due: int = 0
    snapshotted: int = 0
    failed: int = 0
    channels_updated: int = 0


class SnapshotService:
    """
    Coordinates tiered snapshotting with concurrent safety.
    
    Uses SKIP LOCKED to prevent multiple workers from snapshotting
    the same videos simultaneously.
    """
    
    def __init__(
        self,
        youtube_client: YouTubeClientProtocol,
        snapshot_repo: SnapshotRepositoryProtocol,
        channel_repo: ChannelRepositoryProtocol,
        batch_size: int = 50,
        max_per_run: int = 500,
        tier_a_hours: int = 4,
        tier_b_hours: int = 12,
        tier_c_hours: int = 24,
    ):
        """
        Initialize the snapshot service.
        
        Args:
            youtube_client: YouTube API client
            snapshot_repo: Snapshot repository
            channel_repo: Channel repository
            batch_size: Videos per API batch
            max_per_run: Max videos to snapshot per run
            tier_a_hours: Tier A snapshot interval
            tier_b_hours: Tier B snapshot interval
            tier_c_hours: Tier C snapshot interval
        """
        self.youtube_client = youtube_client
        self.snapshot_repo = snapshot_repo
        self.channel_repo = channel_repo
        self.batch_size = batch_size
        self.max_per_run = max_per_run
        self.tier_a_hours = tier_a_hours
        self.tier_b_hours = tier_b_hours
        self.tier_c_hours = tier_c_hours
    
    def run(self) -> SnapshotStats:
        """
        Run a complete snapshot cycle.
        
        1. Get videos due for snapshot
        2. Fetch stats from YouTube
        3. Save snapshots to DB
        4. Update channel profiles
        
        Returns:
            SnapshotStats with run summary
        """
        stats = SnapshotStats()
        
        # Get due videos (with locking)
        candidates_data = self.snapshot_repo.get_due_videos(
            tier_a_hours=self.tier_a_hours,
            tier_b_hours=self.tier_b_hours,
            tier_c_hours=self.tier_c_hours,
            max_per_run=self.max_per_run,
        )
        
        candidates = [
            SnapshotCandidate(
                video_id=c["video_id"],
                channel_id=c["channel_id"],
                tier=c["tier"],
                last_snapshot_at=c["last_snapshot_at"],
                velocity_24h=c["velocity_24h"],
                published_at=c["published_at"],
            )
            for c in candidates_data
        ]
        
        stats.total_due = len(candidates)
        
        if not candidates:
            logger.info("[Snapshot] No videos due for snapshot")
            return stats
        
        logger.info(f"[Snapshot] Found {len(candidates)} videos due for snapshot")
        
        # Log tier breakdown
        tier_counts = {"A": 0, "B": 0, "C": 0}
        for c in candidates:
            tier_counts[c.tier] = tier_counts.get(c.tier, 0) + 1
        logger.info(f"[Snapshot] Tier breakdown: A={tier_counts['A']}, B={tier_counts['B']}, C={tier_counts['C']}")
        
        # Fetch stats
        video_stats = self._snapshot_videos(candidates)
        
        # Save snapshots
        stats.snapshotted = self._save_snapshots(video_stats)
        
        # Update channels
        stats.channels_updated = self._update_channels(candidates)
        
        return stats
    
    def _snapshot_videos(self, candidates: list[SnapshotCandidate]) -> dict[str, Any]:
        """Snapshot a batch of videos via YouTube API."""
        if not candidates:
            return {}
        
        video_ids = [c.video_id for c in candidates]
        
        all_stats: dict[str, Any] = {}
        
        for i in range(0, len(video_ids), self.batch_size):
            batch = video_ids[i:i + self.batch_size]
            
            try:
                stats = self.youtube_client.get_video_stats(batch)
                all_stats.update(stats)
            except QuotaExceededError:
                logger.warning(f"[Snapshot] Quota exceeded after {len(all_stats)} videos")
                break
            except Exception as e:
                logger.error(f"[Snapshot] Error fetching batch: {e}")
                continue
        
        return all_stats
    
    def _save_snapshots(self, stats: dict[str, Any]) -> int:
        """Save snapshots to database."""
        if not stats:
            return 0
        
        saved = self.snapshot_repo.save_snapshot_stats(stats)
        logger.info(f"[Snapshot] Saved {saved} snapshots")
        return saved
    
    def _update_channels(self, candidates: list[SnapshotCandidate]) -> int:
        """Update channel profiles with fresh data."""
        # Get unique channels
        channel_ids = list(set(c.channel_id for c in candidates))
        
        # Find channels needing updates (missing or stale)
        fresh_channels = self.channel_repo.get_fresh_channel_ids(channel_ids, hours=24)
        stale_channels = [cid for cid in channel_ids if cid not in fresh_channels]
        
        if not stale_channels:
            return 0
        
        logger.info(f"[Snapshot] Updating {len(stale_channels)} stale channels")
        
        try:
            channel_info = self.youtube_client.get_channel_info_batched(stale_channels)
        except QuotaExceededError:
            logger.warning("[Snapshot] Quota exceeded during channel updates")
            return 0
        except Exception as e:
            logger.error(f"[Snapshot] Error fetching channels: {e}")
            return 0
        
        channels = [
            Channel(
                channel_id=info.channel_id,
                channel_title=info.title,
                subscriber_count=info.subscriber_count,
                channel_published_at=info.published_at,
            )
            for info in channel_info.values()
        ]
        
        updated = self.channel_repo.upsert_channels_batch(channels)
        logger.info(f"[Snapshot] Updated {updated} channels")
        
        return updated
    
    def compute_channel_baselines(self) -> int:
        """Compute rolling baseline metrics for channels."""
        return self.channel_repo.compute_channel_baselines()
