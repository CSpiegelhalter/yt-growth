"""
Video score domain models.

Responsibility: Define score data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class VideoScore:
    """
    Computed scores for a video within a time window.
    
    Scores are recomputed periodically as new snapshots arrive.
    """
    video_id: str
    window: str
    
    # Raw metrics
    view_count: int = 0
    views_per_day: float = 0.0
    
    # Velocity metrics (from snapshots)
    velocity_24h: float | None = None
    velocity_7d: float | None = None
    acceleration: float | None = None
    
    # Breakout metrics (normalized)
    breakout_by_subs: float | None = None
    breakout_by_baseline: float | None = None
    
    # Tracking
    computed_at: datetime | None = None


@dataclass(frozen=True)
class ScoreInput:
    """
    Input data needed to compute a video's score.
    
    Aggregates data from multiple sources (video, snapshots, channel).
    """
    video_id: str
    channel_id: str
    published_at: datetime
    current_view_count: int
    view_count_24h_ago: int | None
    view_count_7d_ago: int | None
    subscriber_count: int | None
    channel_median_velocity: float | None
