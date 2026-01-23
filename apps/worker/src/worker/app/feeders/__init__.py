"""
Feeder implementations - candidate generation strategies.

Feeders generate candidate videos from various sources.
"""

from .intent_seed import IntentSeedFeeder
from .expansion import ExpansionFeeder
from .longtail import LongTailFeeder
from .rss_expansion import RSSExpansionFeeder
from .runner import run_all_feeders

__all__ = [
    "IntentSeedFeeder",
    "ExpansionFeeder",
    "LongTailFeeder",
    "RSSExpansionFeeder",
    "run_all_feeders",
]
