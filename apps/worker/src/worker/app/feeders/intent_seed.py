"""
Intent seed feeder - rotates through generic intent queries.

Responsibility: Generate candidates from intent seed queries.
Depends on: YouTube client protocol, ingestion state repo, domain feeders.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Iterator

from ...domain.models import VideoSearchResult
from ...domain.feeders import INTENT_SEEDS, WINDOWS
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import IngestionStateRepositoryProtocol
from ...infra.youtube import QuotaExceededError

logger = logging.getLogger(__name__)


class IntentSeedFeeder:
    """
    Rotates through generic intent seed queries.
    
    Uses a cursor to track position across runs, stored in DB.
    """
    
    FEEDER_NAME = "intent_seed"
    
    def __init__(
        self,
        youtube_client: YouTubeClientProtocol,
        state_repo: IngestionStateRepositoryProtocol,
        seeds_per_run: int = 10,
        videos_per_seed: int = 25,
    ):
        self.client = youtube_client
        self.state_repo = state_repo
        self.seeds_per_run = seeds_per_run
        self.videos_per_seed = videos_per_seed
        self.seeds = INTENT_SEEDS
    
    def generate_candidates(self, window: str = "7d") -> Iterator[VideoSearchResult]:
        """
        Generate candidate videos from intent seed queries.
        
        Args:
            window: Time window (24h, 7d, 30d)
            
        Yields:
            VideoSearchResult objects
        """
        window_config = WINDOWS.get(window, WINDOWS["7d"])
        published_after = datetime.now(timezone.utc) - timedelta(days=window_config["days"])
        
        cursor = self.state_repo.get_cursor(self.FEEDER_NAME)
        seeds_to_process = self.seeds[cursor:cursor + self.seeds_per_run]
        
        if not seeds_to_process:
            # Wrap around to start
            cursor = 0
            seeds_to_process = self.seeds[:self.seeds_per_run]
        
        logger.info(f"[IntentSeed] Processing {len(seeds_to_process)} seeds starting at cursor {cursor}")
        
        videos_generated = 0
        seeds_processed = 0
        
        for seed in seeds_to_process:
            try:
                results = self.client.search_videos(
                    query=seed,
                    max_results=self.videos_per_seed,
                    published_after=published_after,
                    order=window_config["order"],
                )
                
                for video in results:
                    videos_generated += 1
                    yield video
                
                seeds_processed += 1
                
            except QuotaExceededError:
                logger.warning(f"[IntentSeed] Quota exceeded after {seeds_processed} seeds")
                break
            except Exception as e:
                logger.error(f"[IntentSeed] Error on seed '{seed}': {e}")
                continue
        
        # Save progress
        new_cursor = cursor + seeds_processed
        if new_cursor >= len(self.seeds):
            new_cursor = 0  # Wrap around
        
        self.state_repo.save_cursor(self.FEEDER_NAME, new_cursor, videos_generated)
        logger.info(f"[IntentSeed] Generated {videos_generated} candidates from {seeds_processed} seeds")
