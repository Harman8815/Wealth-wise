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
