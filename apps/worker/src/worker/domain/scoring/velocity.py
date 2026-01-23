"""
Velocity computation - pure functions for calculating view velocity metrics.

Responsibility: Calculate velocity and views_per_day from raw inputs.
Depends on: Nothing.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from datetime import datetime, timezone


def compute_views_per_day(
    view_count: int,
    published_at: datetime,
    now: datetime | None = None,
) -> float:
    """
    Compute views per day since publication.
    
    Args:
        view_count: Current total view count
        published_at: When the video was published
        now: Current time (defaults to UTC now)
        
    Returns:
        Views per day (minimum age of 0.01 days to avoid division by zero)
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    # Ensure timezone-aware comparison
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    
    age_seconds = (now - published_at).total_seconds()
    age_days = max(0.01, age_seconds / 86400)
    
    return view_count / age_days


def compute_velocity(
    current_view_count: int,
    previous_view_count: int | None,
) -> int | None:
    """
    Compute velocity (views gained) between two snapshots.
    
    Args:
        current_view_count: Current total view count
        previous_view_count: View count from previous snapshot
        
    Returns:
        Views gained, or None if previous snapshot unavailable
    """
    if previous_view_count is None:
        return None
    
    return current_view_count - previous_view_count


def compute_acceleration(
    velocity_current: float | None,
    velocity_previous: float | None,
) -> float | None:
    """
    Compute acceleration (change in velocity).
    
    Args:
        velocity_current: Current velocity
        velocity_previous: Previous period velocity
        
    Returns:
        Acceleration ratio, or None if data unavailable
    """
    if velocity_current is None or velocity_previous is None:
        return None
    
    if velocity_previous == 0:
        return None
    
    return velocity_current / velocity_previous
