"""
Channel repository implementation.

Responsibility: Implement ChannelRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

import logging
import psycopg

from ...domain.models import Channel
from ...ports.repositories import ChannelRepositoryProtocol

logger = logging.getLogger(__name__)


class PostgresChannelRepository(ChannelRepositoryProtocol):
    """PostgreSQL implementation of channel repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def upsert_channel(self, channel: Channel) -> bool:
        """
        Upsert a channel profile.
        
        Returns True if inserted (new), False if updated.
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO channel_profiles_lite (
                    channel_id, channel_title, subscriber_count, channel_published_at,
                    last_fetched_at, updated_at
                ) VALUES (%s, %s, %s, %s, now(), now())
                ON CONFLICT (channel_id) DO UPDATE SET
                    channel_title = COALESCE(EXCLUDED.channel_title, channel_profiles_lite.channel_title),
                    subscriber_count = COALESCE(EXCLUDED.subscriber_count, channel_profiles_lite.subscriber_count),
                    channel_published_at = COALESCE(EXCLUDED.channel_published_at, channel_profiles_lite.channel_published_at),
                    last_fetched_at = now(),
                    updated_at = now()
                RETURNING (xmax = 0) as inserted
            """, (
                channel.channel_id,
                channel.channel_title,
                channel.subscriber_count,
                channel.channel_published_at,
            ))
            
            row = cur.fetchone()
            self.conn.commit()
            return row["inserted"] if row else False
    
    def upsert_channels_batch(
        self,
        channels: list[Channel],
    ) -> int:
        """
        Upsert multiple channel profiles.
        
        Returns:
            Number of channels upserted
        """
        if not channels:
            return 0
        
        upserted = 0
        with self.conn.cursor() as cur:
            for c in channels:
                cur.execute("""
                    INSERT INTO channel_profiles_lite (
                        channel_id, channel_title, subscriber_count, channel_published_at,
                        last_fetched_at, updated_at
                    ) VALUES (
                        %(channel_id)s, %(channel_title)s, %(subscriber_count)s, %(channel_published_at)s,
                        now(), now()
                    )
                    ON CONFLICT (channel_id) DO UPDATE SET
                        channel_title = COALESCE(EXCLUDED.channel_title, channel_profiles_lite.channel_title),
                        subscriber_count = COALESCE(EXCLUDED.subscriber_count, channel_profiles_lite.subscriber_count),
                        channel_published_at = COALESCE(EXCLUDED.channel_published_at, channel_profiles_lite.channel_published_at),
                        last_fetched_at = now(),
                        updated_at = now()
                """, {
                    "channel_id": c.channel_id,
                    "channel_title": c.channel_title,
                    "subscriber_count": c.subscriber_count,
                    "channel_published_at": c.channel_published_at,
                })
                upserted += 1
            
            self.conn.commit()
        
        return upserted
    
    def get_stale_channels(
        self,
        hours: int = 24,
        limit: int = 100,
    ) -> list[str]:
        """
        Get channel IDs that haven't been fetched recently.
        
        Returns:
            List of channel IDs
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT dv.channel_id
                FROM discovered_videos dv
                LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
                WHERE dv.published_at > now() - interval '30 days'
                  AND (cpl.channel_id IS NULL OR cpl.last_fetched_at < now() - make_interval(hours => %s))
                LIMIT %s
            """, (hours, limit))
            
            return [row["channel_id"] for row in cur.fetchall()]
    
    def get_fresh_channel_ids(
        self,
        channel_ids: list[str],
        hours: int = 24,
    ) -> set[str]:
        """
        Get which channel IDs have been fetched recently.
        
        Returns:
            Set of channel IDs that are fresh
        """
        if not channel_ids:
            return set()
        
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT channel_id FROM channel_profiles_lite
                WHERE channel_id = ANY(%s)
                  AND last_fetched_at > now() - make_interval(hours => %s)
            """, (channel_ids, hours))
            
            return {row["channel_id"] for row in cur.fetchall()}
    
    def compute_channel_baselines(self) -> int:
        """
        Compute rolling baseline metrics for channels.
        
        Updates median_velocity_24h and median_views_per_day based on
        the channel's last 20 videos.
        
        Returns:
            Number of channels updated
        """
        logger.info("[Baseline] Computing channel baselines...")
        
        with self.conn.cursor() as cur:
            cur.execute("""
                WITH channel_stats AS (
                    SELECT 
                        dv.channel_id,
                        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY vs.velocity_24h) as median_velocity_24h,
                        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY vs.views_per_day) as median_views_per_day,
                        COUNT(*) as video_count
                    FROM discovered_videos dv
                    JOIN video_scores vs ON dv.video_id = vs.video_id AND vs."window" = '7d'
                    WHERE dv.published_at > now() - interval '90 days'
                      AND vs.velocity_24h IS NOT NULL
                    GROUP BY dv.channel_id
                    HAVING COUNT(*) >= 3
                )
                UPDATE channel_profiles_lite cpl
                SET 
                    median_velocity_24h = cs.median_velocity_24h,
                    median_views_per_day = cs.median_views_per_day,
                    video_count_for_baseline = cs.video_count,
                    updated_at = now()
                FROM channel_stats cs
                WHERE cpl.channel_id = cs.channel_id
            """)
            
            updated = cur.rowcount
            self.conn.commit()
        
        logger.info(f"[Baseline] Updated baselines for {updated} channels")
        return updated
    
    def get_channel_counts_24h(
        self,
        channel_ids: list[str],
    ) -> dict[str, int]:
        """
        Get recent video counts per channel.
        
        Returns:
            Dict mapping channel_id to video count
        """
        if not channel_ids:
            return {}
        
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT channel_id, COUNT(*) as count
                FROM discovered_videos
                WHERE channel_id = ANY(%s)
                  AND first_seen_at > now() - interval '24 hours'
                GROUP BY channel_id
            """, (channel_ids,))
            
            return {row["channel_id"]: row["count"] for row in cur.fetchall()}
