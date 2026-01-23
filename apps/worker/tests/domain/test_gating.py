"""
Tests for domain gating rules.

These tests verify that gating rules produce consistent, expected outputs.
"""

import pytest
from datetime import datetime, timezone, timedelta

from worker.domain.gating import (
    check_age_eligibility,
    check_channel_cap,
    check_duplicate,
    get_window_for_age,
    get_min_views_for_window,
    enforce_diversity,
)


class TestCheckAgeEligibility:
    """Tests for age eligibility checking."""
    
    def test_very_recent_video(self):
        """Recent video should be eligible for all windows."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(hours=12)
        
        eligible = check_age_eligibility(published, now)
        
        assert "24h" in eligible
        assert "7d" in eligible
        assert "30d" in eligible
        assert "90d" in eligible
    
    def test_week_old_video(self):
        """Week-old video should not be eligible for 24h."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(days=5)
        
        eligible = check_age_eligibility(published, now)
        
        assert "24h" not in eligible
        assert "7d" in eligible
        assert "30d" in eligible
        assert "90d" in eligible
    
    def test_old_video(self):
        """Video older than 90 days should not be eligible."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(days=100)
        
        eligible = check_age_eligibility(published, now)
        
        assert len(eligible) == 0
    
    def test_handles_naive_datetime(self):
        """Should handle naive datetimes."""
        now = datetime(2026, 1, 22, 12, 0, 0)
        published = datetime(2026, 1, 20, 12, 0, 0)
        
        eligible = check_age_eligibility(published, now)
        
        assert "7d" in eligible


class TestCheckChannelCap:
    """Tests for per-channel cap checking."""
    
    def test_under_cap(self):
        """Should return True when under cap."""
        result = check_channel_cap(
            channel_id="ch1",
            channel_counts={"ch1": 2},
            max_per_channel=5,
        )
        assert result is True
    
    def test_at_cap(self):
        """Should return False when at cap."""
        result = check_channel_cap(
            channel_id="ch1",
            channel_counts={"ch1": 5},
            max_per_channel=5,
        )
        assert result is False
    
    def test_over_cap(self):
        """Should return False when over cap."""
        result = check_channel_cap(
            channel_id="ch1",
            channel_counts={"ch1": 10},
            max_per_channel=5,
        )
        assert result is False
    
    def test_new_channel(self):
        """Should return True for channel not in counts."""
        result = check_channel_cap(
            channel_id="new-channel",
            channel_counts={"ch1": 5},
            max_per_channel=5,
        )
        assert result is True


class TestCheckDuplicate:
    """Tests for duplicate checking."""
    
    def test_not_duplicate(self):
        """Should return True for new video."""
        result = check_duplicate(
            video_id="new-video",
            seen_video_ids={"vid1", "vid2", "vid3"},
        )
        assert result is True
    
    def test_is_duplicate(self):
        """Should return False for seen video."""
        result = check_duplicate(
            video_id="vid2",
            seen_video_ids={"vid1", "vid2", "vid3"},
        )
        assert result is False
    
    def test_empty_seen_set(self):
        """Should return True when no videos seen."""
        result = check_duplicate(
            video_id="any-video",
            seen_video_ids=set(),
        )
        assert result is True


class TestGetWindowForAge:
    """Tests for window assignment based on age."""
    
    def test_assigns_smallest_window(self):
        """Should assign the smallest applicable window."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(hours=12)
        
        window = get_window_for_age(published, now)
        
        assert window == "24h"
    
    def test_returns_none_for_old(self):
        """Should return None for videos too old."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(days=100)
        
        window = get_window_for_age(published, now)
        
        assert window is None


class TestGetMinViewsForWindow:
    """Tests for minimum views threshold."""
    
    def test_known_windows(self):
        """Should return correct thresholds for known windows."""
        assert get_min_views_for_window("24h") == 100
        assert get_min_views_for_window("7d") == 500
        assert get_min_views_for_window("30d") == 2000
        assert get_min_views_for_window("90d") == 5000
    
    def test_unknown_window(self):
        """Should return default for unknown windows."""
        assert get_min_views_for_window("unknown") == 500


class TestEnforceDiversity:
    """Tests for diversity enforcement in result lists."""
    
    def test_limits_per_channel(self):
        """Should limit videos per channel."""
        videos = [
            {"video_id": "v1", "channel_id": "ch1"},
            {"video_id": "v2", "channel_id": "ch1"},
            {"video_id": "v3", "channel_id": "ch1"},
            {"video_id": "v4", "channel_id": "ch2"},
        ]
        
        result = enforce_diversity(videos, max_per_channel=2)
        
        ch1_count = sum(1 for v in result if v["channel_id"] == "ch1")
        assert ch1_count == 2
        assert len(result) == 3
    
    def test_limits_per_cluster(self):
        """Should limit videos per cluster when specified."""
        videos = [
            {"video_id": "v1", "channel_id": "ch1", "cluster_id": "c1"},
            {"video_id": "v2", "channel_id": "ch2", "cluster_id": "c1"},
            {"video_id": "v3", "channel_id": "ch3", "cluster_id": "c1"},
            {"video_id": "v4", "channel_id": "ch4", "cluster_id": "c2"},
        ]
        
        result = enforce_diversity(videos, max_per_channel=5, max_per_cluster=2)
        
        c1_count = sum(1 for v in result if v.get("cluster_id") == "c1")
        assert c1_count == 2
    
    def test_preserves_order(self):
        """Should preserve original order."""
        videos = [
            {"video_id": "v1", "channel_id": "ch1"},
            {"video_id": "v2", "channel_id": "ch2"},
            {"video_id": "v3", "channel_id": "ch3"},
        ]
        
        result = enforce_diversity(videos, max_per_channel=5)
        
        assert [v["video_id"] for v in result] == ["v1", "v2", "v3"]
    
    def test_empty_input(self):
        """Should handle empty input."""
        result = enforce_diversity([], max_per_channel=5)
        assert result == []
