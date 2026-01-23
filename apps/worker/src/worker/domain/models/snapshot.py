"""
Snapshot domain models.

Responsibility: Define stat snapshot data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Snapshot:
    """
    A point-in-time snapshot of video statistics.
    
    Immutable record of metrics captured at a specific time.
    """
    video_id: str
    captured_at: datetime
    view_count: int
    like_count: int | None = None
    comment_count: int | None = None


@dataclass(frozen=True)
class SnapshotCandidate:
    """
    A video that needs a snapshot.
    
    Includes metadata used for tier assignment and scheduling.
    """
    video_id: str
    channel_id: str
    tier: str
    last_snapshot_at: datetime | None
    velocity_24h: int | None
    published_at: datetime
