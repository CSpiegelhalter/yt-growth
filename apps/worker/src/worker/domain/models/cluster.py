"""
Cluster domain models.

Responsibility: Define cluster data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class ClusterMetrics:
    """
    Computed metrics for a cluster.
    
    All metrics are derived from the videos in the cluster.
    """
    median_views_per_day: float | None = None
    median_velocity_24h: float | None = None
    unique_channels: int = 0
    total_videos: int = 0
    avg_days_old: int | None = None
    avg_channel_subs: float | None = None
    winner_concentration: float | None = None
    opportunity_score: float | None = None


@dataclass
class Cluster:
    """
    A niche cluster of semantically similar videos.
    
    Clusters are identified by a stable ID derived from their member videos.
    """
    cluster_id: str
    window: str
    label: str
    keywords: list[str] = field(default_factory=list)
    video_ids: list[str] = field(default_factory=list)
    metrics: ClusterMetrics = field(default_factory=ClusterMetrics)
    computed_at: datetime | None = None


@dataclass(frozen=True)
class ClusterLabel:
    """
    Generated label and keywords for a cluster.
    
    Result of keyword extraction from video titles.
    """
    label: str
    keywords: list[str]
