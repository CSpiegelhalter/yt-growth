"""
OpenAI embedder implementation.

Responsibility: Implement EmbedderProtocol with OpenAI API.
Depends on: openai, tenacity.
"""

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from ...ports.embeddings import EmbedderProtocol


class OpenAIEmbedder(EmbedderProtocol):
    """OpenAI implementation of embedder protocol."""
    
    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
    ):
        """
        Initialize the embedder.
        
        Args:
            api_key: OpenAI API key
            model: Embedding model name
        """
        self._client = OpenAI(api_key=api_key)
        self._model = model
    
    @property
    def model_name(self) -> str:
        """The name of the embedding model being used."""
        return self._model
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
    )
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a batch of texts using OpenAI API.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors (same order as input)
        """
        if not texts:
            return []
        
        response = self._client.embeddings.create(
            input=texts,
            model=self._model,
        )
        return [item.embedding for item in response.data]
