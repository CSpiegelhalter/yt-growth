"""
RSS expansion feeder - discover more videos from known channels for FREE.

This feeder uses YouTube RSS feeds to expand our video pool without API quota.
It fetches recent videos from channels we've already discovered.

Cost: $0 / no quota used!
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Iterator

from ...domain.models import VideoSearchResult
from ...infra.youtube import fetch_channel_rss, RSSVideo
from ...ports.repositories import VideoRepositoryProtocol

logger = logging.getLogger(__name__)


class RSSExpansionFeeder:
    """
    Expands video pool using FREE RSS feeds from known channels.
    
    Strategy:
    1. Get unique channel IDs from discovered_videos
    2. Fetch each channel's RSS feed (FREE!)
    3. Return videos we don't already have
    """
    
    FEEDER_NAME = "rss_expand"
    
    def __init__(
        self,
        video_repo: VideoRepositoryProtocol,
        max_channels: int = 50,
        max_per_channel: int = 10,
    ):
        self.video_repo = video_repo
        self.max_channels = max_channels
        self.max_per_channel = max_per_channel
    
    def generate_candidates(self, window: str = "7d") -> Iterator[VideoSearchResult]:
        """
        Generate candidate videos from RSS feeds of known channels.
        
        This is COMPLETELY FREE - no API quota used!
        
        Args:
            window: Time window for filtering (7d, 30d, etc.)
            
        Yields:
            VideoSearchResult objects
        """
        # Get channels we've already discovered videos from
        channel_ids = self.video_repo.get_unique_channel_ids(limit=self.max_channels)
        
        if not channel_ids:
            logger.info("[RSS Expand] No channels found to expand")
            return
        
        logger.info(f"[RSS Expand] Fetching RSS feeds for {len(channel_ids)} channels (FREE!)")
        
        # Get existing video IDs to avoid duplicates
        existing_ids = self.video_repo.get_existing_video_ids()
        
        videos_found = 0
        new_videos = 0
        
        for channel_id in channel_ids:
            try:
                rss_videos = fetch_channel_rss(channel_id)
                
                for rss_video in rss_videos[:self.max_per_channel]:
                    videos_found += 1
                    
                    # Skip if we already have this video
                    if rss_video.video_id in existing_ids:
                        continue
                    
                    # Convert to VideoSearchResult
                    result = VideoSearchResult(
                        video_id=rss_video.video_id,
                        title=rss_video.title,
                        channel_id=rss_video.channel_id,
                        channel_title=rss_video.channel_title,
                        published_at=rss_video.published_at,
                        thumbnail_url=rss_video.thumbnail_url,
                        view_count=rss_video.view_count,  # May be None
                        duration_sec=None,
                    )
                    
                    new_videos += 1
                    yield result
                    
            except Exception as e:
                logger.debug(f"[RSS Expand] Error with channel {channel_id}: {e}")
                continue
        
        logger.info(f"[RSS Expand] Found {videos_found} videos, {new_videos} new (FREE!)")
