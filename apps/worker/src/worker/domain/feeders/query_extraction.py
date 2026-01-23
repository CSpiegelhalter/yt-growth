"""
Query extraction for expansion feeders.

Responsibility: Extract search queries from video titles and generate long-tail queries.
Depends on: re, random.
Does not depend on: Any external I/O, config, or infrastructure.
"""

import re
import random

from .seeds import INTENT_SEEDS


# Common stopwords to filter out
STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to",
    "for", "of", "and", "or", "but", "with", "this", "that", "my", "your",
    "i", "you", "we", "they", "it",
}


def extract_query_terms(title: str) -> list[str]:
    """
    Extract potential search terms from a video title.
    
    Returns 2-4 word phrases that might work as search queries.
    
    Args:
        title: Video title to extract from
        
    Returns:
        List of potential search query phrases
    """
    # Clean title
    title = re.sub(r'[^\w\s]', ' ', title.lower())
    words = title.split()
    
    # Filter out common stopwords
    words = [w for w in words if w not in STOPWORDS and len(w) > 2]
    
    queries = []
    
    # Extract 2-word phrases
    for i in range(len(words) - 1):
        phrase = f"{words[i]} {words[i+1]}"
        queries.append(phrase)
    
    # Extract 3-word phrases
    for i in range(len(words) - 2):
        phrase = f"{words[i]} {words[i+1]} {words[i+2]}"
        queries.append(phrase)
    
    return queries[:5]  # Limit to top 5 phrases per title


def generate_long_tail_queries(
    keywords: list[str],
    queries_per_run: int = 10,
) -> list[str]:
    """
    Combine intent seeds with keywords to create long-tail queries.
    
    Args:
        keywords: Keywords extracted from video corpus
        queries_per_run: Maximum queries to generate
        
    Returns:
        List of long-tail search queries
    """
    intents = random.sample(INTENT_SEEDS, min(10, len(INTENT_SEEDS)))
    keywords_sample = random.sample(keywords, min(20, len(keywords)))
    
    queries = []
    for intent in intents:
        for keyword in keywords_sample[:5]:  # Limit combinations
            queries.append(f"{intent} {keyword}")
    
    random.shuffle(queries)
    return queries[:queries_per_run]
