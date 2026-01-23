"""
YT Growth Worker - Trending Niches Discovery Pipeline

This worker handles the complete trending discovery pipeline:
- Ingestion: YouTube search for candidate videos
- Snapshotting: YouTube videos.list for stat snapshots
- Embedding: Video titles using OpenAI
- Clustering: Videos by semantic similarity (HDBSCAN)
- Scoring: Velocity and breakout computation
- Ranking: Clusters for opportunity scoring

Architecture:
    domain/     - Pure business logic and types (no I/O)
    ports/      - Interface definitions (Protocols)
    infra/      - External I/O implementations
    app/        - Orchestration and use cases
    config/     - Configuration management
    entrypoints/- CLI and bootstrap
    common/     - Shared utilities

Usage:
    python -m worker --mode all            # Full pipeline (long-running)
    python -m worker --mode ingest --once  # One-shot ingestion
    python -m worker --mode snapshot --once # One-shot snapshotting
    python -m worker --mode process --once # One-shot processing
"""

__version__ = "0.3.0"

# Re-export commonly used items for backwards compatibility
from .config import get_config, Config
from .entrypoints.main import cli, main

# Domain models
from .domain.models import (
    Video,
    DiscoveredVideo,
    VideoSearchResult,
    VideoStats,
    Channel,
    ChannelInfo,
    Snapshot,
    Cluster,
    VideoScore,
)

# Infrastructure (for advanced usage)
from .infra.youtube import YouTubeClient, QuotaExceededError
from .infra.embeddings import OpenAIEmbedder
from .infra.metrics import JsonMetricsCollector

__all__ = [
    # Version
    "__version__",
    # Config
    "get_config",
    "Config",
    # CLI
    "cli",
    "main",
    # Domain models
    "Video",
    "DiscoveredVideo",
    "VideoSearchResult",
    "VideoStats",
    "Channel",
    "ChannelInfo",
    "Snapshot",
    "Cluster",
    "VideoScore",
    # Infrastructure
    "YouTubeClient",
    "QuotaExceededError",
    "OpenAIEmbedder",
    "JsonMetricsCollector",
]
