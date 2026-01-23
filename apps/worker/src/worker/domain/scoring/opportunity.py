"""
Opportunity score computation - pure functions for cluster ranking.

Responsibility: Calculate opportunity scores for niches/clusters.
Depends on: numpy (for Gini coefficient).
Does not depend on: Any external I/O, config, or infrastructure.
"""

import numpy as np


def compute_opportunity_score(
    median_velocity: float | None,
    avg_subs: float | None,
    concentration: float | None,
) -> float | None:
    """
    Compute opportunity score for a cluster.
    
    High opportunity = high demand (velocity) + low competition (small channels, even distribution)
    
    Args:
        median_velocity: Median velocity_24h of videos in cluster
        avg_subs: Average subscriber count of channels in cluster
        concentration: Winner concentration (0-1, lower = more evenly spread)
        
    Returns:
        Opportunity score (higher = better), or None if velocity unavailable
    """
    if median_velocity is None:
        return None
    
    demand = median_velocity
    
    # Normalize competition (higher subs = more competition)
    competition = (avg_subs or 100_000) / 100_000
    
    # Factor in concentration (higher = more dominated by few channels)
    concentration_factor = 1 + (concentration or 0.5)
    
    # Opportunity = demand / (competition * concentration)
    if competition * concentration_factor > 0:
        return demand / (competition * concentration_factor)
    
    return demand


def compute_winner_concentration(view_counts: list[int]) -> float:
    """
    Compute winner concentration using a simplified Gini coefficient.
    
    0 = perfectly even distribution
    1 = one video has all the views
    
    Args:
        view_counts: List of view counts for videos in cluster
        
    Returns:
        Concentration score (0-1)
    """
    if not view_counts or len(view_counts) < 2:
        return 0.0
    
    arr = np.array(sorted(view_counts))
    n = len(arr)
    total = arr.sum()
    
    if total == 0:
        return 0.0
    
    # Gini coefficient calculation
    cumsum = np.cumsum(arr)
    gini = (n + 1 - 2 * np.sum(cumsum) / total) / n
    
    return max(0.0, min(1.0, gini))
