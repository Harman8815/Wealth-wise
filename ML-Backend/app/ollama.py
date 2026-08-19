"""
Ollama adapter — thin wrapper around Ollama's local HTTP API.

Nothing else in ML-Backend should call Ollama directly; this module is the
single place to change if the Ollama API surface moves.
"""
from __future__ import annotations

import asyncio
import json
import os
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:14b")
DEFAULT_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


class OllamaAdapterError(Exception):
    """Raised when Ollama returns a non-success response."""


async def generate(
    messages: List[Dict[str, str]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    stream: bool = False,
    options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Send a non-streaming chat completion request to Ollama."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }
    if options:
        payload["options"] = options
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
        )
        if resp.status_code != 200:
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        return resp.json()


async def stream(
    messages: List[Dict[str, str]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    options: Optional[Dict[str, Any]] = None,
) -> AsyncGenerator[str, None]:
    """Stream chat completion tokens from Ollama."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": True,
    }
    if options:
        payload["options"] = options
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_URL}/api/chat",
            json=payload,
        ) as resp:
            if resp.status_code != 200:
                text = await resp.aread()
                raise OllamaAdapterError(
                    f"Ollama stream failed ({resp.status_code}): {text.decode()}"
                )
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    if "done" in chunk and chunk["done"]:
                        break
                    message = chunk.get("message", {})
                    content = message.get("content", "")
                    if content:
                        yield content
                except Exception:
                    continue


async def embed(
    text: str,
    *,
    model: str = DEFAULT_EMBED_MODEL,
) -> List[float]:
    """Return an embedding vector for ``text``."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/embed",
            json={"model": model, "prompt": text},
        )
        if resp.status_code != 200:
            raise OllamaAdapterError(
                f"Ollama embed failed ({resp.status_code}): {resp.text}"
            )
        data = resp.json()
        return data.get("embedding", [])


async def generate_with_tools(
    messages: List[Dict[str, Any]],
    tools: List[Dict[str, Any]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Send a chat completion request with tool definitions."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": False,
        "tools": tools,
    }
    if options:
        payload["options"] = options
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
        )
        if resp.status_code != 200:
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        return resp.json()
