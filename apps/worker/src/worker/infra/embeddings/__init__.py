"""
Embeddings infrastructure - OpenAI implementation.

Responsibility: Implement EmbedderProtocol with OpenAI API.
Depends on: openai, tenacity.
"""

from .openai_embedder import OpenAIEmbedder

__all__ = ["OpenAIEmbedder"]
