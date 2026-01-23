"""
Expansion feeder - expands from recent high-performers.

Responsibility: Generate candidates from top performers via related queries.
Depends on: YouTube client protocol, score repo, domain feeders.
"""

import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Iterator
from collections import Counter

from ...domain.models import VideoSearchResult
from ...domain.feeders import WINDOWS, extract_query_terms
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import ScoreRepositoryProtocol, IngestionStateRepositoryProtocol
from ...infra.youtube import QuotaExceededError

logger = logging.getLogger(__name__)


class ExpansionFeeder:
    """
    Expands from recent high-performing videos.
    
    Takes top performers by velocity/breakout and generates related queries
    from their titles/keywords.
    """
    
    FEEDER_NAME = "graph_expand"
    
    def __init__(
        self,
        youtube_client: YouTubeClientProtocol,
        score_repo: ScoreRepositoryProtocol,
        state_repo: IngestionStateRepositoryProtocol,
        top_n: int = 20,
        videos_per_query: int = 15,
    ):
        self.client = youtube_client
        self.score_repo = score_repo
        self.state_repo = state_repo
        self.top_n = top_n
        self.videos_per_query = videos_per_query
    
    def get_top_performers(self, window: str = "7d") -> list[dict]:
        """Get recent videos with highest velocity/breakout scores."""
        scores = self.score_repo.fetch_video_scores(window)
        
        # Sort by breakout and velocity
        scores = [s for s in scores if s.get("velocity_24h") is not None]
        scores.sort(
            key=lambda x: (x.get("breakout_by_subs") or 0, x.get("velocity_24h") or 0),
            reverse=True,
        )
        
        return scores[:self.top_n]
    
    def generate_candidates(self, window: str = "7d") -> Iterator[VideoSearchResult]:
        """
        Generate candidates by expanding from top performers.
        
        Args:
            window: Time window
            
        Yields:
            VideoSearchResult objects
        """
        window_config = WINDOWS.get(window, WINDOWS["7d"])
        published_after = datetime.now(timezone.utc) - timedelta(days=window_config["days"])
        
        top_videos = self.get_top_performers(window)
        
        if not top_videos:
            logger.info("[Expansion] No top performers found, skipping")
            return
        
        # Collect query terms from top performers
        all_queries = []
        for video in top_videos:
            title = video.get("title", "")
            if title:
                terms = extract_query_terms(title)
                all_queries.extend(terms)
        
        # Count frequency and select most common (but diverse)
        query_counts = Counter(all_queries)
        unique_queries = [q for q, _ in query_counts.most_common(15)]
        
        # Shuffle to add variety
        random.shuffle(unique_queries)
        queries_to_run = unique_queries[:10]
        
        logger.info(f"[Expansion] Running {len(queries_to_run)} expansion queries")
        
        videos_generated = 0
        
        for query in queries_to_run:
            try:
                results = self.client.search_videos(
                    query=query,
                    max_results=self.videos_per_query,
                    published_after=published_after,
                    order="relevance",
                )
                
                for video in results:
                    videos_generated += 1
                    yield video
                    
            except QuotaExceededError:
                logger.warning(f"[Expansion] Quota exceeded after {videos_generated} videos")
                break
            except Exception as e:
                logger.error(f"[Expansion] Error on query '{query}': {e}")
                continue
        
        # Update state
        self.state_repo.update_feeder_stats(self.FEEDER_NAME, videos_generated)
        logger.info(f"[Expansion] Generated {videos_generated} candidates")
