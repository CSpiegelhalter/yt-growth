"""
Time utilities and clock implementation.

Responsibility: Provide a clock for getting current time.
"""

from datetime import datetime, timezone

from ..ports.clock import ClockProtocol


class SystemClock(ClockProtocol):
    """System clock implementation using datetime."""
    
    def now(self) -> datetime:
        """Get the current UTC datetime."""
        return datetime.now(timezone.utc)
