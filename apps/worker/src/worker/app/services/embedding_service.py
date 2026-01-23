"""
Embedding service - coordinate video embedding.

Responsibility: Orchestrate embedding of video titles.
Depends on: Embedder protocol, repository protocols.
"""

import logging
from typing import Any

from ...domain.models import EmbeddingRecord
from ...ports.embeddings import EmbedderProtocol
from ...ports.repositories import VideoRepositoryProtocol, EmbeddingRepositoryProtocol

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Coordinates embedding of video titles.
    
    Handles batching and persistence of embeddings.
    """
    
    def __init__(
        self,
        embedder: EmbedderProtocol,
        video_repo: VideoRepositoryProtocol,
        embedding_repo: EmbeddingRepositoryProtocol,
        batch_size: int = 100,
    ):
        """
        Initialize the embedding service.
        
        Args:
            embedder: Text embedding client
            video_repo: Video repository for fetching titles
            embedding_repo: Embedding repository for persistence
            batch_size: Number of titles to embed per API call
        """
        self.embedder = embedder
        self.video_repo = video_repo
        self.embedding_repo = embedding_repo
        self.batch_size = batch_size
    
    def embed_videos(
        self,
        window: str,
        limit: int = 1000,
    ) -> dict[str, Any]:
        """
        Embed video titles that don't have embeddings yet.
        
        This is idempotent - running it multiple times won't create duplicate embeddings.
        
        Args:
            window: Time window (e.g., '7d', '30d')
            limit: Maximum total videos to process
            
        Returns:
            Summary of the embedding operation
        """
        # Fetch videos that need embedding
        videos = self.video_repo.fetch_videos_without_embeddings(window, limit)
        
        if not videos:
            return {
                "status": "no_work",
                "message": "No videos need embedding",
                "processed": 0,
            }
        
        logger.info(f"[Embed] Found {len(videos)} videos needing embeddings")
        
        total_embedded = 0
        model = self.embedder.model_name
        
        # Process in batches
        for i in range(0, len(videos), self.batch_size):
            batch = videos[i:i + self.batch_size]
            texts = [v["title"] for v in batch]
            
            logger.info(f"[Embed] Processing batch {i // self.batch_size + 1} ({len(batch)} videos)")
            
            try:
                embeddings = self.embedder.embed_batch(texts)
                
                # Prepare for upsert
                embedding_records = [
                    EmbeddingRecord(
                        video_id=batch[j]["video_id"],
                        embedding=embeddings[j],
                        model=model,
                    )
                    for j in range(len(batch))
                ]
                
                self.embedding_repo.upsert_embeddings(embedding_records)
                total_embedded += len(batch)
                
                logger.info(f"[Embed] Embedded {total_embedded}/{len(videos)} videos")
                
            except Exception as e:
                logger.error(f"[Embed] Error processing batch: {e}")
                # Continue with next batch
                continue
        
        return {
            "status": "success",
            "message": f"Embedded {total_embedded} videos",
            "embedded": total_embedded,
            "total_found": len(videos),
        }
