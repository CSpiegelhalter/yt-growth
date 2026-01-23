"""
Breakout score computation - pure functions for normalized performance metrics.

Responsibility: Calculate breakout scores that normalize for channel size.
Depends on: Nothing.
Does not depend on: Any external I/O, config, or infrastructure.
"""


def compute_breakout_by_subs(
    views_per_day: float | None,
    subscriber_count: int | None,
    min_subs: int = 100,
) -> float | None:
    """
    Compute breakout score normalized by subscriber count.
    
    Higher values indicate a video performing above typical for the channel's size.
    Uses views_per_day instead of velocity_24h so it works with a single snapshot.
    
    Args:
        views_per_day: Average views per day since publication
        subscriber_count: Channel's subscriber count
        min_subs: Minimum subscriber count to use (avoids over-inflating small channels)
        
    Returns:
        Breakout score, or None if views_per_day unavailable
    """
    if views_per_day is None or views_per_day <= 0:
        return None
    
    effective_subs = max(min_subs, subscriber_count or 0)
    return views_per_day / effective_subs


def compute_breakout_by_baseline(
    views_per_day: float | None,
    channel_median_vpd: float | None,
) -> float | None:
    """
    Compute breakout score relative to the channel's baseline.
    
    A value of 2.0 means the video is getting 2x the typical views per day.
    Uses views_per_day instead of velocity so it works with a single snapshot.
    
    Args:
        views_per_day: Average views per day since publication
        channel_median_vpd: Channel's median views per day
        
    Returns:
        Breakout ratio, or None if data unavailable
    """
    if views_per_day is None or views_per_day <= 0:
        return None
    
    if channel_median_vpd is None or channel_median_vpd <= 0:
        return None
    
    return views_per_day / channel_median_vpd


# Legacy aliases for backward compatibility
def compute_breakout_from_velocity(
    velocity_24h: float | None,
    subscriber_count: int | None,
    min_subs: int = 100,
) -> float | None:
    """Legacy: Use velocity_24h if available (requires multiple snapshots)."""
    if velocity_24h is None:
        return None
    effective_subs = max(min_subs, subscriber_count or 0)
    return velocity_24h / effective_subs
