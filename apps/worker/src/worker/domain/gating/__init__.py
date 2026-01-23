"""
Gating domain logic - pure filtering rules.

Responsibility: Determine eligibility and apply filtering rules.
Depends on: Domain models only.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from .rules import (
    check_age_eligibility,
    check_channel_cap,
    check_duplicate,
    get_window_for_age,
    get_min_views_for_window,
    enforce_diversity,
)

__all__ = [
    "check_age_eligibility",
    "check_channel_cap",
    "check_duplicate",
    "get_window_for_age",
    "get_min_views_for_window",
    "enforce_diversity",
]
