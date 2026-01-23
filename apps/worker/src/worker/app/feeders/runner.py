"""
Combined feeder runner.

Responsibility: Run all feeders and collect candidates.
Depends on: All feeder implementations, ports.
"""

import logging
from typing import Any

from ...domain.models import VideoSearchResult
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import (
    VideoRepositoryProtocol,
    ScoreRepositoryProtocol,
    IngestionStateRepositoryProtocol,
)
from ...infra.youtube import QuotaExceededError
from .intent_seed import IntentSeedFeeder
from .expansion import ExpansionFeeder
from .longtail import LongTailFeeder

logger = logging.getLogger(__name__)


def run_all_feeders(
    youtube_client: YouTubeClientProtocol,
    video_repo: VideoRepositoryProtocol,
    score_repo: ScoreRepositoryProtocol,
    state_repo: IngestionStateRepositoryProtocol,
    window: str = "7d",
    seeds_per_run: int = 5,      # 5 seeds × 100 quota = 500 quota
    videos_per_seed: int = 10,   # Reduced from 25
    longtail_queries: int = 5,   # 5 queries × 100 quota = 500 quota
) -> dict[str, Any]:
    """
    Run all feeders and collect candidates.
    
    Returns stats about the run and all candidates found.
    """
    stats = {
        "intent_seed": {"candidates": 0},
        "expansion": {"candidates": 0},
        "longtail": {"candidates": 0},
        "total": 0,
    }
    
    all_candidates: list[tuple[str, VideoSearchResult]] = []
    
    # Intent Seeds (primary feeder)
    try:
        feeder = IntentSeedFeeder(
            youtube_client=youtube_client,
            state_repo=state_repo,
            seeds_per_run=seeds_per_run,
            videos_per_seed=videos_per_seed,
        )
        
        for video in feeder.generate_candidates(window):
            all_candidates.append(("intent_seed", video))
            stats["intent_seed"]["candidates"] += 1
            
    except QuotaExceededError:
        logger.warning("[Feeders] Quota exceeded during intent seed feeder")
    except Exception as e:
        logger.error(f"[Feeders] Intent seed feeder error: {e}")
    
    # Expansion (secondary feeder)
    try:
        feeder = ExpansionFeeder(
            youtube_client=youtube_client,
            score_repo=score_repo,
            state_repo=state_repo,
        )
        
        for video in feeder.generate_candidates(window):
            all_candidates.append(("graph_expand", video))
            stats["expansion"]["candidates"] += 1
            
    except QuotaExceededError:
        logger.warning("[Feeders] Quota exceeded during expansion feeder")
    except Exception as e:
        logger.error(f"[Feeders] Expansion feeder error: {e}")
    
    # Long-tail (tertiary feeder)
    try:
        feeder = LongTailFeeder(
            youtube_client=youtube_client,
            video_repo=video_repo,
            state_repo=state_repo,
            queries_per_run=longtail_queries,
        )
        
        for video in feeder.generate_candidates(window):
            all_candidates.append(("longtail", video))
            stats["longtail"]["candidates"] += 1
            
    except QuotaExceededError:
        logger.warning("[Feeders] Quota exceeded during long-tail feeder")
    except Exception as e:
        logger.error(f"[Feeders] Long-tail feeder error: {e}")
    
    stats["total"] = len(all_candidates)
    
    return {
        "stats": stats,
        "candidates": all_candidates,
    }
