"""
Metrics collector protocol.

Responsibility: Define the contract for metrics and logging.
Depends on: Domain models (metrics dataclasses).
Does not depend on: Any implementation details.
"""

from typing import Protocol, Any
from dataclasses import dataclass


@dataclass
class IngestMetrics:
    """Metrics for an ingestion run."""
    run_id: str = ""
    started_at: str = ""
    finished_at: str = ""
    duration_seconds: float = 0.0
    
    # Feeder stats
    seeds_processed: int = 0
    queries_executed: int = 0
    
    # Candidate stats
    candidates_found: int = 0
    candidates_accepted: int = 0
    candidates_rejected_duplicate: int = 0
    candidates_rejected_too_old: int = 0
    candidates_rejected_channel_cap: int = 0
    
    # DB stats
    videos_inserted: int = 0
    videos_updated: int = 0
    
    # Quota stats
    quota_used: int = 0
    quota_remaining: int = 0
    
    # Errors
    errors: int = 0


@dataclass
class SnapshotMetrics:
    """Metrics for a snapshot run."""
    run_id: str = ""
    started_at: str = ""
    finished_at: str = ""
    duration_seconds: float = 0.0
    
    # Selection stats
    videos_due: int = 0
    videos_tier_a: int = 0
    videos_tier_b: int = 0
    videos_tier_c: int = 0
    
    # Snapshot stats
    videos_snapshotted: int = 0
    channels_updated: int = 0
    
    # Quota stats
    quota_used: int = 0
    quota_remaining: int = 0
    
    # Errors
    errors: int = 0


@dataclass
class ProcessMetrics:
    """Metrics for a processing run (embed/cluster/score/rank)."""
    run_id: str = ""
    started_at: str = ""
    finished_at: str = ""
    duration_seconds: float = 0.0
    
    # Step durations
    embed_duration_seconds: float = 0.0
    cluster_duration_seconds: float = 0.0
    score_duration_seconds: float = 0.0
    rank_duration_seconds: float = 0.0
    
    # Embed stats
    videos_embedded: int = 0
    
    # Cluster stats
    clusters_created: int = 0
    clusters_deleted: int = 0
    noise_points: int = 0
    
    # Score stats
    videos_scored: int = 0
    
    # Rank stats
    clusters_ranked: int = 0
    
    # Errors
    errors: int = 0


class MetricsCollectorProtocol(Protocol):
    """
    Protocol for metrics collection.
    
    Implementations handle logging metrics in whatever format is appropriate
    (JSON, Prometheus, DataDog, etc.).
    """
    
    def start_ingest_run(self) -> IngestMetrics:
        """Start tracking an ingestion run."""
        ...
    
    def finish_ingest_run(self, metrics: IngestMetrics) -> None:
        """Finish and log an ingestion run."""
        ...
    
    def start_snapshot_run(self) -> SnapshotMetrics:
        """Start tracking a snapshot run."""
        ...
    
    def finish_snapshot_run(self, metrics: SnapshotMetrics) -> None:
        """Finish and log a snapshot run."""
        ...
    
    def start_process_run(self) -> ProcessMetrics:
        """Start tracking a processing run."""
        ...
    
    def finish_process_run(self, metrics: ProcessMetrics) -> None:
        """Finish and log a processing run."""
        ...
    
    def log_error(
        self,
        error: str,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Log an error event."""
        ...
    
    def log_worker_status(self) -> None:
        """Log current worker status."""
        ...
    
    def log_quota_status(
        self,
        used: int,
        remaining: int,
        daily_limit: int,
    ) -> None:
        """Log quota status."""
        ...
