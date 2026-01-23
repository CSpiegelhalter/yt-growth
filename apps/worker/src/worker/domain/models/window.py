"""
Window and tier domain models.

Responsibility: Define time window and snapshot tier configurations.
Depends on: Nothing (leaf module).
Does not depend on: Any external I/O, config, or infrastructure.
"""

from dataclasses import dataclass
from enum import Enum


class Window(str, Enum):
    """Supported time windows for analysis."""
    HOURS_24 = "24h"
    DAYS_7 = "7d"
    DAYS_30 = "30d"
    DAYS_90 = "90d"
    
    @property
    def days(self) -> int:
        """Number of days in this window."""
        return WINDOW_DAYS[self]
    
    @classmethod
    def from_string(cls, value: str) -> "Window":
        """Parse a window string."""
        for w in cls:
            if w.value == value:
                return w
        raise ValueError(f"Unknown window: {value}")


# Window to days mapping
WINDOW_DAYS = {
    Window.HOURS_24: 1,
    Window.DAYS_7: 7,
    Window.DAYS_30: 30,
    Window.DAYS_90: 90,
}


@dataclass(frozen=True)
class WindowConfig:
    """Configuration for a time window."""
    name: str
    days: int
    min_views: int
    order: str = "relevance"


# Default window configurations
DEFAULT_WINDOW_CONFIGS: dict[str, WindowConfig] = {
    "24h": WindowConfig(name="24h", days=1, min_views=100, order="date"),
    "7d": WindowConfig(name="7d", days=7, min_views=500, order="relevance"),
    "30d": WindowConfig(name="30d", days=30, min_views=2000, order="viewCount"),
    "90d": WindowConfig(name="90d", days=90, min_views=5000, order="viewCount"),
}


class Tier(str, Enum):
    """Snapshot tiers for prioritization."""
    A = "A"  # Hot: new + high velocity
    B = "B"  # Warm: medium velocity
    C = "C"  # Cold: older/slower


@dataclass(frozen=True)
class TierConfig:
    """Configuration for a snapshot tier."""
    name: str
    min_hours_since_snapshot: int
    description: str


def window_to_days(window: str) -> int:
    """Convert window string to number of days."""
    mapping = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}
    return mapping.get(window, 30)
