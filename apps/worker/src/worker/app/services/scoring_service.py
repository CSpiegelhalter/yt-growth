"""
Scoring service - coordinate video scoring.

Responsibility: Orchestrate computation of video scores.
Depends on: Domain scoring logic, repository protocols.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from ...domain.models import VideoScore
from ...domain.scoring import (
    compute_views_per_day,
    compute_velocity,
    compute_breakout_by_subs,
    compute_breakout_by_baseline,
)
from ...ports.repositories import ScoreRepositoryProtocol

logger = logging.getLogger(__name__)


class ScoringService:
    """
    Coordinates scoring of videos.
    
    Computes velocity and breakout scores from snapshot data.
    """
    
    def __init__(self, score_repo: ScoreRepositoryProtocol):
        """
        Initialize the scoring service.
        
        Args:
            score_repo: Score repository for fetching data and persistence
        """
        self.score_repo = score_repo
    
    def compute_video_scores(self, window: str) -> dict[str, Any]:
        """
        Compute velocity and breakout scores for all videos in window.
        
        Scores computed:
        - views_per_day: view_count / days_since_published
        - velocity_24h: views gained in last 24h (from snapshots)
        - velocity_7d: views gained in last 7d (from snapshots)
        - breakout_by_subs: velocity_24h / max(100, subscriber_count)
        - breakout_by_baseline: velocity_24h / channel_median_velocity_24h
        
        Args:
            window: Time window (e.g., '7d', '30d')
            
        Returns:
            Summary of scoring operation
        """
        now = datetime.now(timezone.utc)
        
        videos = self.score_repo.fetch_videos_for_scoring(window)
        
        if not videos:
            return {
                "status": "no_data",
                "message": "No videos found for scoring",
                "scored": 0,
            }
        
        logger.info(f"[Score] Computing scores for {len(videos)} videos")
        
        scored = 0
        for v in videos:
            try:
                video_id = v["video_id"]
                view_count = v["view_count"] or 0
                published_at = v["published_at"]
                
                # Normalize published_at
                if isinstance(published_at, str):
                    published_at = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                
                # Views per day
                views_per_day = compute_views_per_day(view_count, published_at, now)
                
                # Velocity (views gained)
                velocity_24h = compute_velocity(view_count, v["view_count_24h_ago"])
                velocity_7d = compute_velocity(view_count, v["view_count_7d_ago"])
                
                # Breakout scores - use views_per_day (works with single snapshot)
                # Falls back to velocity_24h if available for more accuracy
                breakout_by_subs = compute_breakout_by_subs(
                    views_per_day,
                    v["subscriber_count"],
                )
                breakout_by_baseline = compute_breakout_by_baseline(
                    views_per_day,
                    v["channel_median_velocity"],  # This is median_views_per_day now
                )
                
                # Create score object
                score = VideoScore(
                    video_id=video_id,
                    window=window,
                    view_count=view_count,
                    views_per_day=views_per_day,
                    velocity_24h=float(velocity_24h) if velocity_24h else None,
                    velocity_7d=float(velocity_7d) if velocity_7d else None,
                    breakout_by_subs=breakout_by_subs,
                    breakout_by_baseline=breakout_by_baseline,
                )
                
                self.score_repo.upsert_video_score(score)
                scored += 1
                
            except Exception as e:
                logger.error(f"[Score] Error scoring video {v.get('video_id')}: {e}")
                continue
        
        logger.info(f"[Score] Scored {scored} videos")
        
        return {
            "status": "success",
            "message": f"Scored {scored} videos",
            "scored": scored,
            "total_found": len(videos),
        }
