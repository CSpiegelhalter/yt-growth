"""
Snapshot repository implementation.

Responsibility: Implement SnapshotRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

from typing import Any
import logging
import psycopg

from ...domain.models import Snapshot
from ...ports.repositories import SnapshotRepositoryProtocol

logger = logging.getLogger(__name__)


class PostgresSnapshotRepository(SnapshotRepositoryProtocol):
    """PostgreSQL implementation of snapshot repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def insert_snapshot(self, snapshot: Snapshot) -> bool:
        """
        Insert a stat snapshot for a video.
        
        Returns True if successful.
        """
        with self.conn.cursor() as cur:
            try:
                cur.execute("""
                    INSERT INTO video_stat_snapshots (
                        video_id, captured_at, view_count, like_count, comment_count
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    snapshot.video_id,
                    snapshot.captured_at,
                    snapshot.view_count,
                    snapshot.like_count,
                    snapshot.comment_count,
                ))
                self.conn.commit()
                return True
            except Exception:
                self.conn.rollback()
                return False
    
    def insert_snapshots_batch(
        self,
        snapshots: list[Snapshot],
    ) -> int:
        """
        Insert multiple snapshots in a batch.
        
        Returns:
            Number of snapshots inserted
        """
        if not snapshots:
            return 0
        
        inserted = 0
        with self.conn.cursor() as cur:
            for s in snapshots:
                try:
                    cur.execute("""
                        INSERT INTO video_stat_snapshots (
                            video_id, captured_at, view_count, like_count, comment_count
                        ) VALUES (%s, now(), %s, %s, %s)
                    """, (
                        s.video_id,
                        s.view_count,
                        s.like_count,
                        s.comment_count,
                    ))
                    inserted += 1
                except Exception:
                    # Skip duplicates or constraint violations
                    continue
            
            self.conn.commit()
        
        return inserted
    
    def get_due_videos(
        self,
        tier_a_hours: int,
        tier_b_hours: int,
        tier_c_hours: int,
        max_per_run: int,
    ) -> list[dict[str, Any]]:
        """
        Get videos that are due for a snapshot.
        
        Uses SKIP LOCKED to support concurrent workers.
        
        Returns:
            List of snapshot candidate dicts
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                WITH video_tiers AS (
                    SELECT 
                        dv.video_id,
                        dv.channel_id,
                        dv.published_at,
                        vs.velocity_24h,
                        (SELECT MAX(captured_at) FROM video_stat_snapshots ss WHERE ss.video_id = dv.video_id) as last_snapshot_at,
                        CASE 
                            WHEN dv.published_at > now() - interval '48 hours' THEN 'A'
                            WHEN COALESCE(vs.velocity_24h, 0) > 10000 THEN 'A'
                            WHEN dv.published_at > now() - interval '7 days' THEN 'B'
                            WHEN COALESCE(vs.velocity_24h, 0) > 1000 THEN 'B'
                            ELSE 'C'
                        END as tier
                    FROM discovered_videos dv
                    LEFT JOIN video_scores vs ON dv.video_id = vs.video_id AND vs."window" = '7d'
                    WHERE dv.published_at > now() - interval '90 days'
                )
                SELECT 
                    video_id,
                    channel_id,
                    published_at,
                    velocity_24h,
                    last_snapshot_at,
                    tier
                FROM video_tiers
                WHERE 
                    (tier = 'A' AND (last_snapshot_at IS NULL OR last_snapshot_at < now() - make_interval(hours => %s)))
                    OR (tier = 'B' AND (last_snapshot_at IS NULL OR last_snapshot_at < now() - make_interval(hours => %s)))
                    OR (tier = 'C' AND (last_snapshot_at IS NULL OR last_snapshot_at < now() - make_interval(hours => %s)))
                ORDER BY 
                    CASE tier WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END,
                    last_snapshot_at NULLS FIRST
                LIMIT %s
                FOR UPDATE SKIP LOCKED
            """, (tier_a_hours, tier_b_hours, tier_c_hours, max_per_run))
            
            return list(cur.fetchall())
    
    def save_snapshot_stats(
        self,
        video_stats: dict[str, Any],
    ) -> int:
        """
        Save snapshot stats from YouTube API response.
        
        Args:
            video_stats: Dict mapping video_id to stats dict
            
        Returns:
            Number of snapshots saved
        """
        saved = 0
        with self.conn.cursor() as cur:
            for video_id, stats in video_stats.items():
                try:
                    cur.execute("""
                        INSERT INTO video_stat_snapshots (
                            video_id, captured_at, view_count, like_count, comment_count
                        ) VALUES (%s, now(), %s, %s, %s)
                    """, (
                        video_id,
                        stats.view_count,
                        stats.like_count,
                        stats.comment_count,
                    ))
                    saved += 1
                except Exception as e:
                    logger.error(f"Error saving snapshot for {video_id}: {e}")
            
            self.conn.commit()
        
        return saved
