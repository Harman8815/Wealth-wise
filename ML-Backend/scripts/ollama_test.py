"""
Quick smoke-test for local Ollama connectivity.

Run from the repo root or ML-Backend/ with the venv activated:

    python ML-Backend/scripts/ollama_test.py

Requires `ollama` running locally and the models pulled:

    ollama pull qwen2.5:14b
    ollama pull nomic-embed-text
"""
from __future__ import annotations

import asyncio
import os

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:14b")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


async def test_chat() -> None:
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": CHAT_MODEL,
                "messages": [
                    {"role": "user", "content": "Say 'WealthWise connectivity check passed' and nothing else."}
                ],
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        message = data.get("message", {}).get("content", "")
        print(f"[chat] model={CHAT_MODEL}")
        print(f"[chat] {message.strip()}")


async def test_embed() -> None:
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/embed",
            json={
                "model": EMBED_MODEL,
                "prompt": "WealthWise AI connectivity check",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        embedding = data.get("embedding", [])
        print(f"[embed] model={EMBED_MODEL}")
        print(f"[embed] vector_length={len(embedding)}")
        print(f"[embed] first_5={embedding[:5]}")


async def main() -> None:
    print(f"Ollama URL: {OLLAMA_URL}")
    await test_chat()
    await test_embed()
    print("Ollama connectivity check passed.")


if __name__ == "__main__":
    asyncio.run(main())
