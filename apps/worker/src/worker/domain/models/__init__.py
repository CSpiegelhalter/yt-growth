"""
Domain models - core data structures.

All models are immutable dataclasses representing domain concepts.
"""

from .video import Video, DiscoveredVideo, VideoSearchResult, VideoStats
from .channel import Channel, ChannelInfo
from .snapshot import Snapshot, SnapshotCandidate
from .embedding import EmbeddingRecord
from .cluster import Cluster, ClusterMetrics
from .score import VideoScore
from .window import Window, WindowConfig, Tier, TierConfig
from .gating import GatingResult, GatingStats

__all__ = [
    "Video",
    "DiscoveredVideo",
    "VideoSearchResult",
    "VideoStats",
    "Channel",
    "ChannelInfo",
    "Snapshot",
    "SnapshotCandidate",
    "EmbeddingRecord",
    "Cluster",
    "ClusterMetrics",
    "VideoScore",
    "Window",
    "WindowConfig",
    "Tier",
    "TierConfig",
    "GatingResult",
    "GatingStats",
]
