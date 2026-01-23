"""
JSON metrics logger implementation.

Responsibility: Implement MetricsCollectorProtocol with JSON logging.
Depends on: logging, dataclasses.
"""

import json
import time
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any

from ...ports.metrics import IngestMetrics, SnapshotMetrics, ProcessMetrics, MetricsCollectorProtocol

logger = logging.getLogger(__name__)


@dataclass
class WorkerMetrics:
    """Overall worker health metrics."""
    worker_id: str = ""
    started_at: str = ""
    uptime_seconds: float = 0.0
    
    # Run counts
    ingest_runs: int = 0
    snapshot_runs: int = 0
    process_runs: int = 0
    
    # Cumulative stats
    total_videos_ingested: int = 0
    total_snapshots: int = 0
    total_videos_processed: int = 0
    
    # Current state
    mode: str = ""
    is_running: bool = True
    last_error: str = ""


class JsonMetricsCollector(MetricsCollectorProtocol):
    """
    Collects and logs metrics for the worker.
    
    Logs metrics in JSON format for easy parsing by log aggregators.
    """
    
    def __init__(self, worker_id: str = "worker-1"):
        self.worker_id = worker_id
        self.worker_started_at = datetime.now(timezone.utc)
        self.worker_metrics = WorkerMetrics(
            worker_id=worker_id,
            started_at=self.worker_started_at.isoformat(),
        )
        
        self._run_counter = 0
    
    def _generate_run_id(self) -> str:
        """Generate a unique run ID."""
        self._run_counter += 1
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        return f"{self.worker_id}-{timestamp}-{self._run_counter}"
    
    def _log_metrics(self, event_type: str, metrics: Any) -> None:
        """Log metrics in structured JSON format."""
        data = {
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "worker_id": self.worker_id,
            "metrics": asdict(metrics) if hasattr(metrics, "__dataclass_fields__") else metrics,
        }
        
        # Log as JSON for structured logging
        logger.info(f"METRICS: {json.dumps(data)}")
    
    def start_ingest_run(self) -> IngestMetrics:
        """Start tracking an ingestion run."""
        metrics = IngestMetrics(
            run_id=self._generate_run_id(),
            started_at=datetime.now(timezone.utc).isoformat(),
        )
        return metrics
    
    def finish_ingest_run(self, metrics: IngestMetrics) -> None:
        """Finish and log an ingestion run."""
        metrics.finished_at = datetime.now(timezone.utc).isoformat()
        
        # Calculate duration
        started = datetime.fromisoformat(metrics.started_at.replace("Z", "+00:00"))
        finished = datetime.fromisoformat(metrics.finished_at.replace("Z", "+00:00"))
        metrics.duration_seconds = (finished - started).total_seconds()
        
        # Update worker metrics
        self.worker_metrics.ingest_runs += 1
        self.worker_metrics.total_videos_ingested += metrics.videos_inserted
        
        self._log_metrics("ingest_complete", metrics)
    
    def start_snapshot_run(self) -> SnapshotMetrics:
        """Start tracking a snapshot run."""
        metrics = SnapshotMetrics(
            run_id=self._generate_run_id(),
            started_at=datetime.now(timezone.utc).isoformat(),
        )
        return metrics
    
    def finish_snapshot_run(self, metrics: SnapshotMetrics) -> None:
        """Finish and log a snapshot run."""
        metrics.finished_at = datetime.now(timezone.utc).isoformat()
        
        started = datetime.fromisoformat(metrics.started_at.replace("Z", "+00:00"))
        finished = datetime.fromisoformat(metrics.finished_at.replace("Z", "+00:00"))
        metrics.duration_seconds = (finished - started).total_seconds()
        
        self.worker_metrics.snapshot_runs += 1
        self.worker_metrics.total_snapshots += metrics.videos_snapshotted
        
        self._log_metrics("snapshot_complete", metrics)
    
    def start_process_run(self) -> ProcessMetrics:
        """Start tracking a processing run."""
        metrics = ProcessMetrics(
            run_id=self._generate_run_id(),
            started_at=datetime.now(timezone.utc).isoformat(),
        )
        return metrics
    
    def finish_process_run(self, metrics: ProcessMetrics) -> None:
        """Finish and log a processing run."""
        metrics.finished_at = datetime.now(timezone.utc).isoformat()
        
        started = datetime.fromisoformat(metrics.started_at.replace("Z", "+00:00"))
        finished = datetime.fromisoformat(metrics.finished_at.replace("Z", "+00:00"))
        metrics.duration_seconds = (finished - started).total_seconds()
        
        self.worker_metrics.process_runs += 1
        self.worker_metrics.total_videos_processed += metrics.videos_scored
        
        self._log_metrics("process_complete", metrics)
    
    def log_error(self, error: str, context: dict[str, Any] | None = None) -> None:
        """Log an error event."""
        self.worker_metrics.last_error = error
        
        data = {
            "error": error,
            "context": context or {},
        }
        self._log_metrics("error", data)
    
    def log_worker_status(self) -> None:
        """Log current worker status."""
        now = datetime.now(timezone.utc)
        self.worker_metrics.uptime_seconds = (now - self.worker_started_at).total_seconds()
        self._log_metrics("worker_status", self.worker_metrics)
    
    def log_quota_status(self, used: int, remaining: int, daily_limit: int) -> None:
        """Log quota status."""
        data = {
            "used": used,
            "remaining": remaining,
            "daily_limit": daily_limit,
            "percent_used": round(used / daily_limit * 100, 1) if daily_limit > 0 else 0,
        }
        self._log_metrics("quota_status", data)


class Timer:
    """Context manager for timing operations."""
    
    def __init__(self, name: str = "operation"):
        self.name = name
        self.start_time: float = 0
        self.duration: float = 0
    
    def __enter__(self) -> "Timer":
        self.start_time = time.time()
        return self
    
    def __exit__(self, *args) -> None:
        self.duration = time.time() - self.start_time
        logger.debug(f"[Timer] {self.name}: {self.duration:.2f}s")
