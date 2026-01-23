"""
Cluster labeling using TF-IDF keyword extraction.

Responsibility: Extract keywords and generate labels from video titles.
Depends on: sklearn (TF-IDF), re, collections.
Does not depend on: Any external I/O, config, or infrastructure.
"""

import re
from collections import Counter
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer


# Common stopwords to filter out
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "how", "what", "why", "when", "where", "this", "that", "these", "those",
    "you", "your", "my", "we", "they", "i", "it", "as", "vs", "best", "top",
    "new", "video", "videos", "youtube", "watch", "subscribe", "like", "comment",
    "2024", "2025", "2026", "part", "episode", "ep", "vol", "official",
}


def clean_title(title: str) -> str:
    """Clean and normalize a video title for keyword extraction."""
    # Lowercase
    title = title.lower()
    # Remove special characters but keep spaces
    title = re.sub(r"[^a-z0-9\s]", " ", title)
    # Remove extra whitespace
    title = " ".join(title.split())
    return title


def extract_keywords_tfidf(titles: list[str], top_n: int = 5) -> list[str]:
    """
    Extract top keywords from a collection of titles using TF-IDF.
    
    Args:
        titles: List of video titles
        top_n: Number of keywords to extract
        
    Returns:
        List of top keywords
    """
    if not titles:
        return []
    
    # Clean titles
    cleaned = [clean_title(t) for t in titles]
    
    # Filter out stopwords manually first for better results
    filtered = []
    for title in cleaned:
        words = [w for w in title.split() if w not in STOPWORDS and len(w) >= 3]
        filtered.append(" ".join(words))
    
    # Handle edge case of all titles becoming empty
    if not any(filtered):
        return []
    
    try:
        # Use TF-IDF to find important terms
        vectorizer = TfidfVectorizer(
            max_features=50,
            ngram_range=(1, 2),  # Include bigrams
            min_df=1,
            stop_words=list(STOPWORDS),
        )
        tfidf_matrix = vectorizer.fit_transform(filtered)
        
        # Get feature names and their average TF-IDF scores across documents
        feature_names = vectorizer.get_feature_names_out()
        avg_scores = tfidf_matrix.mean(axis=0).A1
        
        # Sort by score
        sorted_indices = avg_scores.argsort()[::-1]
        
        # Get top keywords
        keywords = [feature_names[i] for i in sorted_indices[:top_n]]
        return keywords
        
    except Exception:
        # Fallback to simple frequency-based extraction
        return extract_keywords_frequency(titles, top_n)


def extract_keywords_frequency(titles: list[str], top_n: int = 5) -> list[str]:
    """
    Fallback keyword extraction using simple word frequency.
    
    Args:
        titles: List of video titles
        top_n: Number of keywords to extract
        
    Returns:
        List of top keywords
    """
    word_counts: Counter[str] = Counter()
    
    for title in titles:
        cleaned = clean_title(title)
        words = [w for w in cleaned.split() if w not in STOPWORDS and len(w) >= 3]
        word_counts.update(words)
    
    return [word for word, _ in word_counts.most_common(top_n)]


def generate_cluster_label(keywords: list[str]) -> str:
    """
    Generate a human-readable label from keywords.
    
    Args:
        keywords: List of keywords for the cluster
        
    Returns:
        Human-readable cluster label
    """
    if not keywords:
        return "General"
    
    # Capitalize and join top 2-3 keywords
    label_words = keywords[:3]
    label = " ".join(word.title() for word in label_words)
    
    return label


def label_cluster(titles: list[str]) -> dict[str, Any]:
    """
    Generate label and keywords for a cluster of video titles.
    
    Args:
        titles: List of video titles in the cluster
        
    Returns:
        Dict with 'label' and 'keywords'
    """
    keywords = extract_keywords_tfidf(titles, top_n=5)
    label = generate_cluster_label(keywords)
    
    return {
        "label": label,
        "keywords": keywords,
    }
