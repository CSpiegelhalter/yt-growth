"""
YouTube API HTTP helpers with retries.

Responsibility: Make HTTP requests to YouTube API with proper error handling.
Depends on: requests, tenacity.
Does not depend on: Domain models.
"""

import time
import random
import logging
from typing import Any
from urllib.parse import urlencode

import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logger = logging.getLogger(__name__)

# YouTube API base URL
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

# Quota costs per operation (as of 2024)
# See: https://developers.google.com/youtube/v3/determine_quota_cost
QUOTA_COSTS = {
    "search.list": 100,
    "videos.list": 1,
    "channels.list": 1,
}


class YouTubeAPIError(Exception):
    """YouTube API returned an error."""
    def __init__(self, status_code: int, error: dict[str, Any]):
        self.status_code = status_code
        self.error = error
        self.reason = error.get("error", {}).get("errors", [{}])[0].get("reason", "unknown")
        super().__init__(f"YouTube API error {status_code}: {self.reason}")


class QuotaExceededError(Exception):
    """Daily quota has been exceeded."""
    pass


class RetryableError(Exception):
    """An error that should trigger a retry."""
    pass


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    retry=retry_if_exception_type(RetryableError),
    reraise=True,
)
def make_request(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """
    Make an HTTP request to the YouTube API with retries.
    
    Uses exponential backoff with jitter for transient errors.
    """
    # Add jitter to avoid thundering herd
    jitter = random.uniform(0, 0.5)
    time.sleep(jitter)
    
    full_url = f"{url}?{urlencode(params)}"
    
    try:
        response = requests.get(full_url, timeout=30)
    except requests.exceptions.Timeout:
        raise RetryableError("Request timed out")
    except requests.exceptions.ConnectionError as e:
        raise RetryableError(f"Connection error: {e}")
    
    if response.status_code == 200:
        return response.json()
    
    # Parse error response
    try:
        error_data = response.json()
    except Exception:
        error_data = {"error": {"message": response.text}}
    
    # Handle specific error codes
    if response.status_code == 403:
        reason = error_data.get("error", {}).get("errors", [{}])[0].get("reason", "")
        if reason in ("quotaExceeded", "dailyLimitExceeded"):
            raise QuotaExceededError("YouTube API daily quota exceeded")
        # Other 403s might be retryable (rate limiting)
        raise RetryableError(f"Rate limited: {reason}")
    
    if response.status_code in (500, 502, 503, 504):
        raise RetryableError(f"Server error: {response.status_code}")
    
    if response.status_code == 429:
        raise RetryableError("Too many requests")
    
    # Non-retryable errors
    raise YouTubeAPIError(response.status_code, error_data)
