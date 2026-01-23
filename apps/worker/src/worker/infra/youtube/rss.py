"""
YouTube RSS feed client - FREE data without API quota.

YouTube provides RSS feeds for channels that include recent videos.
Format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID

This is completely free and doesn't count against API quota.
Limited to ~15 most recent videos per channel.
"""

import logging
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterator
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

RSS_BASE_URL = "https://www.youtube.com/feeds/videos.xml"
ATOM_NS = "{http://www.w3.org/2005/Atom}"
MEDIA_NS = "{http://search.yahoo.com/mrss/}"
YT_NS = "{http://www.youtube.com/xml/schemas/2015}"


@dataclass
class RSSVideo:
    """Video data from RSS feed."""
    video_id: str
    title: str
    channel_id: str
    channel_title: str
    published_at: datetime
    thumbnail_url: str | None
    view_count: int | None  # Sometimes available in media:statistics
    

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def fetch_channel_rss(channel_id: str, timeout: int = 10) -> list[RSSVideo]:
    """
    Fetch recent videos from a channel's RSS feed.
    
    This is FREE - no API quota used!
    
    Args:
        channel_id: YouTube channel ID (starts with UC)
        timeout: Request timeout in seconds
        
    Returns:
        List of RSSVideo objects (up to ~15 most recent)
    """
    url = f"{RSS_BASE_URL}?channel_id={channel_id}"
    
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.warning(f"[RSS] Failed to fetch feed for {channel_id}: {e}")
        return []
    
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as e:
        logger.warning(f"[RSS] Failed to parse feed for {channel_id}: {e}")
        return []
    
    # Get channel title from feed
    channel_title = root.findtext(f"{ATOM_NS}title") or "Unknown Channel"
    
    videos = []
    for entry in root.findall(f"{ATOM_NS}entry"):
        try:
            video_id = entry.findtext(f"{YT_NS}videoId")
            if not video_id:
                continue
            
            title = entry.findtext(f"{ATOM_NS}title") or "Untitled"
            
            # Parse published date
            published_str = entry.findtext(f"{ATOM_NS}published")
            if published_str:
                # Format: 2024-01-15T12:00:00+00:00
                published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
            else:
                published_at = datetime.now(timezone.utc)
            
            # Get thumbnail
            media_group = entry.find(f"{MEDIA_NS}group")
            thumbnail_url = None
            if media_group is not None:
                thumbnail = media_group.find(f"{MEDIA_NS}thumbnail")
                if thumbnail is not None:
                    thumbnail_url = thumbnail.get("url")
            
            # Try to get view count from media:statistics (not always present)
            view_count = None
            if media_group is not None:
                community = media_group.find(f"{MEDIA_NS}community")
                if community is not None:
                    statistics = community.find(f"{MEDIA_NS}statistics")
                    if statistics is not None:
                        views_str = statistics.get("views")
                        if views_str:
                            view_count = int(views_str)
            
            videos.append(RSSVideo(
                video_id=video_id,
                title=title,
                channel_id=channel_id,
                channel_title=channel_title,
                published_at=published_at,
                thumbnail_url=thumbnail_url,
                view_count=view_count,
            ))
            
        except Exception as e:
            logger.debug(f"[RSS] Error parsing entry: {e}")
            continue
    
    logger.debug(f"[RSS] Fetched {len(videos)} videos from {channel_id}")
    return videos


def fetch_multiple_channels_rss(
    channel_ids: list[str],
    max_per_channel: int = 15,
) -> Iterator[RSSVideo]:
    """
    Fetch videos from multiple channels via RSS.
    
    Completely FREE - no API quota!
    
    Args:
        channel_ids: List of channel IDs to fetch
        max_per_channel: Max videos per channel (RSS typically has ~15)
        
    Yields:
        RSSVideo objects
    """
    for channel_id in channel_ids:
        try:
            videos = fetch_channel_rss(channel_id)
            for video in videos[:max_per_channel]:
                yield video
        except Exception as e:
            logger.warning(f"[RSS] Error fetching channel {channel_id}: {e}")
            continue
