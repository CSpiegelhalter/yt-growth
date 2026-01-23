"""
Embedding repository implementation.

Responsibility: Implement EmbeddingRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

import json
from typing import Any
import psycopg

from ...domain.models import EmbeddingRecord
from ...domain.models.window import window_to_days
from ...ports.repositories import EmbeddingRepositoryProtocol


class PostgresEmbeddingRepository(EmbeddingRepositoryProtocol):
    """PostgreSQL implementation of embedding repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def fetch_embeddings_for_window(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch all embeddings for videos within the given time window.
        
        Returns:
            List of records with video_id, title, and embedding
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    dv.video_id,
                    dv.title,
                    dv.channel_id,
                    dv.channel_title,
                    dv.thumbnail_url,
                    dv.published_at,
                    ve.embedding::text as embedding
                FROM discovered_videos dv
                JOIN video_embeddings ve ON dv.video_id = ve.video_id
                WHERE dv.published_at > now() - make_interval(days => %s)
            """, (window_to_days(window),))
            return list(cur.fetchall())
    
    def upsert_embeddings(
        self,
        embeddings: list[EmbeddingRecord],
    ) -> int:
        """
        Upsert video embeddings (idempotent).
        
        Returns:
            Number of rows upserted
        """
        if not embeddings:
            return 0
        
        with self.conn.cursor() as cur:
            # Use executemany with ON CONFLICT for idempotent upsert
            cur.executemany("""
                INSERT INTO video_embeddings (video_id, embedding, model, embedded_at)
                VALUES (%(video_id)s, %(embedding)s::vector, %(model)s, now())
                ON CONFLICT (video_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    model = EXCLUDED.model,
                    embedded_at = now()
            """, [{
                "video_id": e.video_id,
                "embedding": json.dumps(e.embedding),
                "model": e.model,
            } for e in embeddings])
            self.conn.commit()
            return len(embeddings)
