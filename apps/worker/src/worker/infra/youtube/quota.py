"""
YouTube API quota tracking.

Responsibility: Track daily quota usage to avoid exceeding limits.
Depends on: datetime.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


@dataclass
class QuotaTracker:
    """
    Tracks YouTube API quota usage for the current day.
    
    Quota resets at midnight Pacific Time.
    """
    daily_limit: int
    buffer_ratio: float
    used_today: int = 0
    last_reset: datetime | None = None
    
    @property
    def effective_limit(self) -> int:
        """Limit after applying safety buffer."""
        return int(self.daily_limit * (1 - self.buffer_ratio))
    
    @property
    def remaining(self) -> int:
        """Remaining quota for today."""
        self._maybe_reset()
        return max(0, self.effective_limit - self.used_today)
    
    def can_afford(self, cost: int) -> bool:
        """Check if we have enough quota for an operation."""
        return self.remaining >= cost
    
    def consume(self, cost: int) -> None:
        """Record quota usage."""
        self._maybe_reset()
        self.used_today += cost
        logger.debug(f"Quota consumed: {cost}, remaining: {self.remaining}")
    
    def _maybe_reset(self) -> None:
        """Reset counter if we've crossed midnight PT."""
        # Approximate PT as UTC-8 (ignoring DST for simplicity)
        now_pt = datetime.now(timezone.utc) - timedelta(hours=8)
        today_pt = now_pt.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if self.last_reset is None or self.last_reset < today_pt:
            self.used_today = 0
            self.last_reset = today_pt
            logger.info(f"Quota counter reset. Daily limit: {self.effective_limit}")


# Global quota tracker
_quota_tracker: QuotaTracker | None = None


def get_quota_tracker(
    daily_limit: int = 10000,
    buffer_ratio: float = 0.1,
) -> QuotaTracker:
    """Get the global quota tracker instance."""
    global _quota_tracker
    if _quota_tracker is None:
        _quota_tracker = QuotaTracker(
            daily_limit=daily_limit,
            buffer_ratio=buffer_ratio,
        )
    return _quota_tracker


def reset_quota_tracker() -> None:
    """Reset the global quota tracker (useful for testing)."""
    global _quota_tracker
    _quota_tracker = None
