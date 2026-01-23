"""
Long-tail feeder - generates long-tail queries from corpus.

Responsibility: Generate candidates from long-tail queries.
Depends on: YouTube client protocol, video repo, domain feeders.
"""

import re
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Iterator
from collections import Counter

from ...domain.models import VideoSearchResult
from ...domain.feeders import WINDOWS, INTENT_SEEDS, generate_long_tail_queries
from ...ports.youtube import YouTubeClientProtocol
from ...ports.repositories import VideoRepositoryProtocol, IngestionStateRepositoryProtocol
from ...infra.youtube import QuotaExceededError

logger = logging.getLogger(__name__)


class LongTailFeeder:
    """
    Generates long-tail queries from our corpus.
    
    Combines intent seeds with topics extracted from existing videos.
    """
    
    FEEDER_NAME = "longtail"
    
    def __init__(
        self,
        youtube_client: YouTubeClientProtocol,
        video_repo: VideoRepositoryProtocol,
        state_repo: IngestionStateRepositoryProtocol,
        queries_per_run: int = 10,
        videos_per_query: int = 10,
    ):
        self.client = youtube_client
        self.video_repo = video_repo
        self.state_repo = state_repo
        self.queries_per_run = queries_per_run
        self.videos_per_query = videos_per_query
    
    def get_corpus_keywords(self, limit: int = 100) -> list[str]:
        """Extract frequent keywords from our video corpus."""
        # Get videos without embeddings as a sample of recent titles
        videos = self.video_repo.fetch_videos_without_embeddings("30d", limit * 5)
        
        # Extract keywords from titles
        all_words = []
        stopwords = {
            "the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
            "to", "for", "of", "and", "or", "but", "with", "this", "that",
            "my", "your", "i", "you", "we", "they", "it", "how", "what",
            "why", "when", "where", "who",
        }
        
        for video in videos:
            title = video.get("title", "")
            words = re.sub(r'[^\w\s]', ' ', title.lower()).split()
            words = [w for w in words if w not in stopwords and len(w) > 3]
            all_words.extend(words)
        
        # Get most common keywords
        word_counts = Counter(all_words)
        return [w for w, _ in word_counts.most_common(limit)]
    
    def generate_candidates(self, window: str = "7d") -> Iterator[VideoSearchResult]:
        """
        Generate candidates from long-tail queries.
        
        Args:
            window: Time window
            
        Yields:
            VideoSearchResult objects
        """
        window_config = WINDOWS.get(window, WINDOWS["7d"])
        published_after = datetime.now(timezone.utc) - timedelta(days=window_config["days"])
        
        keywords = self.get_corpus_keywords(100)
        
        if not keywords:
            logger.info("[LongTail] No corpus keywords found, using default seeds")
            keywords = ["gaming", "cooking", "fitness", "tech", "music", "art", "travel"]
        
        queries = generate_long_tail_queries(keywords, self.queries_per_run)
        
        logger.info(f"[LongTail] Running {len(queries)} long-tail queries")
        
        videos_generated = 0
        
        for query in queries:
            try:
                results = self.client.search_videos(
                    query=query,
                    max_results=self.videos_per_query,
                    published_after=published_after,
                    order="date",  # Prefer fresh for long-tail
                )
                
                for video in results:
                    videos_generated += 1
                    yield video
                    
            except QuotaExceededError:
                logger.warning(f"[LongTail] Quota exceeded after {videos_generated} videos")
                break
            except Exception as e:
                logger.error(f"[LongTail] Error on query '{query}': {e}")
                continue
        
        # Update state
        self.state_repo.update_feeder_stats(self.FEEDER_NAME, videos_generated)
        logger.info(f"[LongTail] Generated {videos_generated} candidates")
