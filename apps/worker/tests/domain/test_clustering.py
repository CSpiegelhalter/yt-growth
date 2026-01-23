"""
Tests for domain clustering logic.

These tests verify that clustering produces consistent, expected outputs.
"""

import pytest
import numpy as np

from worker.domain.clustering import stable_cluster_id, normalize_embeddings


class TestStableClusterId:
    """Tests for stable cluster ID generation."""
    
    def test_same_inputs_same_id(self):
        """Same inputs should produce same ID."""
        id1 = stable_cluster_id("7d", ["vid1", "vid2", "vid3"])
        id2 = stable_cluster_id("7d", ["vid1", "vid2", "vid3"])
        
        assert id1 == id2
    
    def test_order_independent(self):
        """Order of video IDs should not matter."""
        id1 = stable_cluster_id("7d", ["vid1", "vid2", "vid3"])
        id2 = stable_cluster_id("7d", ["vid3", "vid1", "vid2"])
        
        assert id1 == id2
    
    def test_different_windows_different_ids(self):
        """Different windows should produce different IDs."""
        id1 = stable_cluster_id("7d", ["vid1", "vid2"])
        id2 = stable_cluster_id("30d", ["vid1", "vid2"])
        
        assert id1 != id2
    
    def test_different_videos_different_ids(self):
        """Different videos should produce different IDs."""
        id1 = stable_cluster_id("7d", ["vid1", "vid2"])
        id2 = stable_cluster_id("7d", ["vid1", "vid3"])
        
        assert id1 != id2
    
    def test_returns_valid_uuid(self):
        """Should return a valid UUID string."""
        cluster_id = stable_cluster_id("7d", ["vid1", "vid2"])
        
        # UUID format: 8-4-4-4-12 hex digits
        import uuid
        parsed = uuid.UUID(cluster_id)
        assert str(parsed) == cluster_id


class TestNormalizeEmbeddings:
    """Tests for embedding normalization."""
    
    def test_normalizes_to_unit_length(self):
        """Should normalize vectors to unit length."""
        embeddings = np.array([
            [3.0, 4.0, 0.0],
            [1.0, 1.0, 1.0],
        ])
        
        result = normalize_embeddings(embeddings)
        
        # Check magnitudes are 1
        magnitudes = np.linalg.norm(result, axis=1)
        np.testing.assert_array_almost_equal(magnitudes, [1.0, 1.0])
    
    def test_preserves_direction(self):
        """Should preserve relative direction of vectors."""
        embeddings = np.array([
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
        ])
        
        result = normalize_embeddings(embeddings)
        
        # Direction should be preserved
        np.testing.assert_array_almost_equal(result[0], [1.0, 0.0, 0.0])
        np.testing.assert_array_almost_equal(result[1], [0.0, 1.0, 0.0])
    
    def test_handles_single_vector(self):
        """Should handle single vector."""
        embeddings = np.array([[3.0, 4.0]])
        
        result = normalize_embeddings(embeddings)
        
        expected = np.array([[0.6, 0.8]])
        np.testing.assert_array_almost_equal(result, expected)
