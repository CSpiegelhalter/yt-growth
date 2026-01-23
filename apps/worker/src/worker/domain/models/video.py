"""
Video domain models.

Responsibility: Define video-related data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Video:
    """Core video identity."""
    video_id: str
    channel_id: str
    title: str
    published_at: datetime


@dataclass(frozen=True)
class VideoSearchResult:
    """
    Result from a YouTube search.
    
    Immutable representation of a video found via search API.
    """
    video_id: str
    channel_id: str
    channel_title: str
    title: str
    description: str
    thumbnail_url: str | None
    published_at: datetime


@dataclass(frozen=True)
class VideoStats:
    """
    Video statistics from videos.list API.
    
    Represents a point-in-time snapshot of video metrics.
    """
    video_id: str
    view_count: int
    like_count: int | None
    comment_count: int | None
    duration_seconds: int | None


@dataclass
class DiscoveredVideo:
    """
    A video discovered through our ingestion pipeline.
    
    Mutable because we update timestamps on re-discovery.
    """
    video_id: str
    channel_id: str
    channel_title: str
    title: str
    thumbnail_url: str | None
    published_at: datetime
    feeder: str
    seed: str | None = None
    duration_sec: int | None = None
    language: str | None = None
    tags: list[str] | None = None
    first_seen_at: datetime | None = None
    last_seen_at: datetime | None = None
    
    @classmethod
    def from_search_result(
        cls,
        result: VideoSearchResult,
        feeder: str,
        seed: str | None = None,
    ) -> "DiscoveredVideo":
        """Create a DiscoveredVideo from a search result."""
        return cls(
            video_id=result.video_id,
            channel_id=result.channel_id,
            channel_title=result.channel_title,
            title=result.title,
            thumbnail_url=result.thumbnail_url,
            published_at=result.published_at,
            feeder=feeder,
            seed=seed,
        )
