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
from app.debug_events import DebugEvent, DebugStage, StageStatus, get_debug_store

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:1b")
DEFAULT_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_BYPASS = os.getenv("OLLAMA_BYPASS", "false").lower() in {"1", "true", "yes"}
OLLAMA_NUM_PARALLEL = int(os.getenv("OLLAMA_NUM_PARALLEL", "1"))

DEFAULT_OPTIONS: Dict[str, Any] = {
    "temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.3")),
    "num_predict": int(os.getenv("OLLAMA_NUM_PREDICT", "256")),
    "top_p": float(os.getenv("OLLAMA_TOP_P", "0.9")),
    "repeat_penalty": float(os.getenv("OLLAMA_REPEAT_PENALTY", "1.1")),
}


class OllamaAdapterError(Exception):
    """Raised when Ollama returns a non-success response."""


def _emit_ollama_debug(request_id: Optional[str], stage: DebugStage, status: StageStatus, **kwargs: Any) -> None:
    try:
        if not request_id:
            return
        store = get_debug_store()
        store.append_event(
            DebugEvent(
                request_id=request_id,
                stage=stage,
                status=status,
                service="ollama",
                route="/api/chat",
                **kwargs,
            )
        )
    except Exception:
        pass


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


def _build_options(options: Optional[Dict[str, Any]], num_predict: Optional[int] = None) -> Dict[str, Any]:
    merged = dict(DEFAULT_OPTIONS)
    if options:
        merged.update(options)
    if num_predict is not None:
        merged["num_predict"] = num_predict
    return merged


def _ollama_bypass_response(payload: Dict[str, Any], request_id: Optional[str] = None) -> Dict[str, Any]:
    """Return a synthetic Ollama response without making an HTTP call."""
    return {
        "model": payload.get("model", DEFAULT_CHAT_MODEL),
        "created_at": "2026-01-01T00:00:00.000000000Z",
        "message": {
            "role": "assistant",
            "content": "[OLLAMA BYPASS] No model call was made. Inspect the payload below.",
        },
        "done": True,
        "ollama_bypass": True,
        "ollama_call_skipped": True,
        "request_id": request_id,
        "payload": payload,
    }


async def generate(
    messages: List[Dict[str, str]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    stream: bool = False,
    options: Optional[Dict[str, Any]] = None,
    format: Optional[str] = None,
    num_predict: Optional[int] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a non-streaming chat completion request to Ollama."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }
    merged_options = _build_options(options, num_predict)
    if merged_options:
        payload["options"] = merged_options
    if format and not stream:
        payload["format"] = format
    _emit_ollama_debug(request_id, DebugStage.OLLAMA_REQUEST, StageStatus.RUNNING, input_data={"model": model, "message_count": len(messages)})
    _log_ollama_request("/api/chat", payload)
    if OLLAMA_BYPASS:
        _emit_ollama_debug(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, output_data={"bypass": True})
        response = _ollama_bypass_response(payload, request_id=request_id)
        _log_ollama_response("/api/chat", response)
        return response
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            )
        except httpx.RequestError as exc:
            _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, error=str(exc), error_type="RequestError")
            raise OllamaAdapterError(f"Ollama chat failed: {exc}") from exc
        if resp.status_code != 200:
            _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, http_status=resp.status_code, error=resp.text)
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        data = resp.json()
        _emit_ollama_debug(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, output_data={"model": data.get("model"), "done": data.get("done")})
        _log_ollama_response("/api/chat", data)
        return data


async def stream(
    messages: List[Dict[str, str]],
    *,
    model: str = DEFAULT_CHAT_MODEL,
    options: Optional[Dict[str, Any]] = None,
    num_predict: Optional[int] = None,
    request_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """Stream chat completion tokens from Ollama."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": True,
    }
    merged_options = _build_options(options, num_predict)
    if merged_options:
        payload["options"] = merged_options
    _emit_ollama_debug(request_id, DebugStage.OLLAMA_REQUEST, StageStatus.RUNNING, input_data={"model": model, "message_count": len(messages)})
    _log_ollama_request("/api/chat", payload)
    if OLLAMA_BYPASS:
        _emit_ollama_debug(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, output_data={"bypass": True})
        response = _ollama_bypass_response(payload, request_id=request_id)
        _log_ollama_response("/api/chat", response)
        content = response.get("message", {}).get("content", "")
        for chunk in [content[i : i + 4] for i in range(0, len(content), 4)]:
            yield chunk
        return
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            ) as resp:
                if resp.status_code != 200:
                    text = await resp.aread()
                    _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, http_status=resp.status_code, error=text.decode())
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
            _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, error=str(exc), error_type="RequestError")
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
    num_predict: Optional[int] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a chat completion request with tool definitions."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": False,
        "tools": tools,
    }
    merged_options = _build_options(options, num_predict)
    if merged_options:
        payload["options"] = merged_options
    if format:
        payload["format"] = format
    _emit_ollama_debug(request_id, DebugStage.OLLAMA_REQUEST, StageStatus.RUNNING, input_data={"model": model, "message_count": len(messages), "tool_count": len(tools)})
    _log_ollama_request("/api/chat", payload)
    if OLLAMA_BYPASS:
        _emit_ollama_debug(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, output_data={"bypass": True})
        response = _ollama_bypass_response(payload, request_id=request_id)
        _log_ollama_response("/api/chat", response)
        return response
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            )
        except httpx.RequestError as exc:
            _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, error=str(exc), error_type="RequestError")
            raise OllamaAdapterError(f"Ollama chat failed: {exc}") from exc
        if resp.status_code != 200:
            _emit_ollama_debug(request_id, DebugStage.ERROR, StageStatus.ERROR, http_status=resp.status_code, error=resp.text)
            raise OllamaAdapterError(
                f"Ollama chat failed ({resp.status_code}): {resp.text}"
            )
        data = resp.json()
        _emit_ollama_debug(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, output_data={"model": data.get("model"), "done": data.get("done")})
        _log_ollama_response("/api/chat", data)
        return data
