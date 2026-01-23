"""
Ingestion state repository implementation.

Responsibility: Track feeder cursor state for resumption.
Depends on: psycopg.
"""

import psycopg

from ...ports.repositories import IngestionStateRepositoryProtocol


class PostgresIngestionStateRepository(IngestionStateRepositoryProtocol):
    """PostgreSQL implementation of ingestion state tracking."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def get_cursor(self, feeder: str) -> int:
        """Get current cursor position for a feeder."""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT cursor_position FROM ingestion_state
                WHERE feeder = %s
            """, (feeder,))
            row = cur.fetchone()
            if row and row.get("cursor_position"):
                try:
                    return int(row["cursor_position"])
                except (ValueError, TypeError):
                    return 0
            return 0
    
    def save_cursor(
        self,
        feeder: str,
        position: int,
        videos_added: int,
    ) -> None:
        """Save cursor position and stats for a feeder."""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ingestion_state (feeder, cursor_position, last_run_at, videos_added_last_run)
                VALUES (%s, %s, now(), %s)
                ON CONFLICT (feeder) DO UPDATE SET
                    cursor_position = EXCLUDED.cursor_position,
                    last_run_at = now(),
                    videos_added_last_run = EXCLUDED.videos_added_last_run,
                    total_videos_added = ingestion_state.total_videos_added + EXCLUDED.videos_added_last_run
            """, (feeder, str(position), videos_added))
            self.conn.commit()
    
    def update_feeder_stats(
        self,
        feeder: str,
        videos_added: int,
    ) -> None:
        """Update feeder stats without changing cursor."""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ingestion_state (feeder, cursor_position, last_run_at, videos_added_last_run)
                VALUES (%s, '0', now(), %s)
                ON CONFLICT (feeder) DO UPDATE SET
                    last_run_at = now(),
                    videos_added_last_run = EXCLUDED.videos_added_last_run,
                    total_videos_added = ingestion_state.total_videos_added + EXCLUDED.videos_added_last_run
            """, (feeder, videos_added))
            self.conn.commit()
