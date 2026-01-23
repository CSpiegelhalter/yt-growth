"""
YouTube infrastructure - API client implementation.

Responsibility: Implement YouTubeClientProtocol with real HTTP calls.
Depends on: requests, tenacity, config.
"""

from .client import YouTubeClient
from .quota import QuotaTracker, get_quota_tracker
from .http import (
    YouTubeAPIError,
    QuotaExceededError,
    RetryableError,
    make_request,
)
from .rss import (
    RSSVideo,
    fetch_channel_rss,
    fetch_multiple_channels_rss,
)

__all__ = [
    "YouTubeClient",
    "QuotaTracker",
    "get_quota_tracker",
    "YouTubeAPIError",
    "QuotaExceededError",
    "RetryableError",
    "make_request",
    # RSS (free, no quota)
    "RSSVideo",
    "fetch_channel_rss",
    "fetch_multiple_channels_rss",
]
