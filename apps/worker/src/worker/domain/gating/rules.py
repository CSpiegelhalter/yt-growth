"""
Gating rules - pure functions for candidate filtering.

Responsibility: Apply cheap filters (age, dedup, channel cap).
Depends on: Domain models only.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from datetime import datetime, timezone, timedelta
from typing import Any

from ..models.window import DEFAULT_WINDOW_CONFIGS


def check_age_eligibility(
    published_at: datetime,
    now: datetime | None = None,
) -> list[str]:
    """
    Determine which windows this video is eligible for.
    
    Args:
        published_at: Video publish time
        now: Current time (defaults to UTC now)
        
    Returns:
        List of window names the video qualifies for
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    # Ensure timezone-aware comparison
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    
    age = now - published_at
    
    eligible = []
    for window_name, config in DEFAULT_WINDOW_CONFIGS.items():
        if age <= timedelta(days=config.days):
            eligible.append(window_name)
    
    return eligible


def check_channel_cap(
    channel_id: str,
    channel_counts: dict[str, int],
    max_per_channel: int,
) -> bool:
    """
    Check if a channel has reached its intake cap.
    
    Args:
        channel_id: The channel to check
        channel_counts: Current counts per channel
        max_per_channel: Maximum allowed per channel
        
    Returns:
        True if under cap (can accept), False if at/over cap
    """
    current_count = channel_counts.get(channel_id, 0)
    return current_count < max_per_channel


def check_duplicate(
    video_id: str,
    seen_video_ids: set[str],
) -> bool:
    """
    Check if a video has already been seen.
    
    Args:
        video_id: The video to check
        seen_video_ids: Set of already-seen video IDs
        
    Returns:
        True if new (not duplicate), False if duplicate
    """
    return video_id not in seen_video_ids


def get_window_for_age(
    published_at: datetime,
    now: datetime | None = None,
) -> str | None:
    """
    Get the smallest applicable window for a video's age.
    
    Args:
        published_at: Video publish time
        now: Current time (defaults to UTC now)
        
    Returns:
        Window name (24h, 7d, 30d, 90d) or None if too old
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    # Ensure timezone-aware comparison
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    
    age = now - published_at
    
    for window_name in ["24h", "7d", "30d", "90d"]:
        config = DEFAULT_WINDOW_CONFIGS[window_name]
        if age <= timedelta(days=config.days):
            return window_name
    
    return None


def get_min_views_for_window(window: str) -> int:
    """Get minimum views threshold for a window."""
    config = DEFAULT_WINDOW_CONFIGS.get(window)
    if config:
        return config.min_views
    return 500  # Default


def enforce_diversity(
    videos: list[dict[str, Any]],
    max_per_channel: int = 2,
    max_per_cluster: int | None = None,
) -> list[dict[str, Any]]:
    """
    Enforce diversity constraints on a list of videos.
    
    Used when serving trending lists to ensure variety.
    
    Args:
        videos: List of video dicts with channel_id (and optionally cluster_id)
        max_per_channel: Max videos from same channel
        max_per_cluster: Max videos from same cluster (if applicable)
        
    Returns:
        Filtered list respecting diversity constraints
    """
    channel_counts: dict[str, int] = {}
    cluster_counts: dict[str, int] = {}
    result = []
    
    for video in videos:
        channel_id = video.get("channel_id", "")
        cluster_id = video.get("cluster_id")
        
        # Check channel limit
        if channel_counts.get(channel_id, 0) >= max_per_channel:
            continue
        
        # Check cluster limit (if applicable)
        if max_per_cluster and cluster_id:
            if cluster_counts.get(cluster_id, 0) >= max_per_cluster:
                continue
        
        # Include this video
        result.append(video)
        channel_counts[channel_id] = channel_counts.get(channel_id, 0) + 1
        if cluster_id:
            cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1
    
    return result
