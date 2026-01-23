"""
Configuration management via environment variables.

Responsibility: Load and validate configuration.
Depends on: os, dotenv.
"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Worker configuration loaded from environment variables."""
    
    database_url: str
    embedding_api_key: str
    embedding_model: str
    embedding_dim: int
    
    # YouTube API settings (for ingestion/snapshotting)
    youtube_api_key: str | None
    
    # Embedding tuning parameters
    embedding_batch_size: int = 100
    
    # Clustering tuning parameters
    cluster_min_size: int = 5
    umap_n_components: int = 25
    umap_n_neighbors: int = 15
    
    # Ingestion tuning parameters
    ingest_seeds_per_run: int = 5     # 5 queries × 100 = 500 quota
    ingest_videos_per_seed: int = 10  # Results per query
    ingest_longtail_queries: int = 5  # 5 queries × 100 = 500 quota
    ingest_max_per_channel: int = 5
    ingest_min_views_24h: int = 100
    ingest_min_views_7d: int = 500
    ingest_min_views_30d: int = 2000
    ingest_interval_seconds: int = 600
    
    # Snapshotting tuning parameters
    snapshot_batch_size: int = 50
    snapshot_tier_a_hours: int = 4
    snapshot_tier_b_hours: int = 12
    snapshot_tier_c_hours: int = 24
    snapshot_interval_seconds: int = 300
    snapshot_max_per_run: int = 500
    
    # Quota budgeting
    youtube_daily_quota: int = 10000
    youtube_quota_buffer: float = 0.1
    
    @classmethod
    def from_env(cls) -> "Config":
        """Load configuration from environment variables."""
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        embedding_api_key = os.environ.get("EMBEDDING_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not embedding_api_key:
            raise ValueError("EMBEDDING_API_KEY or OPENAI_API_KEY environment variable is required")
        
        # YouTube API key is optional (only needed for ingest/snapshot modes)
        youtube_api_key = os.environ.get("YOUTUBE_API_KEY")
        
        return cls(
            database_url=database_url,
            embedding_api_key=embedding_api_key,
            embedding_model=os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small"),
            embedding_dim=int(os.environ.get("EMBEDDING_DIM", "1536")),
            youtube_api_key=youtube_api_key,
            embedding_batch_size=int(os.environ.get("EMBEDDING_BATCH_SIZE", "100")),
            cluster_min_size=int(os.environ.get("CLUSTER_MIN_SIZE", "5")),
            umap_n_components=int(os.environ.get("UMAP_N_COMPONENTS", "25")),
            umap_n_neighbors=int(os.environ.get("UMAP_N_NEIGHBORS", "15")),
            ingest_seeds_per_run=int(os.environ.get("INGEST_SEEDS_PER_RUN", "5")),
            ingest_videos_per_seed=int(os.environ.get("INGEST_VIDEOS_PER_SEED", "10")),
            ingest_longtail_queries=int(os.environ.get("INGEST_LONGTAIL_QUERIES", "5")),
            ingest_max_per_channel=int(os.environ.get("INGEST_MAX_PER_CHANNEL", "5")),
            ingest_min_views_24h=int(os.environ.get("INGEST_MIN_VIEWS_24H", "100")),
            ingest_min_views_7d=int(os.environ.get("INGEST_MIN_VIEWS_7D", "500")),
            ingest_min_views_30d=int(os.environ.get("INGEST_MIN_VIEWS_30D", "2000")),
            ingest_interval_seconds=int(os.environ.get("INGEST_INTERVAL_SECONDS", "600")),
            snapshot_batch_size=int(os.environ.get("SNAPSHOT_BATCH_SIZE", "50")),
            snapshot_tier_a_hours=int(os.environ.get("SNAPSHOT_TIER_A_HOURS", "4")),
            snapshot_tier_b_hours=int(os.environ.get("SNAPSHOT_TIER_B_HOURS", "12")),
            snapshot_tier_c_hours=int(os.environ.get("SNAPSHOT_TIER_C_HOURS", "24")),
            snapshot_interval_seconds=int(os.environ.get("SNAPSHOT_INTERVAL_SECONDS", "300")),
            snapshot_max_per_run=int(os.environ.get("SNAPSHOT_MAX_PER_RUN", "500")),
            youtube_daily_quota=int(os.environ.get("YOUTUBE_DAILY_QUOTA", "10000")),
            youtube_quota_buffer=float(os.environ.get("YOUTUBE_QUOTA_BUFFER", "0.1")),
        )
    
    def require_youtube_api_key(self) -> str:
        """Get YouTube API key or raise an error if not set."""
        if not self.youtube_api_key:
            raise ValueError(
                "YOUTUBE_API_KEY environment variable is required for ingestion/snapshotting. "
                "Get an API key from https://console.cloud.google.com/"
            )
        return self.youtube_api_key


# Global config instance (lazy loaded)
_config: Config | None = None


def get_config() -> Config:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = Config.from_env()
    return _config


def reset_config() -> None:
    """Reset the global config (useful for testing)."""
    global _config
    _config = None
