"""
Memory extraction and storage for ML-Backend.

After each assistant turn, this module asks Ollama whether the turn
contains a durable fact worth remembering.  If yes, it embeds the fact
and stores it in Chroma with ``user_id`` metadata; otherwise it discards
the candidate.
"""
from __future__ import annotations

import json
import os
from typing import List, Optional

from app.ollama import DEFAULT_CHAT_MODEL, OllamaAdapterError, generate
from app.services.embeddings import EmbeddingService
from app.vector import get_collection

MEMORY_EXTRACTION_PROMPT = (
    "You are a memory extraction assistant. "
    "Decide whether the assistant turn below contains any durable fact "
    "worth remembering about the user. "
    "Reply ONLY with a JSON object: "
    '{"memory": "<fact or empty string>", "confidence": "high"|"medium"|"low"}'
)

MEMORY_COLLECTION = os.getenv("CHROMA_COLLECTION", "memories")


async def extract_memory(user_id: str, assistant_reply: str) -> Optional[str]:
    if not assistant_reply or not assistant_reply.strip():
        return None

    messages = [
        {"role": "system", "content": MEMORY_EXTRACTION_PROMPT},
        {"role": "user", "content": assistant_reply},
    ]
    try:
        result = await generate(messages, model=DEFAULT_CHAT_MODEL, stream=False)
        content = result.get("message", {}).get("content", "").strip()
        if not content:
            return None
        data = json.loads(content)
        memory = (data.get("memory") or "").strip()
        confidence = data.get("confidence", "low")
        if not memory or confidence not in {"high", "medium"}:
            return None
        return memory
    except Exception:
        return None


async def store_memory(user_id: str, text: str, embedding: List[float]) -> None:
    if not text or not embedding:
        return
    collection = get_collection()
    collection.add(
        documents=[text],
        embeddings=[embedding],
        metadatas=[{"user_id": user_id}],
        ids=[f"{user_id}:{hash(text)}"],
    )


async def maybe_store_memory(user_id: str, assistant_reply: str) -> None:
    memory = await extract_memory(user_id, assistant_reply)
    if not memory:
        return
    service = EmbeddingService()
    embedding = await service.embed(memory)
    await store_memory(user_id, memory, embedding)
