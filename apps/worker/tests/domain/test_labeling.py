"""
Tests for domain labeling logic.

These tests verify that keyword extraction and label generation are consistent.
"""

import pytest

from worker.domain.labeling import (
    clean_title,
    extract_keywords_tfidf,
    extract_keywords_frequency,
    generate_cluster_label,
    label_cluster,
)


class TestCleanTitle:
    """Tests for title cleaning."""
    
    def test_removes_special_characters(self):
        """Should remove special characters."""
        result = clean_title("How to Code! #programming @python")
        assert "!" not in result
        assert "#" not in result
        assert "@" not in result
    
    def test_lowercases(self):
        """Should lowercase the title."""
        result = clean_title("UPPERCASE TITLE")
        assert result == "uppercase title"
    
    def test_normalizes_whitespace(self):
        """Should normalize multiple spaces."""
        result = clean_title("too    many   spaces")
        assert result == "too many spaces"


class TestExtractKeywordsFrequency:
    """Tests for frequency-based keyword extraction."""
    
    def test_extracts_common_words(self):
        """Should extract most common meaningful words."""
        titles = [
            "python programming tutorial",
            "learn python basics",
            "python for beginners",
        ]
        
        keywords = extract_keywords_frequency(titles, top_n=3)
        
        assert "python" in keywords
    
    def test_filters_stopwords(self):
        """Should not include stopwords."""
        titles = ["the best way to learn"]
        
        keywords = extract_keywords_frequency(titles, top_n=5)
        
        assert "the" not in keywords
        assert "to" not in keywords
    
    def test_filters_short_words(self):
        """Should filter out very short words."""
        titles = ["a b c testing"]
        
        keywords = extract_keywords_frequency(titles, top_n=5)
        
        assert "testing" in keywords
        assert "a" not in keywords
    
    def test_empty_input(self):
        """Should handle empty input."""
        keywords = extract_keywords_frequency([], top_n=5)
        assert keywords == []


class TestExtractKeywordsTfidf:
    """Tests for TF-IDF keyword extraction."""
    
    def test_extracts_keywords(self):
        """Should extract meaningful keywords."""
        titles = [
            "python programming tutorial for beginners",
            "learn python basics step by step",
            "python coding course complete guide",
        ]
        
        keywords = extract_keywords_tfidf(titles, top_n=5)
        
        # Should find common terms
        assert len(keywords) > 0
    
    def test_handles_single_title(self):
        """Should handle single title."""
        titles = ["machine learning tutorial"]
        
        keywords = extract_keywords_tfidf(titles, top_n=3)
        
        assert len(keywords) > 0
    
    def test_empty_input(self):
        """Should handle empty input."""
        keywords = extract_keywords_tfidf([], top_n=5)
        assert keywords == []
    
    def test_all_stopwords(self):
        """Should handle input that becomes empty after stopword filtering."""
        titles = ["the a an is are"]
        
        keywords = extract_keywords_tfidf(titles, top_n=5)
        
        # Should return empty or fall back gracefully
        assert isinstance(keywords, list)


class TestGenerateClusterLabel:
    """Tests for cluster label generation."""
    
    def test_capitalizes_keywords(self):
        """Should capitalize keywords in label."""
        label = generate_cluster_label(["python", "programming", "tutorial"])
        
        assert "Python" in label
    
    def test_uses_top_keywords(self):
        """Should use top 3 keywords."""
        label = generate_cluster_label(["one", "two", "three", "four", "five"])
        
        assert "One" in label
        assert "Two" in label
        assert "Three" in label
        assert "Four" not in label
    
    def test_handles_empty_keywords(self):
        """Should return 'General' for empty keywords."""
        label = generate_cluster_label([])
        assert label == "General"


class TestLabelCluster:
    """Tests for combined cluster labeling."""
    
    def test_returns_label_and_keywords(self):
        """Should return both label and keywords."""
        titles = [
            "python machine learning tutorial",
            "deep learning with python",
            "python AI course",
        ]
        
        result = label_cluster(titles)
        
        assert "label" in result
        assert "keywords" in result
        assert len(result["keywords"]) > 0
    
    def test_empty_titles(self):
        """Should handle empty titles list."""
        result = label_cluster([])
        
        assert result["label"] == "General"
        assert result["keywords"] == []
