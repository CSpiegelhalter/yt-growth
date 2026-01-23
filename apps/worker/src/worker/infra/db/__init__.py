"""
Database infrastructure - PostgreSQL repositories.

Responsibility: Implement repository protocols with psycopg.
Depends on: psycopg, domain models.
"""

from .connection import get_connection
from .video_repo import PostgresVideoRepository
from .snapshot_repo import PostgresSnapshotRepository
from .cluster_repo import PostgresClusterRepository
from .score_repo import PostgresScoreRepository
from .channel_repo import PostgresChannelRepository
from .ingestion_state import PostgresIngestionStateRepository
from .embedding_repo import PostgresEmbeddingRepository

__all__ = [
    "get_connection",
    "PostgresVideoRepository",
    "PostgresSnapshotRepository",
    "PostgresClusterRepository",
    "PostgresScoreRepository",
    "PostgresChannelRepository",
    "PostgresIngestionStateRepository",
    "PostgresEmbeddingRepository",
]
