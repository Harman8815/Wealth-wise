"""
Debug event schema for ML-Backend.

Defines the structure for structured debug events emitted during
AI chat pipeline execution.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, Optional


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
            "timestamp": __import__("time").time(),
        }
