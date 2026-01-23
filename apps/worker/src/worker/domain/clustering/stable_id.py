"""
Stable cluster ID generation.

Responsibility: Generate deterministic cluster IDs from member videos.
Depends on: hashlib, uuid.
Does not depend on: Any external I/O, config, or infrastructure.
"""

import hashlib
import uuid


def stable_cluster_id(window: str, video_ids: list[str]) -> str:
    """
    Generate a stable cluster ID from window and video IDs.
    
    Same videos in same window = same cluster ID.
    This makes cluster updates idempotent.
    
    Args:
        window: Time window
        video_ids: List of video IDs in the cluster
        
    Returns:
        UUID string
    """
    sorted_ids = sorted(video_ids)
    content = f"{window}:{','.join(sorted_ids)}"
    hash_bytes = hashlib.sha256(content.encode()).digest()[:16]
    return str(uuid.UUID(bytes=hash_bytes))
