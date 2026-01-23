"""
Scoring domain logic - pure computation functions.

Responsibility: Compute velocity, breakout, and opportunity scores.
Depends on: Domain models only.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from .velocity import compute_velocity, compute_views_per_day
from .breakout import compute_breakout_by_subs, compute_breakout_by_baseline
from .opportunity import compute_opportunity_score, compute_winner_concentration

__all__ = [
    "compute_velocity",
    "compute_views_per_day",
    "compute_breakout_by_subs",
    "compute_breakout_by_baseline",
    "compute_opportunity_score",
    "compute_winner_concentration",
]
