"""
Embedding domain models.

Responsibility: Define embedding data structures.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class EmbeddingRecord:
    """
    A video title embedding record.
    
    Stores the embedding vector and metadata about how it was created.
    """
    video_id: str
    embedding: list[float]
    model: str
    embedded_at: datetime | None = None


@dataclass
class VideoWithEmbedding:
    """
    A video record joined with its embedding.
    
    Used for clustering operations.
    """
    video_id: str
    title: str
    channel_id: str
    channel_title: str
    thumbnail_url: str | None
    published_at: datetime
    embedding: list[float]
