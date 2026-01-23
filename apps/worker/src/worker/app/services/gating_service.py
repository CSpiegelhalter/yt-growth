"""
Gating service - coordinate candidate filtering.

Responsibility: Apply gating rules using domain logic and repositories.
Depends on: Domain gating logic, repository protocols.
"""

import logging
from typing import Any

from ...domain.models import VideoSearchResult, GatingResult, GatingStats
from ...domain.gating import check_age_eligibility, check_channel_cap, check_duplicate
from ...ports.repositories import VideoRepositoryProtocol, ChannelRepositoryProtocol

logger = logging.getLogger(__name__)


class GatingService:
    """
    Applies gating rules to filter candidates.
    
    Tracks state across the batch to enforce:
    - Per-channel caps
    - Deduplication
    """
    
    def __init__(
        self,
        video_repo: VideoRepositoryProtocol,
        channel_repo: ChannelRepositoryProtocol,
        max_per_channel: int = 5,
    ):
        """
        Initialize the gating service.
        
        Args:
            video_repo: Video repository for deduplication
            channel_repo: Channel repository for channel counts
            max_per_channel: Max videos per channel per batch
        """
        self.video_repo = video_repo
        self.channel_repo = channel_repo
        self.max_per_channel = max_per_channel
        
        # In-memory state for this batch
        self.seen_video_ids: set[str] = set()
        self.channel_counts: dict[str, int] = {}
        self.stats = GatingStats()
        self._initialized = False
    
    def _load_existing_videos(self) -> None:
        """Load existing video IDs from database."""
        self.seen_video_ids = self.video_repo.get_existing_video_ids(since_days=7)
        logger.info(f"[Gating] Loaded {len(self.seen_video_ids)} existing video IDs")
        self._initialized = True
    
    def _load_channel_counts(self, channel_ids: list[str]) -> None:
        """Load recent video counts per channel from database."""
        if not channel_ids:
            return
        
        counts = self.channel_repo.get_channel_counts_24h(channel_ids)
        self.channel_counts.update(counts)
    
    def gate(
        self,
        video: VideoSearchResult,
        feeder_source: str,
    ) -> GatingResult:
        """
        Apply gating rules to a candidate.
        
        Args:
            video: The candidate video
            feeder_source: Which feeder found this video
            
        Returns:
            GatingResult with acceptance status and reason
        """
        if not self._initialized:
            self._load_existing_videos()
        
        self.stats.total_candidates += 1
        
        # Check for duplicate
        if not check_duplicate(video.video_id, self.seen_video_ids):
            self.stats.rejected_duplicate += 1
            return GatingResult(
                accepted=False,
                video=video,
                feeder_source=feeder_source,
                rejection_reason="duplicate",
            )
        
        # Check age eligibility
        eligible_windows = check_age_eligibility(video.published_at)
        if not eligible_windows:
            self.stats.rejected_too_old += 1
            return GatingResult(
                accepted=False,
                video=video,
                feeder_source=feeder_source,
                rejection_reason="too_old",
            )
        
        # Check per-channel cap
        if not check_channel_cap(video.channel_id, self.channel_counts, self.max_per_channel):
            self.stats.rejected_channel_cap += 1
            return GatingResult(
                accepted=False,
                video=video,
                feeder_source=feeder_source,
                rejection_reason="channel_cap",
            )
        
        # Accepted! Update state
        self.seen_video_ids.add(video.video_id)
        self.channel_counts[video.channel_id] = self.channel_counts.get(video.channel_id, 0) + 1
        self.stats.accepted += 1
        
        return GatingResult(
            accepted=True,
            video=video,
            feeder_source=feeder_source,
            eligible_windows=eligible_windows,
        )
    
    def gate_batch(
        self,
        candidates: list[tuple[str, VideoSearchResult]],
    ) -> list[GatingResult]:
        """
        Apply gating to a batch of candidates.
        
        Args:
            candidates: List of (feeder_source, video) tuples
            
        Returns:
            List of GatingResult objects
        """
        if not self._initialized:
            self._load_existing_videos()
        
        # Pre-load channel counts for efficiency
        channel_ids = list(set(v.channel_id for _, v in candidates))
        self._load_channel_counts(channel_ids)
        
        results = []
        for feeder_source, video in candidates:
            result = self.gate(video, feeder_source)
            results.append(result)
        
        logger.info(
            f"[Gating] Processed {self.stats.total_candidates} candidates: "
            f"{self.stats.accepted} accepted, "
            f"{self.stats.rejected_duplicate} duplicates, "
            f"{self.stats.rejected_too_old} too old, "
            f"{self.stats.rejected_channel_cap} channel cap"
        )
        
        return results
    
    def get_accepted(
        self,
        results: list[GatingResult],
    ) -> list[GatingResult]:
        """Filter results to only accepted candidates."""
        return [r for r in results if r.accepted]
