"""
Score repository implementation.

Responsibility: Implement ScoreRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

from typing import Any
import psycopg

from ...domain.models import VideoScore
from ...domain.models.window import window_to_days
from ...ports.repositories import ScoreRepositoryProtocol


class PostgresScoreRepository(ScoreRepositoryProtocol):
    """PostgreSQL implementation of score repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def fetch_video_scores(self, window: str) -> list[dict[str, Any]]:
        """Fetch computed scores for videos in window."""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    vs.*,
                    dv.channel_id,
                    dv.published_at,
                    cpl.subscriber_count,
                    cpl.median_velocity_24h as channel_median_velocity
                FROM video_scores vs
                JOIN discovered_videos dv ON vs.video_id = dv.video_id
                LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
                WHERE vs."window" = %s
            """, (window,))
            return list(cur.fetchall())
    
    def upsert_video_score(self, score: VideoScore) -> None:
        """Upsert a video score record."""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO video_scores (
                    video_id, "window", view_count, views_per_day,
                    velocity_24h, velocity_7d, acceleration,
                    breakout_by_subs, breakout_by_baseline, computed_at
                ) VALUES (
                    %(video_id)s, %(window)s, %(view_count)s, %(views_per_day)s,
                    %(velocity_24h)s, %(velocity_7d)s, %(acceleration)s,
                    %(breakout_by_subs)s, %(breakout_by_baseline)s, now()
                )
                ON CONFLICT (video_id, "window") DO UPDATE SET
                    view_count = EXCLUDED.view_count,
                    views_per_day = EXCLUDED.views_per_day,
                    velocity_24h = EXCLUDED.velocity_24h,
                    velocity_7d = EXCLUDED.velocity_7d,
                    acceleration = EXCLUDED.acceleration,
                    breakout_by_subs = EXCLUDED.breakout_by_subs,
                    breakout_by_baseline = EXCLUDED.breakout_by_baseline,
                    computed_at = now()
            """, {
                "video_id": score.video_id,
                "window": score.window,
                "view_count": score.view_count,
                "views_per_day": score.views_per_day,
                "velocity_24h": score.velocity_24h,
                "velocity_7d": score.velocity_7d,
                "acceleration": score.acceleration,
                "breakout_by_subs": score.breakout_by_subs,
                "breakout_by_baseline": score.breakout_by_baseline,
            })
            self.conn.commit()
    
    def fetch_videos_for_scoring(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch videos with snapshot data needed for scoring.
        
        Returns:
            List of video dicts with snapshot and channel data
        """
        days = window_to_days(window)
        
        with self.conn.cursor() as cur:
            cur.execute("""
                WITH latest_snapshots AS (
                    SELECT DISTINCT ON (video_id)
                        video_id,
                        view_count,
                        captured_at
                    FROM video_stat_snapshots
                    ORDER BY video_id, captured_at DESC
                ),
                snapshots_24h_ago AS (
                    SELECT DISTINCT ON (video_id)
                        video_id,
                        view_count as view_count_24h_ago
                    FROM video_stat_snapshots
                    WHERE captured_at < now() - interval '24 hours'
                    ORDER BY video_id, captured_at DESC
                ),
                snapshots_7d_ago AS (
                    SELECT DISTINCT ON (video_id)
                        video_id,
                        view_count as view_count_7d_ago
                    FROM video_stat_snapshots
                    WHERE captured_at < now() - interval '7 days'
                    ORDER BY video_id, captured_at DESC
                )
                SELECT 
                    dv.video_id,
                    dv.channel_id,
                    dv.published_at,
                    COALESCE(ls.view_count, 0) as view_count,
                    s24.view_count_24h_ago,
                    s7.view_count_7d_ago,
                    cpl.subscriber_count,
                    cpl.median_velocity_24h as channel_median_velocity
                FROM discovered_videos dv
                LEFT JOIN latest_snapshots ls ON dv.video_id = ls.video_id
                LEFT JOIN snapshots_24h_ago s24 ON dv.video_id = s24.video_id
                LEFT JOIN snapshots_7d_ago s7 ON dv.video_id = s7.video_id
                LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
                WHERE dv.published_at > now() - make_interval(days => %s)
            """, (days,))
            
            return list(cur.fetchall())
    
    def update_cluster_metrics(
        self,
        cluster_id: str,
        median_velocity: float | None,
        avg_subs: float | None,
        concentration: float | None,
        opportunity: float | None,
    ) -> None:
        """Update computed metrics for a cluster."""
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE niche_clusters SET
                    median_velocity_24h = %s,
                    avg_channel_subs = %s,
                    winner_concentration = %s,
                    opportunity_score = %s,
                    computed_at = now()
                WHERE cluster_id = %s
            """, (median_velocity, avg_subs, concentration, opportunity, cluster_id))
            self.conn.commit()
