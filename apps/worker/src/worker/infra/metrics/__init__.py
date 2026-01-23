"""
Metrics infrastructure - JSON logging implementation.

Responsibility: Implement MetricsCollectorProtocol with JSON logging.
Depends on: logging.
"""

from .json_logger import JsonMetricsCollector, Timer

__all__ = ["JsonMetricsCollector", "Timer"]
