"""
Common error types.

Responsibility: Define worker-wide exception types.
"""


class WorkerError(Exception):
    """Base exception for worker errors."""
    pass


class ConfigurationError(WorkerError):
    """Configuration is invalid or missing."""
    pass


class QuotaExceededError(WorkerError):
    """API quota has been exceeded."""
    pass
