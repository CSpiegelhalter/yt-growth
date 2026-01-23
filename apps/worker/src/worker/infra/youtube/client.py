"""
YouTube Data API client implementation.

Responsibility: Implement YouTubeClientProtocol with real HTTP calls.
Depends on: http helpers, quota tracker, domain models.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from ...domain.models import VideoSearchResult, VideoStats, ChannelInfo
from ...ports.youtube import YouTubeClientProtocol
from .http import YOUTUBE_API_BASE, QUOTA_COSTS, make_request, QuotaExceededError
from .quota import QuotaTracker, get_quota_tracker

logger = logging.getLogger(__name__)


class YouTubeClient(YouTubeClientProtocol):
    """
    YouTube Data API client using API key authentication.
    
    All methods check quota before making requests and track usage.
    """
    
    def __init__(
        self,
        api_key: str,
        quota_tracker: QuotaTracker | None = None,
    ):
        """
        Initialize the client.
        
        Args:
            api_key: YouTube API key
            quota_tracker: Optional quota tracker (uses global if not provided)
        """
        self.api_key = api_key
        self.quota = quota_tracker or get_quota_tracker()
    
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
        cost = QUOTA_COSTS["search.list"]
        if not self.quota.can_afford(cost):
            raise QuotaExceededError(f"Not enough quota for search (need {cost}, have {self.quota.remaining})")
        
        params: dict[str, Any] = {
            "key": self.api_key,
            "part": "snippet",
            "type": "video",
            "q": query,
            "maxResults": min(max_results, 50),
            "order": order,
            "regionCode": region_code,
            "relevanceLanguage": relevance_language,
        }
        
        if published_after:
            params["publishedAfter"] = published_after.strftime("%Y-%m-%dT%H:%M:%SZ")
        if published_before:
            params["publishedBefore"] = published_before.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"{YOUTUBE_API_BASE}/search"
        data = make_request(url, params)
        self.quota.consume(cost)
        
        results: list[VideoSearchResult] = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId")
            
            if not video_id:
                continue
            
            # Parse published_at
            pub_str = snippet.get("publishedAt", "")
            try:
                published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            except ValueError:
                published_at = datetime.now(timezone.utc)
            
            # Get best thumbnail
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = (
                thumbnails.get("high", {}).get("url")
                or thumbnails.get("medium", {}).get("url")
                or thumbnails.get("default", {}).get("url")
            )
            
            results.append(VideoSearchResult(
                video_id=video_id,
                channel_id=snippet.get("channelId", ""),
                channel_title=snippet.get("channelTitle", ""),
                title=snippet.get("title", ""),
                description=snippet.get("description", ""),
                thumbnail_url=thumbnail_url,
                published_at=published_at,
            ))
        
        logger.info(f"Search '{query}' returned {len(results)} videos")
        return results
    
    def get_video_stats(self, video_ids: list[str]) -> dict[str, VideoStats]:
        """
        Get statistics for multiple videos in a single batched request.
        
        Args:
            video_ids: List of video IDs (max 50)
            
        Returns:
            Dict mapping video_id to VideoStats
        """
        if not video_ids:
            return {}
        
        if len(video_ids) > 50:
            raise ValueError("Maximum 50 video IDs per request")
        
        cost = QUOTA_COSTS["videos.list"]
        if not self.quota.can_afford(cost):
            raise QuotaExceededError(f"Not enough quota for videos.list (need {cost}, have {self.quota.remaining})")
        
        params = {
            "key": self.api_key,
            "part": "statistics,contentDetails",
            "id": ",".join(video_ids),
        }
        
        url = f"{YOUTUBE_API_BASE}/videos"
        data = make_request(url, params)
        self.quota.consume(cost)
        
        results: dict[str, VideoStats] = {}
        for item in data.get("items", []):
            video_id = item.get("id")
            if not video_id:
                continue
            
            stats = item.get("statistics", {})
            content = item.get("contentDetails", {})
            
            # Parse duration (ISO 8601 duration)
            duration_str = content.get("duration", "")
            duration_seconds = self._parse_duration(duration_str)
            
            results[video_id] = VideoStats(
                video_id=video_id,
                view_count=int(stats.get("viewCount", 0)),
                like_count=int(stats["likeCount"]) if "likeCount" in stats else None,
                comment_count=int(stats["commentCount"]) if "commentCount" in stats else None,
                duration_seconds=duration_seconds,
            )
        
        logger.info(f"Fetched stats for {len(results)}/{len(video_ids)} videos")
        return results
    
    def get_channel_info(self, channel_ids: list[str]) -> dict[str, ChannelInfo]:
        """
        Get information for multiple channels in a single batched request.
        
        Args:
            channel_ids: List of channel IDs (max 50)
            
        Returns:
            Dict mapping channel_id to ChannelInfo
        """
        if not channel_ids:
            return {}
        
        if len(channel_ids) > 50:
            raise ValueError("Maximum 50 channel IDs per request")
        
        cost = QUOTA_COSTS["channels.list"]
        if not self.quota.can_afford(cost):
            raise QuotaExceededError(f"Not enough quota for channels.list (need {cost}, have {self.quota.remaining})")
        
        params = {
            "key": self.api_key,
            "part": "snippet,statistics",
            "id": ",".join(channel_ids),
        }
        
        url = f"{YOUTUBE_API_BASE}/channels"
        data = make_request(url, params)
        self.quota.consume(cost)
        
        results: dict[str, ChannelInfo] = {}
        for item in data.get("items", []):
            channel_id = item.get("id")
            if not channel_id:
                continue
            
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            
            # Parse published_at
            pub_str = snippet.get("publishedAt", "")
            try:
                published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            except ValueError:
                published_at = None
            
            # hiddenSubscriberCount means count is private
            if stats.get("hiddenSubscriberCount"):
                subscriber_count = None
            else:
                subscriber_count = int(stats.get("subscriberCount", 0)) or None
            
            results[channel_id] = ChannelInfo(
                channel_id=channel_id,
                title=snippet.get("title", ""),
                subscriber_count=subscriber_count,
                video_count=int(stats.get("videoCount", 0)) or None,
                published_at=published_at,
            )
        
        logger.info(f"Fetched info for {len(results)}/{len(channel_ids)} channels")
        return results
    
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
        all_results: dict[str, VideoStats] = {}
        batch_size = min(batch_size, 50)
        
        for i in range(0, len(video_ids), batch_size):
            batch = video_ids[i:i + batch_size]
            try:
                results = self.get_video_stats(batch)
                all_results.update(results)
            except QuotaExceededError:
                logger.warning(f"Quota exceeded after {len(all_results)} videos")
                break
        
        return all_results
    
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
        # Dedupe while preserving order
        seen = set()
        unique_ids = []
        for cid in channel_ids:
            if cid not in seen:
                seen.add(cid)
                unique_ids.append(cid)
        
        all_results: dict[str, ChannelInfo] = {}
        batch_size = min(batch_size, 50)
        
        for i in range(0, len(unique_ids), batch_size):
            batch = unique_ids[i:i + batch_size]
            try:
                results = self.get_channel_info(batch)
                all_results.update(results)
            except QuotaExceededError:
                logger.warning(f"Quota exceeded after {len(all_results)} channels")
                break
        
        return all_results
    
    @staticmethod
    def _parse_duration(duration_str: str) -> int | None:
        """
        Parse ISO 8601 duration to seconds.
        
        Examples: PT1H30M, PT5M30S, PT30S
        """
        if not duration_str or not duration_str.startswith("PT"):
            return None
        
        duration_str = duration_str[2:]  # Remove "PT"
        
        hours = 0
        minutes = 0
        seconds = 0
        
        # Extract hours
        if "H" in duration_str:
            h_idx = duration_str.index("H")
            hours = int(duration_str[:h_idx])
            duration_str = duration_str[h_idx + 1:]
        
        # Extract minutes
        if "M" in duration_str:
            m_idx = duration_str.index("M")
            minutes = int(duration_str[:m_idx])
            duration_str = duration_str[m_idx + 1:]
        
        # Extract seconds
        if "S" in duration_str:
            s_idx = duration_str.index("S")
            seconds = int(duration_str[:s_idx])
        
        return hours * 3600 + minutes * 60 + seconds
