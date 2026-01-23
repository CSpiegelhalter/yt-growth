"""
Repository protocols for data persistence.

Responsibility: Define contracts for database operations.
Depends on: Domain models.
Does not depend on: Any implementation details (psycopg, SQL, etc.).
"""

from typing import Protocol, Any
from datetime import datetime

from ..domain.models import (
    DiscoveredVideo,
    Snapshot,
    Cluster,
    VideoScore,
    Channel,
    EmbeddingRecord,
)


class VideoRepositoryProtocol(Protocol):
    """Protocol for video persistence operations."""
    
    def upsert_video(self, video: DiscoveredVideo) -> bool:
        """
        Upsert a discovered video.
        
        Returns True if inserted (new), False if updated (existing).
        """
        ...
    
    def upsert_videos_batch(
        self,
        videos: list[DiscoveredVideo],
    ) -> tuple[int, int]:
        """
        Upsert multiple discovered videos in a batch.
        
        Returns:
            Tuple of (inserted_count, updated_count)
        """
        ...
    
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
        ...
    
    def get_existing_video_ids(
        self,
        since_days: int = 7,
    ) -> set[str]:
        """
        Get video IDs discovered within the given timeframe.
        
        Returns:
            Set of video IDs
        """
        ...
    
    def get_unique_channel_ids(
        self,
        limit: int = 100,
        since_days: int = 30,
    ) -> list[str]:
        """
        Get unique channel IDs from recently discovered videos.
        
        Useful for RSS expansion - find more videos from known channels.
        
        Returns:
            List of channel IDs
        """
        ...


class SnapshotRepositoryProtocol(Protocol):
    """Protocol for snapshot persistence operations."""
    
    def insert_snapshot(self, snapshot: Snapshot) -> bool:
        """
        Insert a stat snapshot for a video.
        
        Returns True if successful.
        """
        ...
    
    def insert_snapshots_batch(
        self,
        snapshots: list[Snapshot],
    ) -> int:
        """
        Insert multiple snapshots in a batch.
        
        Returns:
            Number of snapshots inserted
        """
        ...
    
    def get_due_videos(
        self,
        tier_a_hours: int,
        tier_b_hours: int,
        tier_c_hours: int,
        max_per_run: int,
    ) -> list[dict[str, Any]]:
        """
        Get videos that are due for a snapshot.
        
        Returns:
            List of snapshot candidate dicts
        """
        ...


class ClusterRepositoryProtocol(Protocol):
    """Protocol for cluster persistence operations."""
    
    def upsert_cluster(self, cluster: Cluster) -> None:
        """Upsert a niche cluster (idempotent by cluster_id)."""
        ...
    
    def upsert_cluster_videos(
        self,
        cluster_id: str,
        video_ids: list[str],
    ) -> None:
        """Upsert cluster membership (idempotent)."""
        ...
    
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
        ...
    
    def fetch_clusters_with_scores(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch clusters with their video scores for ranking.
        
        Returns:
            List of cluster dicts with aggregated score data
        """
        ...


class ScoreRepositoryProtocol(Protocol):
    """Protocol for video score persistence operations."""
    
    def fetch_video_scores(self, window: str) -> list[dict[str, Any]]:
        """Fetch computed scores for videos in window."""
        ...
    
    def upsert_video_score(self, score: VideoScore) -> None:
        """Upsert a video score record."""
        ...
    
    def fetch_videos_for_scoring(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch videos with snapshot data needed for scoring.
        
        Returns:
            List of video dicts with snapshot and channel data
        """
        ...
    
    def update_cluster_metrics(
        self,
        cluster_id: str,
        median_velocity: float | None,
        avg_subs: float | None,
        concentration: float | None,
        opportunity: float | None,
    ) -> None:
        """Update computed metrics for a cluster."""
        ...


class ChannelRepositoryProtocol(Protocol):
    """Protocol for channel persistence operations."""
    
    def upsert_channel(self, channel: Channel) -> bool:
        """
        Upsert a channel profile.
        
        Returns True if inserted (new), False if updated.
        """
        ...
    
    def upsert_channels_batch(
        self,
        channels: list[Channel],
    ) -> int:
        """
        Upsert multiple channel profiles.
        
        Returns:
            Number of channels upserted
        """
        ...
    
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
        ...
    
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
        ...
    
    def compute_channel_baselines(self) -> int:
        """
        Compute rolling baseline metrics for channels.
        
        Returns:
            Number of channels updated
        """
        ...
    
    def get_channel_counts_24h(
        self,
        channel_ids: list[str],
    ) -> dict[str, int]:
        """
        Get recent video counts per channel.
        
        Returns:
            Dict mapping channel_id to video count
        """
        ...


class IngestionStateRepositoryProtocol(Protocol):
    """Protocol for ingestion state tracking."""
    
    def get_cursor(self, feeder: str) -> int:
        """Get current cursor position for a feeder."""
        ...
    
    def save_cursor(
        self,
        feeder: str,
        position: int,
        videos_added: int,
    ) -> None:
        """Save cursor position and stats for a feeder."""
        ...
    
    def update_feeder_stats(
        self,
        feeder: str,
        videos_added: int,
    ) -> None:
        """Update feeder stats without changing cursor."""
        ...


class EmbeddingRepositoryProtocol(Protocol):
    """Protocol for embedding persistence operations."""
    
    def fetch_embeddings_for_window(
        self,
        window: str,
    ) -> list[dict[str, Any]]:
        """
        Fetch all embeddings for videos within the given time window.
        
        Returns:
            List of records with video_id, title, and embedding
        """
        ...
    
    def upsert_embeddings(
        self,
        embeddings: list[EmbeddingRecord],
    ) -> int:
        """
        Upsert video embeddings (idempotent).
        
        Returns:
            Number of rows upserted
        """
        ...
