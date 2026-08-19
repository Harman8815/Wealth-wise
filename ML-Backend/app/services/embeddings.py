"""
Embedding service for ML-Backend.

Wraps ``OllamaAdapter.embed()`` and provides a stable interface for the
memory pipeline.  All embeddings are produced by the same local Ollama
embedding model so they are comparable in the Chroma collection.
"""
from __future__ import annotations

from typing import List

from app.ollama import DEFAULT_EMBED_MODEL, OllamaAdapterError, embed


class EmbeddingService:
    def __init__(self, model: str = DEFAULT_EMBED_MODEL) -> None:
        self.model = model

    async def embed(self, text: str) -> List[float]:
        if not text or not text.strip():
            return []
        try:
            return await embed(text, model=self.model)
        except OllamaAdapterError:
            return []

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed(text) for text in texts]
