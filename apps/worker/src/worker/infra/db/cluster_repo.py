"""
Cluster repository implementation.

Responsibility: Implement ClusterRepositoryProtocol with PostgreSQL.
Depends on: psycopg, domain models.
"""

from typing import Any
import psycopg

from ...domain.models import Cluster
from ...ports.repositories import ClusterRepositoryProtocol


class PostgresClusterRepository(ClusterRepositoryProtocol):
    """PostgreSQL implementation of cluster repository."""
    
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
    
    def upsert_cluster(self, cluster: Cluster) -> None:
        """Upsert a niche cluster (idempotent by cluster_id)."""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO niche_clusters (
                    cluster_id, "window", label, keywords, computed_at,
                    median_velocity_24h, median_views_per_day, unique_channels,
                    total_videos, avg_days_old, avg_channel_subs,
                    winner_concentration, opportunity_score
                ) VALUES (
                    %(cluster_id)s, %(window)s, %(label)s, %(keywords)s, now(),
                    %(median_velocity_24h)s, %(median_views_per_day)s, %(unique_channels)s,
                    %(total_videos)s, %(avg_days_old)s, %(avg_channel_subs)s,
                    %(winner_concentration)s, %(opportunity_score)s
                )
                ON CONFLICT (cluster_id) DO UPDATE SET
                    label = EXCLUDED.label,
                    keywords = EXCLUDED.keywords,
                    computed_at = now(),
                    median_velocity_24h = EXCLUDED.median_velocity_24h,
                    median_views_per_day = EXCLUDED.median_views_per_day,
                    unique_channels = EXCLUDED.unique_channels,
                    total_videos = EXCLUDED.total_videos,
                    avg_days_old = EXCLUDED.avg_days_old,
                    avg_channel_subs = EXCLUDED.avg_channel_subs,
                    winner_concentration = EXCLUDED.winner_concentration,
                    opportunity_score = EXCLUDED.opportunity_score
            """, {
                "cluster_id": cluster.cluster_id,
                "window": cluster.window,
                "label": cluster.label,
                "keywords": cluster.keywords,
                "median_velocity_24h": cluster.metrics.median_velocity_24h,
                "median_views_per_day": cluster.metrics.median_views_per_day,
                "unique_channels": cluster.metrics.unique_channels,
                "total_videos": cluster.metrics.total_videos,
                "avg_days_old": cluster.metrics.avg_days_old,
                "avg_channel_subs": cluster.metrics.avg_channel_subs,
                "winner_concentration": cluster.metrics.winner_concentration,
                "opportunity_score": cluster.metrics.opportunity_score,
            })
            self.conn.commit()
    
    def upsert_cluster_videos(
        self,
        cluster_id: str,
        video_ids: list[str],
    ) -> None:
        """Upsert cluster membership (idempotent)."""
        with self.conn.cursor() as cur:
            # Delete existing membership for this cluster
            cur.execute("DELETE FROM niche_cluster_videos WHERE cluster_id = %s", (cluster_id,))
            
            # Insert new membership
            if video_ids:
                cur.executemany("""
                    INSERT INTO niche_cluster_videos (cluster_id, video_id, rank_in_cluster)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cluster_id, video_id) DO UPDATE SET
                        rank_in_cluster = EXCLUDED.rank_in_cluster
                """, [(cluster_id, vid, rank) for rank, vid in enumerate(video_ids)])
            
            self.conn.commit()
    
    def delete_stale_clusters(
        self,
        window: str,
        current_cluster_ids: set[str],
    ) -> int:
        """
        Delete clusters that are no longer valid for this window.
        
        Returns:
            Number of clusters deleted
        """
        with self.conn.cursor() as cur:
            if current_cluster_ids:
                cur.execute("""
                    DELETE FROM niche_clusters 
                    WHERE "window" = %s AND cluster_id != ALL(%s::uuid[])
                """, (window, list(current_cluster_ids)))
            else:
                cur.execute('DELETE FROM niche_clusters WHERE "window" = %s', (window,))
            deleted = cur.rowcount
            self.conn.commit()
            return deleted
    
    def fetch_clusters_with_scores(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch clusters with their video scores for ranking.
        
        Returns:
            List of cluster dicts with aggregated score data
        """
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    nc.cluster_id,
                    nc.label,
                    array_agg(vs.video_id) as video_ids,
                    array_agg(vs.velocity_24h) as velocities,
                    array_agg(vs.view_count) as view_counts,
                    array_agg(cpl.subscriber_count) as subscriber_counts
                FROM niche_clusters nc
                JOIN niche_cluster_videos ncv ON nc.cluster_id = ncv.cluster_id
                JOIN video_scores vs ON ncv.video_id = vs.video_id AND vs."window" = nc."window"
                JOIN discovered_videos dv ON ncv.video_id = dv.video_id
                LEFT JOIN channel_profiles_lite cpl ON dv.channel_id = cpl.channel_id
                WHERE nc."window" = %s
                GROUP BY nc.cluster_id, nc.label
            """, (window,))
            
            return list(cur.fetchall())
