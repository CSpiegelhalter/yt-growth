"""
YouTube client protocol.

Responsibility: Define the contract for YouTube API interactions.
Depends on: Domain models.
Does not depend on: Any implementation details.
"""

from typing import Protocol
from datetime import datetime

from ..domain.models import VideoSearchResult, VideoStats, ChannelInfo


class YouTubeClientProtocol(Protocol):
    """
    Protocol for YouTube Data API client.
    
    Implementations must provide methods for:
    - Searching videos
    - Getting video statistics
    - Getting channel information
    """
    
    def search_videos(
        self,
        query: str,
        max_results: int = 25,
        published_after: datetime | None = None,
        published_before: datetime | None = None,
        order: str = "relevance",
        region_code: str = "US",
        relevance_language: str = "en",
    ) -> list[VideoSearchResult]:
        """
        Search for videos matching a query.
        
        Args:
            query: Search query string
            max_results: Maximum results to return (1-50)
            published_after: Only return videos published after this time
            published_before: Only return videos published before this time
            order: Sort order (relevance, date, viewCount, rating)
            region_code: ISO 3166-1 alpha-2 country code
            relevance_language: ISO 639-1 language code
            
        Returns:
            List of VideoSearchResult objects
        """
        ...
    
    def get_video_stats(
        self,
        video_ids: list[str],
    ) -> dict[str, VideoStats]:
        """
        Get statistics for multiple videos in a single batched request.
        
        Args:
            video_ids: List of video IDs (max 50)
            
        Returns:
            Dict mapping video_id to VideoStats
        """
        ...
    
    def get_channel_info(
        self,
        channel_ids: list[str],
    ) -> dict[str, ChannelInfo]:
        """
        Get information for multiple channels in a single batched request.
        
        Args:
            channel_ids: List of channel IDs (max 50)
            
        Returns:
            Dict mapping channel_id to ChannelInfo
        """
        ...
    
    def get_video_stats_batched(
        self,
        video_ids: list[str],
        batch_size: int = 50,
    ) -> dict[str, VideoStats]:
        """
        Get statistics for many videos, automatically batching requests.
        
        Args:
            video_ids: List of video IDs (any length)
            batch_size: Videos per API request (max 50)
            
        Returns:
            Dict mapping video_id to VideoStats
        """
        ...
    
    def get_channel_info_batched(
        self,
        channel_ids: list[str],
        batch_size: int = 50,
    ) -> dict[str, ChannelInfo]:
        """
        Get information for many channels, automatically batching requests.
        
        Args:
            channel_ids: List of channel IDs (any length)
            batch_size: Channels per API request (max 50)
            
        Returns:
            Dict mapping channel_id to ChannelInfo
        """
        ...
