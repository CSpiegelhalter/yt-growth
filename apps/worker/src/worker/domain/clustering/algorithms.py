"""
Clustering algorithms - HDBSCAN with UMAP dimensionality reduction.

Responsibility: Provide pure clustering functions.
Depends on: numpy, hdbscan, sklearn, umap-learn.
Does not depend on: Any external I/O, config, or infrastructure.
"""

import numpy as np
import hdbscan
from sklearn.preprocessing import normalize


def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    """
    Normalize embedding vectors to unit length.
    
    Args:
        embeddings: Raw embedding matrix
        
    Returns:
        Normalized embedding matrix
    """
    return normalize(embeddings)


def reduce_dimensions(
    embeddings: np.ndarray,
    n_components: int = 25,
    n_neighbors: int = 15,
) -> np.ndarray:
    """
    Reduce embedding dimensions using UMAP for better clustering.
    
    Args:
        embeddings: High-dimensional embedding matrix
        n_components: Target dimensions
        n_neighbors: UMAP n_neighbors parameter
        
    Returns:
        Reduced embedding matrix
    """
    try:
        import umap
        
        # Only reduce if we have enough samples
        if len(embeddings) < n_neighbors:
            n_neighbors = max(2, len(embeddings) - 1)
        
        if len(embeddings) < n_components:
            n_components = max(2, len(embeddings) - 1)
        
        reducer = umap.UMAP(
            n_components=n_components,
            n_neighbors=n_neighbors,
            min_dist=0.0,
            metric="cosine",
            random_state=42,
        )
        return reducer.fit_transform(embeddings)
        
    except Exception as e:
        # Fall back to raw embeddings if UMAP fails
        print(f"[Cluster] UMAP failed, using raw embeddings: {e}")
        return embeddings


def run_hdbscan(
    embeddings: np.ndarray,
    min_cluster_size: int = 5,
) -> np.ndarray:
    """
    Run HDBSCAN clustering on embeddings.
    
    Args:
        embeddings: Embedding matrix (possibly UMAP-reduced)
        min_cluster_size: Minimum cluster size
        
    Returns:
        Cluster labels array (-1 = noise)
    """
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=1,
        metric="euclidean",
        cluster_selection_method="eom",
    )
    return clusterer.fit_predict(embeddings)
