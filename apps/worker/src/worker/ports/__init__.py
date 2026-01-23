"""
Ports layer - interface definitions (Protocols).

This layer defines contracts (Protocols) that:
- The orchestration/app layer depends on
- The infra layer implements

Using Protocol instead of ABCs for:
- Structural subtyping (duck typing)
- No inheritance required
- mypy-friendly

No implementations live here - only type definitions.
"""

from .youtube import YouTubeClientProtocol
from .repositories import (
    VideoRepositoryProtocol,
    SnapshotRepositoryProtocol,
    ClusterRepositoryProtocol,
    ScoreRepositoryProtocol,
    ChannelRepositoryProtocol,
    IngestionStateRepositoryProtocol,
    EmbeddingRepositoryProtocol,
)
from .embeddings import EmbedderProtocol
from .metrics import MetricsCollectorProtocol
from .clock import ClockProtocol

__all__ = [
    # YouTube
    "YouTubeClientProtocol",
    # Repositories
    "VideoRepositoryProtocol",
    "SnapshotRepositoryProtocol",
    "ClusterRepositoryProtocol",
    "ScoreRepositoryProtocol",
    "ChannelRepositoryProtocol",
    "IngestionStateRepositoryProtocol",
    "EmbeddingRepositoryProtocol",
    # Other clients
    "EmbedderProtocol",
    "MetricsCollectorProtocol",
    "ClockProtocol",
]
