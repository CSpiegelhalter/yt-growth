"""
Domain layer - pure business logic and types.

This layer contains:
- Domain models (dataclasses, value objects)
- Pure computation functions (scoring, ranking, clustering algorithms)
- Business rules (gating, labeling)

This layer has NO external I/O dependencies:
- No database access
- No HTTP calls
- No environment variable reads
- No file system operations

All functions should be deterministic and side-effect free.
"""

from .models import (
    Video,
    DiscoveredVideo,
    VideoSearchResult,
    VideoStats,
    Channel,
    ChannelInfo,
    Snapshot,
    EmbeddingRecord,
    Cluster,
    ClusterMetrics,
    VideoScore,
    Window,
    WindowConfig,
    Tier,
    TierConfig,
    GatingResult,
    GatingStats,
)

__all__ = [
    # Video types
    "Video",
    "DiscoveredVideo",
    "VideoSearchResult",
    "VideoStats",
    # Channel types
    "Channel",
    "ChannelInfo",
    # Snapshot
    "Snapshot",
    # Embedding
    "EmbeddingRecord",
    # Cluster
    "Cluster",
    "ClusterMetrics",
    # Score
    "VideoScore",
    # Window/Tier
    "Window",
    "WindowConfig",
    "Tier",
    "TierConfig",
    # Gating
    "GatingResult",
    "GatingStats",
]
