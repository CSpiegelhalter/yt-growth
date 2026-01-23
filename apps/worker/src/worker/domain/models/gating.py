"""
Gating domain models.

Responsibility: Define gating result data structures.
Depends on: video models.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass, field
from .video import VideoSearchResult


@dataclass
class GatingResult:
    """
    Result of applying gating rules to a candidate video.
    
    Tracks whether the video was accepted and why/why not.
    """
    accepted: bool
    video: VideoSearchResult
    feeder_source: str
    eligible_windows: list[str] = field(default_factory=list)
    rejection_reason: str | None = None


@dataclass
class GatingStats:
    """
    Statistics about gating operations within a batch.
    
    Used for metrics and debugging.
    """
    total_candidates: int = 0
    accepted: int = 0
    rejected_too_old: int = 0
    rejected_duplicate: int = 0
    rejected_channel_cap: int = 0
    rejected_other: int = 0
