"""
Tests for domain scoring logic.

These tests verify that scoring computations produce consistent, expected outputs.
"""

import pytest
from datetime import datetime, timezone, timedelta

from worker.domain.scoring import (
    compute_views_per_day,
    compute_velocity,
    compute_breakout_by_subs,
    compute_breakout_by_baseline,
    compute_opportunity_score,
    compute_winner_concentration,
)


class TestComputeViewsPerDay:
    """Tests for views_per_day computation."""
    
    def test_basic_computation(self):
        """Views per day should equal views divided by age in days."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(days=10)
        
        result = compute_views_per_day(10000, published, now)
        
        assert result == 1000.0
    
    def test_very_new_video(self):
        """New videos should use minimum age to avoid division by zero."""
        now = datetime(2026, 1, 22, 12, 0, 0, tzinfo=timezone.utc)
        published = now - timedelta(minutes=5)
        
        result = compute_views_per_day(100, published, now)
        
        # Should use 0.01 days minimum
        assert result > 0
        assert result < 100 / (5 / 1440)  # Less than if using actual age
    
    def test_handles_naive_datetime(self):
        """Should handle naive datetimes by assuming UTC."""
        now = datetime(2026, 1, 22, 12, 0, 0)  # Naive
        published = datetime(2026, 1, 12, 12, 0, 0)  # Naive
        
        result = compute_views_per_day(10000, published, now)
        
        assert result == 1000.0


class TestComputeVelocity:
    """Tests for velocity computation."""
    
    def test_positive_velocity(self):
        """Velocity should be the difference between snapshots."""
        result = compute_velocity(current_view_count=1500, previous_view_count=1000)
        assert result == 500
    
    def test_zero_velocity(self):
        """Zero velocity when counts are equal."""
        result = compute_velocity(current_view_count=1000, previous_view_count=1000)
        assert result == 0
    
    def test_negative_velocity(self):
        """Negative velocity is possible (deleted views)."""
        result = compute_velocity(current_view_count=900, previous_view_count=1000)
        assert result == -100
    
    def test_none_previous(self):
        """Returns None when previous snapshot unavailable."""
        result = compute_velocity(current_view_count=1000, previous_view_count=None)
        assert result is None


class TestComputeBreakoutBySubscribers:
    """Tests for subscriber-normalized breakout score."""
    
    def test_basic_computation(self):
        """Breakout = velocity / subscribers."""
        result = compute_breakout_by_subs(velocity_24h=10000.0, subscriber_count=100000)
        assert result == 0.1
    
    def test_minimum_subscriber_floor(self):
        """Small channels should use minimum floor."""
        result = compute_breakout_by_subs(velocity_24h=1000.0, subscriber_count=50, min_subs=100)
        assert result == 10.0  # 1000 / 100
    
    def test_none_subscriber_count(self):
        """Should handle None subscriber count."""
        result = compute_breakout_by_subs(velocity_24h=1000.0, subscriber_count=None, min_subs=100)
        assert result == 10.0  # Uses min_subs
    
    def test_none_velocity(self):
        """Returns None when velocity unavailable."""
        result = compute_breakout_by_subs(velocity_24h=None, subscriber_count=100000)
        assert result is None


class TestComputeBreakoutByBaseline:
    """Tests for baseline-normalized breakout score."""
    
    def test_above_baseline(self):
        """Score > 1 when above channel's typical performance."""
        result = compute_breakout_by_baseline(velocity_24h=2000.0, channel_median_velocity=1000.0)
        assert result == 2.0
    
    def test_at_baseline(self):
        """Score = 1 when at channel's typical performance."""
        result = compute_breakout_by_baseline(velocity_24h=1000.0, channel_median_velocity=1000.0)
        assert result == 1.0
    
    def test_below_baseline(self):
        """Score < 1 when below channel's typical performance."""
        result = compute_breakout_by_baseline(velocity_24h=500.0, channel_median_velocity=1000.0)
        assert result == 0.5
    
    def test_none_baseline(self):
        """Returns None when baseline unavailable."""
        result = compute_breakout_by_baseline(velocity_24h=1000.0, channel_median_velocity=None)
        assert result is None
    
    def test_zero_baseline(self):
        """Returns None when baseline is zero."""
        result = compute_breakout_by_baseline(velocity_24h=1000.0, channel_median_velocity=0.0)
        assert result is None


class TestComputeOpportunityScore:
    """Tests for cluster opportunity scoring."""
    
    def test_basic_computation(self):
        """Opportunity increases with velocity, decreases with competition."""
        result = compute_opportunity_score(
            median_velocity=10000.0,
            avg_subs=100000.0,  # 1x competition
            concentration=0.5,  # 1.5x concentration factor
        )
        # 10000 / (1.0 * 1.5) = 6666.67
        assert result is not None
        assert 6600 < result < 6700
    
    def test_low_competition_high_opportunity(self):
        """Small channel niches should have higher opportunity."""
        low_comp = compute_opportunity_score(
            median_velocity=10000.0,
            avg_subs=10000.0,  # Small channels
            concentration=0.3,
        )
        high_comp = compute_opportunity_score(
            median_velocity=10000.0,
            avg_subs=1000000.0,  # Large channels
            concentration=0.3,
        )
        assert low_comp > high_comp
    
    def test_none_velocity(self):
        """Returns None when velocity unavailable."""
        result = compute_opportunity_score(
            median_velocity=None,
            avg_subs=100000.0,
            concentration=0.5,
        )
        assert result is None


class TestComputeWinnerConcentration:
    """Tests for Gini coefficient computation."""
    
    def test_even_distribution(self):
        """Even distribution should have low concentration."""
        result = compute_winner_concentration([1000, 1000, 1000, 1000])
        assert result < 0.1
    
    def test_uneven_distribution(self):
        """Uneven distribution should have higher concentration."""
        result = compute_winner_concentration([10000, 100, 100, 100])
        assert result > 0.5
    
    def test_single_video(self):
        """Single video should return 0."""
        result = compute_winner_concentration([1000])
        assert result == 0.0
    
    def test_empty_list(self):
        """Empty list should return 0."""
        result = compute_winner_concentration([])
        assert result == 0.0
    
    def test_all_zeros(self):
        """All zeros should return 0."""
        result = compute_winner_concentration([0, 0, 0, 0])
        assert result == 0.0
    
    def test_bounded_output(self):
        """Output should always be between 0 and 1."""
        # Test extreme case
        result = compute_winner_concentration([1000000, 1, 1, 1])
        assert 0 <= result <= 1
