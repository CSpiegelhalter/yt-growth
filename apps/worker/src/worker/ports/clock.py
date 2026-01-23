"""
Clock protocol for time-dependent operations.

Responsibility: Define the contract for getting current time.
Depends on: Nothing.
Does not depend on: Any implementation details.

This allows testing time-sensitive code with fake clocks.
"""

from typing import Protocol
from datetime import datetime


class ClockProtocol(Protocol):
    """
    Protocol for clock/time services.
    
    Allows injecting fake time for testing.
    """
    
    def now(self) -> datetime:
        """Get the current UTC datetime."""
        ...
