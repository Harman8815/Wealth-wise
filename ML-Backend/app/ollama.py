"""
Ollama adapter — thin wrapper around Ollama's local HTTP API.

Nothing else in ML-Backend should call Ollama directly; this module is the
single place to change if the Ollama API surface moves.
"""
from __future__ import annotations

import json
import os
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx

from app.logging_utils import logger as ollama_logger

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2")
DEFAULT_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

DEFAULT_OPTIONS: Dict[str, Any] = {
    "temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.3")),
    "num_predict": int(os.getenv("OLLAMA_NUM_PREDICT", "256")),
    "top_p": float(os.getenv("OLLAMA_TOP_P", "0.9")),
    "repeat_penalty": float(os.getenv("OLLAMA_REPEAT_PENALTY", "1.1")),
}


class OllamaAdapterError(Exception):
    """Raised when Ollama returns a non-success response."""


def _log_ollama_request(endpoint: str, payload: Dict[str, Any]) -> None:
    ollama_logger.debug(
        "ollama_request",
        extra={
            "endpoint": endpoint,
            "payload": payload,
        },
    )


def _log_ollama_response(endpoint: str, response: Dict[str, Any]) -> None:
    ollama_logger.debug(
        "ollama_response",
        extra={
            "endpoint": endpoint,
            "response": response,
        },
    )


async def generate(
    messages: List[Dict[str, str]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    stream: bool = False,
    options: Optional[Dict[str, Any]] = None,
    format: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a non-streaming chat completion request to Ollama."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }
    if options:
        payload["options"] = options
    if format and not stream:
        payload["format"] = format
    _log_ollama_request("/api/chat", payload)
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            )
        except httpx.RequestError as exc:
            raise OllamaAdapterError(f"Ollama chat failed: {exc}") from exc
        if resp.status_code != 200:
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        data = resp.json()
        _log_ollama_response("/api/chat", data)
        return data


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
    _log_ollama_request("/api/chat", payload)
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
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
        except httpx.RequestError as exc:
            raise OllamaAdapterError(f"Ollama stream failed: {exc}") from exc


async def embed(
    text: str,
    *,
    model: str = DEFAULT_EMBED_MODEL,
) -> List[float]:
    """Return an embedding vector for ``text``."""
    payload = {"model": model, "prompt": text}
    _log_ollama_request("/api/embed", payload)
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/embed",
                json={"model": model, "prompt": text},
            )
        except httpx.RequestError as exc:
            raise OllamaAdapterError(f"Ollama embed failed: {exc}") from exc
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
    format: Optional[str] = None,
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
    if format:
        payload["format"] = format
    _log_ollama_request("/api/chat", payload)
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            )
        except httpx.RequestError as exc:
            raise OllamaAdapterError(f"Ollama chat failed: {exc}") from exc
        if resp.status_code != 200:
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        data = resp.json()
        _log_ollama_response("/api/chat", data)
        return data
