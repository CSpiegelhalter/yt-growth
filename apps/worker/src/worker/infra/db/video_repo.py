"""
Video repository implementation.

Responsibility: Implement VideoRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

from typing import Any
import psycopg

from ...domain.models import DiscoveredVideo
from ...domain.models.window import window_to_days
from ...ports.repositories import VideoRepositoryProtocol


class PostgresVideoRepository(VideoRepositoryProtocol):
    """PostgreSQL implementation of video repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def upsert_video(self, video: DiscoveredVideo) -> bool:
        """
        Upsert a discovered video.
        
        Returns True if inserted (new), False if updated (existing).
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO discovered_videos (
                    video_id, channel_id, channel_title, title, thumbnail_url,
                    published_at, feeder, seed, duration_sec, language, tags,
                    first_seen_at, last_seen_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now()
                )
                ON CONFLICT (video_id) DO UPDATE SET
                    last_seen_at = now(),
                    title = EXCLUDED.title,
                    thumbnail_url = EXCLUDED.thumbnail_url,
                    channel_title = EXCLUDED.channel_title
                RETURNING (xmax = 0) as inserted
            """, (
                video.video_id, video.channel_id, video.channel_title, video.title,
                video.thumbnail_url, video.published_at, video.feeder, video.seed,
                video.duration_sec, video.language, video.tags or [],
            ))
            
            row = cur.fetchone()
            self.conn.commit()
            return row["inserted"] if row else False
    
    def upsert_videos_batch(
        self,
        videos: list[DiscoveredVideo],
    ) -> tuple[int, int]:
        """
        Upsert multiple discovered videos in a batch.
        
        Returns:
            Tuple of (inserted_count, updated_count)
        """
        if not videos:
            return 0, 0
        
        inserted = 0
        updated = 0
        
        with self.conn.cursor() as cur:
            for v in videos:
                cur.execute("""
                    INSERT INTO discovered_videos (
                        video_id, channel_id, channel_title, title, thumbnail_url,
                        published_at, feeder, seed, duration_sec, language, tags,
                        first_seen_at, last_seen_at
                    ) VALUES (
                        %(video_id)s, %(channel_id)s, %(channel_title)s, %(title)s, %(thumbnail_url)s,
                        %(published_at)s, %(feeder)s, %(seed)s, %(duration_sec)s, %(language)s, %(tags)s,
                        now(), now()
                    )
                    ON CONFLICT (video_id) DO UPDATE SET
                        last_seen_at = now(),
                        title = EXCLUDED.title,
                        thumbnail_url = EXCLUDED.thumbnail_url,
                        channel_title = EXCLUDED.channel_title
                    RETURNING (xmax = 0) as is_insert
                """, {
                    "video_id": v.video_id,
                    "channel_id": v.channel_id,
                    "channel_title": v.channel_title,
                    "title": v.title,
                    "thumbnail_url": v.thumbnail_url,
                    "published_at": v.published_at,
                    "feeder": v.feeder,
                    "seed": v.seed,
                    "duration_sec": v.duration_sec,
                    "language": v.language,
                    "tags": v.tags or [],
                })
                
                row = cur.fetchone()
                if row and row["is_insert"]:
                    inserted += 1
                else:
                    updated += 1
            
            self.conn.commit()
        
        return inserted, updated
    
    def fetch_videos_without_embeddings(
        self,
        window: str,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """
        Fetch discovered videos that don't have embeddings yet.
        
        Returns:
            List of video records with video_id and title
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT dv.video_id, dv.title
                FROM discovered_videos dv
                LEFT JOIN video_embeddings ve ON dv.video_id = ve.video_id
                WHERE ve.video_id IS NULL
                  AND dv.published_at > now() - make_interval(days => %s)
                ORDER BY dv.first_seen_at DESC
                LIMIT %s
            """, (window_to_days(window), limit))
            return list(cur.fetchall())
    
    def get_existing_video_ids(
        self,
        since_days: int = 7,
    ) -> set[str]:
        """
        Get video IDs discovered within the given timeframe.
        
        Returns:
            Set of video IDs
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT video_id FROM discovered_videos
                WHERE first_seen_at > now() - make_interval(days => %s)
            """, (since_days,))
            return {row["video_id"] for row in cur.fetchall()}
    
    def get_unique_channel_ids(
        self,
        limit: int = 100,
        since_days: int = 30,
    ) -> list[str]:
        """
        Get unique channel IDs from recently discovered videos.
        
        Useful for RSS expansion - find more videos from known channels.
        
        Args:
            limit: Max channels to return
            since_days: Only consider videos discovered within this timeframe
            
        Returns:
            List of channel IDs, ordered by most recent discovery
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT ON (channel_id) channel_id
                FROM discovered_videos
                WHERE first_seen_at > now() - make_interval(days => %s)
                ORDER BY channel_id, first_seen_at DESC
                LIMIT %s
            """, (since_days, limit))
            return [row["channel_id"] for row in cur.fetchall()]
