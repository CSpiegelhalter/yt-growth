"""
Embedder protocol.

Responsibility: Define the contract for embedding text.
Depends on: Nothing.
Does not depend on: Any implementation details (OpenAI, etc.).
"""

from typing import Protocol


class EmbedderProtocol(Protocol):
    """
    Protocol for text embedding services.
    
    Implementations must provide a method to embed batches of text.
    """
    
    @property
    def model_name(self) -> str:
        """The name of the embedding model being used."""
        ...
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a batch of texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors (same order as input)
        """
        ...
