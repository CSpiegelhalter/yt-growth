"""
Feeder domain logic - seed constants and query extraction.

Responsibility: Provide seed queries and query extraction logic.
Depends on: re, collections.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from .seeds import INTENT_SEEDS, WINDOWS
from .query_extraction import extract_query_terms, generate_long_tail_queries

__all__ = [
    "INTENT_SEEDS",
    "WINDOWS",
    "extract_query_terms",
    "generate_long_tail_queries",
]
