"""
Pytest configuration and shared fixtures.
"""

import pytest
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from typing import Any

from worker.domain.models import VideoSearchResult, VideoStats, ChannelInfo


# ============================================
# FAKE IMPLEMENTATIONS
# ============================================

class FakeYouTubeClient:
    """Fake YouTube client for testing."""
    
    def __init__(self, search_results: list[VideoSearchResult] | None = None):
        self.search_results = search_results or []
        self.search_calls: list[dict] = []
        self.stats_calls: list[list[str]] = []
        self.channel_calls: list[list[str]] = []
    
    def search_videos(
        self,
        query: str,
        max_results: int = 25,
        published_after: datetime | None = None,
        **kwargs,
    ) -> list[VideoSearchResult]:
        self.search_calls.append({
            "query": query,
            "max_results": max_results,
            "published_after": published_after,
        })
        return self.search_results[:max_results]
    
    def get_video_stats(self, video_ids: list[str]) -> dict[str, VideoStats]:
        self.stats_calls.append(video_ids)
        return {
            vid: VideoStats(
                video_id=vid,
                view_count=1000,
                like_count=100,
                comment_count=10,
                duration_seconds=300,
            )
            for vid in video_ids
        }
    
    def get_channel_info(self, channel_ids: list[str]) -> dict[str, ChannelInfo]:
        self.channel_calls.append(channel_ids)
        return {
            cid: ChannelInfo(
                channel_id=cid,
                title=f"Channel {cid}",
                subscriber_count=10000,
                video_count=100,
                published_at=datetime(2020, 1, 1, tzinfo=timezone.utc),
            )
            for cid in channel_ids
        }
    
    def get_video_stats_batched(self, video_ids: list[str], batch_size: int = 50) -> dict[str, VideoStats]:
        return self.get_video_stats(video_ids)
    
    def get_channel_info_batched(self, channel_ids: list[str], batch_size: int = 50) -> dict[str, ChannelInfo]:
        return self.get_channel_info(channel_ids)


class FakeEmbedder:
    """Fake embedder for testing."""
    
    def __init__(self, embedding_dim: int = 1536):
        self.embedding_dim = embedding_dim
        self.embed_calls: list[list[str]] = []
    
    @property
    def model_name(self) -> str:
        return "fake-embedding-model"
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        self.embed_calls.append(texts)
        # Return deterministic embeddings based on text length
        return [[float(len(t) % 10) / 10] * self.embedding_dim for t in texts]


class FakeMetricsCollector:
    """Fake metrics collector for testing."""
    
    def __init__(self):
        self.ingest_runs: list[Any] = []
        self.snapshot_runs: list[Any] = []
        self.process_runs: list[Any] = []
        self.errors: list[tuple[str, dict]] = []
    
    def start_ingest_run(self):
        from worker.ports.metrics import IngestMetrics
        return IngestMetrics(run_id="test-run")
    
    def finish_ingest_run(self, metrics):
        self.ingest_runs.append(metrics)
    
    def start_snapshot_run(self):
        from worker.ports.metrics import SnapshotMetrics
        return SnapshotMetrics(run_id="test-run")
    
    def finish_snapshot_run(self, metrics):
        self.snapshot_runs.append(metrics)
    
    def start_process_run(self):
        from worker.ports.metrics import ProcessMetrics
        return ProcessMetrics(run_id="test-run")
    
    def finish_process_run(self, metrics):
        self.process_runs.append(metrics)
    
    def log_error(self, error: str, context: dict | None = None):
        self.errors.append((error, context or {}))
    
    def log_worker_status(self):
        pass
    
    def log_quota_status(self, used: int, remaining: int, daily_limit: int):
        pass


# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def now():
    """Fixed 'now' time for testing."""
    return datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def sample_video_search_result(now):
    """Sample VideoSearchResult for testing."""
    return VideoSearchResult(
        video_id="test-video-123",
        channel_id="test-channel-456",
        channel_title="Test Channel",
        title="How to Test Python Code",
        description="A tutorial on testing",
        thumbnail_url="https://example.com/thumb.jpg",
        published_at=now - timedelta(days=2),
    )


@pytest.fixture
def fake_youtube_client(sample_video_search_result):
    """Fake YouTube client with sample data."""
    return FakeYouTubeClient(search_results=[sample_video_search_result])


@pytest.fixture
def fake_embedder():
    """Fake embedder."""
    return FakeEmbedder()


@pytest.fixture
def fake_metrics():
    """Fake metrics collector."""
    return FakeMetricsCollector()
