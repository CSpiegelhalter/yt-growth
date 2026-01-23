"""
Channel domain models.

Responsibility: Define channel-related data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class ChannelInfo:
    """
    Channel information from channels.list API.
    
    Immutable representation of channel metadata.
    """
    channel_id: str
    title: str
    subscriber_count: int | None
    video_count: int | None
    published_at: datetime | None


@dataclass
class Channel:
    """
    Channel profile stored in our database.
    
    Includes computed baseline metrics.
    """
    channel_id: str
    channel_title: str | None = None
    subscriber_count: int | None = None
    channel_published_at: datetime | None = None
    
    # Computed baseline metrics
    median_velocity_24h: float | None = None
    median_views_per_day: float | None = None
    video_count_for_baseline: int | None = None
    
    # Tracking
    last_fetched_at: datetime | None = None
    updated_at: datetime | None = None
