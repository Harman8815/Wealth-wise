"""
Debug event schema and in-memory store for ML-Backend.

Defines the structure for structured debug events emitted during
AI chat pipeline execution, plus the shared event store used by
both the API routers and the Ollama adapter.
"""
from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List, Optional

from enum import Enum


class DebugStage(str, Enum):
    USER_REQUEST = "user_request"
    INTENT_DETECTION = "intent_detection"
    AGENT_SELECTION = "agent_selection"
    BACKEND_REQUEST = "backend_request"
    DATA_RETRIEVAL = "data_retrieval"
    DATA_PROCESSING = "data_processing"
    OLLAMA_REQUEST = "ollama_request"
    OLLAMA_RESPONSE = "ollama_response"
    RESPONSE_PARSING = "response_parsing"
    FRONTEND_RENDER = "frontend_render"
    ERROR = "error"


class StageStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"


class DebugEvent:
    def __init__(
        self,
        request_id: str,
        stage: DebugStage,
        status: StageStatus,
        service: Optional[str] = None,
        route: Optional[str] = None,
        method: Optional[str] = None,
        http_status: Optional[int] = None,
        duration_ms: Optional[float] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        error_type: Optional[str] = None,
    ):
        self.request_id = request_id
        self.stage = stage.value if isinstance(stage, DebugStage) else stage
        self.status = status.value if isinstance(status, StageStatus) else status
        self.service = service
        self.route = route
        self.method = method
        self.http_status = http_status
        self.duration_ms = duration_ms
        self.input_data = input_data
        self.output_data = output_data
        self.error = error
        self.error_type = error_type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "request_id": self.request_id,
            "stage": self.stage,
            "status": self.status,
            "service": self.service,
            "route": self.route,
            "method": self.method,
            "http_status": self.http_status,
            "duration_ms": self.duration_ms,
            "input": self.input_data,
            "output": self.output_data,
            "error": self.error,
            "error_type": self.error_type,
            "timestamp": time.time(),
        }


class InMemoryDebugStore:
    def __init__(self) -> None:
        self.traces: Dict[str, List[DebugEvent]] = {}
        self.user_messages: Dict[str, str] = {}
        self._subscribers: List[asyncio.Queue] = []

    def start_trace(self, request_id: str, user_message: str) -> None:
        self.traces.setdefault(request_id, [])
        self.user_messages[request_id] = user_message
        self.traces[request_id].append(
            DebugEvent(
                request_id=request_id,
                stage=DebugStage.USER_REQUEST,
                status=StageStatus.SUCCESS,
                service="backend",
                input_data={"message": user_message},
            )
        )

    def append_event(self, event: DebugEvent) -> None:
        self.traces.setdefault(event.request_id, []).append(event)
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass

    def get_trace(self, request_id: str) -> Optional[Dict[str, Any]]:
        events = self.traces.get(request_id)
        if not events:
            return None
        return {
            "request_id": request_id,
            "user_message": self.user_messages.get(request_id, ""),
            "events": [e.to_dict() for e in events],
        }

    def clear(self) -> None:
        self.traces.clear()
        self.user_messages.clear()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)


debug_store = InMemoryDebugStore()


def get_debug_store() -> InMemoryDebugStore:
    return debug_store
