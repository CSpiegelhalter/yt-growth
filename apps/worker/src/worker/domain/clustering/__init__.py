"""
Clustering domain logic - pure computation functions.

Responsibility: HDBSCAN clustering, UMAP reduction, stable ID generation.
Depends on: numpy, hdbscan, sklearn, umap-learn.
Does not depend on: Any external I/O, config, or infrastructure.
"""

from .algorithms import reduce_dimensions, run_hdbscan, normalize_embeddings
from .stable_id import stable_cluster_id

__all__ = [
    "reduce_dimensions",
    "run_hdbscan",
    "normalize_embeddings",
    "stable_cluster_id",
]
