"""
Structured logging utilities for ML-Backend.

Provides request-scoped logging with sensitive data scrubbing.
"""
from __future__ import annotations

import logging
import re
import time
import uuid
from typing import Any, Dict, Optional

logger = logging.getLogger("ml_backend")

_SENSITIVE_PATTERNS = [
    re.compile(r"\b\d{4,}\b"),  # long numbers (financial figures / IDs)
    re.compile(r"(?i)password|secret|token|key|authorization", re.IGNORECASE),
]


def _scrub(value: str) -> str:
    for pattern in _SENSITIVE_PATTERNS:
        value = pattern.sub("[REDACTED]", value)
    return value


def _scrub_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    scrubbed = {}
    for key, value in data.items():
        if isinstance(value, dict):
            scrubbed[key] = _scrub_dict(value)
        elif isinstance(value, list):
            scrubbed[key] = [_scrub_dict(v) if isinstance(v, dict) else _scrub(str(v)) for v in value]
        else:
            scrubbed[key] = _scrub(str(value))
    return scrubbed


def get_request_id(request: Optional[Any] = None) -> str:
    if request is not None:
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            return request_id
    return str(uuid.uuid4())


def log_request(
    request_id: str,
    user_id: Optional[str],
    path: str,
    method: str,
    status_code: int,
    latency_ms: float,
    **extra: Any,
) -> None:
    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "path": path,
        "method": method,
        "status_code": status_code,
        "latency_ms": round(latency_ms, 2),
    }
    payload.update(_scrub_dict(extra))
    logger.info("request", extra=payload)


def log_tool_call(
    request_id: str,
    user_id: Optional[str],
    conversation_id: Optional[str],
    tool_name: str,
    latency_ms: float,
    **extra: Any,
) -> None:
    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "tool": tool_name,
        "latency_ms": round(latency_ms, 2),
    }
    payload.update(_scrub_dict(extra))
    logger.info("tool_call", extra=payload)


def log_llm_call(
    request_id: str,
    user_id: Optional[str],
    conversation_id: Optional[str],
    model: str,
    latency_ms: float,
    **extra: Any,
) -> None:
    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "model": model,
        "latency_ms": round(latency_ms, 2),
    }
    payload.update(_scrub_dict(extra))
    logger.info("llm_call", extra=payload)


def log_chat(
    request_id: str,
    user_id: Optional[str],
    conversation_id: Optional[str],
    event: str,
    message: Optional[str] = None,
    agent: Optional[str] = None,
    intent: Optional[str] = None,
    response: Optional[str] = None,
    latency_ms: Optional[float] = None,
    **extra: Any,
) -> None:
    payload: Dict[str, Any] = {
        "request_id": request_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "event": event,
    }
    if message is not None:
        payload["message"] = _scrub(message)
    if agent is not None:
        payload["agent"] = agent
    if intent is not None:
        payload["intent"] = intent
    if response is not None:
        payload["response"] = _scrub(response)
    if latency_ms is not None:
        payload["latency_ms"] = round(latency_ms, 2)
    payload.update(_scrub_dict(extra))
    logger.info("chat", extra=payload)


def log_agent(
    request_id: str,
    user_id: Optional[str],
    conversation_id: Optional[str],
    agent: str,
    event: str,
    input_data: Optional[Any] = None,
    output_data: Optional[Any] = None,
    latency_ms: Optional[float] = None,
    **extra: Any,
) -> None:
    payload: Dict[str, Any] = {
        "request_id": request_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "agent": agent,
        "event": event,
    }
    if input_data is not None:
        payload["input"] = _scrub_dict(input_data) if isinstance(input_data, dict) else _scrub(str(input_data))
    if output_data is not None:
        payload["output"] = _scrub_dict(output_data) if isinstance(output_data, dict) else _scrub(str(output_data))
    if latency_ms is not None:
        payload["latency_ms"] = round(latency_ms, 2)
    payload.update(_scrub_dict(extra))
    logger.info("agent", extra=payload)


def log_db(
    request_id: str,
    user_id: Optional[str],
    event: str,
    query: Optional[str] = None,
    result_count: Optional[int] = None,
    result_data: Optional[Any] = None,
    latency_ms: Optional[float] = None,
    **extra: Any,
) -> None:
    payload: Dict[str, Any] = {
        "request_id": request_id,
        "user_id": user_id,
        "event": event,
    }
    if query is not None:
        payload["query"] = _scrub(query)
    if result_count is not None:
        payload["result_count"] = result_count
    if result_data is not None:
        payload["result_data"] = _scrub_dict(result_data) if isinstance(result_data, dict) else _scrub(str(result_data))
    if latency_ms is not None:
        payload["latency_ms"] = round(latency_ms, 2)
    payload.update(_scrub_dict(extra))
    logger.info("db", extra=payload)


def log_validation(
    request_id: str,
    user_id: Optional[str],
    event: str,
    schema: Optional[str] = None,
    data: Optional[Any] = None,
    valid: bool = True,
    error: Optional[str] = None,
    **extra: Any,
) -> None:
    payload: Dict[str, Any] = {
        "request_id": request_id,
        "user_id": user_id,
        "event": event,
        "valid": valid,
    }
    if schema is not None:
        payload["schema"] = schema
    if data is not None:
        payload["data"] = _scrub_dict(data) if isinstance(data, dict) else _scrub(str(data))
    if error is not None:
        payload["error"] = _scrub(error)
        logger.error("validation", extra=payload)
    else:
        payload.update(_scrub_dict(extra))
        logger.info("validation", extra=payload)


def log_error(
    request_id: str,
    user_id: Optional[str],
    error: str,
    **extra: Any,
) -> None:
    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "error": _scrub(error),
    }
    payload.update(_scrub_dict(extra))
    logger.error("error", extra=payload)
