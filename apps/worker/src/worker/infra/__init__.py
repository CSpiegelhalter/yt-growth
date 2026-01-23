"""
Infrastructure layer - external I/O implementations.

This layer contains concrete implementations of the ports:
- YouTube API client
- Database repositories
- OpenAI embedder
- Metrics logger

All external I/O (HTTP, database, logging) happens here.
"""

from .youtube import YouTubeClient, QuotaExceededError, YouTubeAPIError
from .db import (
    get_connection,
    PostgresVideoRepository,
    PostgresSnapshotRepository,
    PostgresClusterRepository,
    PostgresScoreRepository,
    PostgresChannelRepository,
    PostgresIngestionStateRepository,
    PostgresEmbeddingRepository,
)
from .embeddings import OpenAIEmbedder
from .metrics import JsonMetricsCollector, Timer

__all__ = [
    # YouTube
    "YouTubeClient",
    "QuotaExceededError",
    "YouTubeAPIError",
    # Database
    "get_connection",
    "PostgresVideoRepository",
    "PostgresSnapshotRepository",
    "PostgresClusterRepository",
    "PostgresScoreRepository",
    "PostgresChannelRepository",
    "PostgresIngestionStateRepository",
    "PostgresEmbeddingRepository",
    # Embeddings
    "OpenAIEmbedder",
    # Metrics
    "JsonMetricsCollector",
    "Timer",
]
