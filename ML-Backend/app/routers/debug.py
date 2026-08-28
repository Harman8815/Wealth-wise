"""
Debug router for ML-Backend.

Provides endpoints for retrieving debug traces and events.
In production, this should be protected or disabled.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.debug_events import DebugEvent, DebugStage, StageStatus
from app.deps import get_user_id

router = APIRouter(prefix="/debug", tags=["debug"])


class InMemoryDebugStore:
    def __init__(self) -> None:
        self.traces: Dict[str, List[DebugEvent]] = {}
        self.user_messages: Dict[str, str] = {}

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


debug_store = InMemoryDebugStore()


def get_debug_store() -> InMemoryDebugStore:
    return debug_store


@router.get("/traces/{request_id}")
async def get_trace(request_id: str, request: Request, user_id: str = Depends(get_user_id)):
    store = get_debug_store()
    trace = store.get_trace(request_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found.")
    return trace


@router.get("/traces")
async def list_traces(request: Request, user_id: str = Depends(get_user_id)):
    store = get_debug_store()
    traces = []
    for request_id, events in store.traces.items():
        traces.append({
            "request_id": request_id,
            "user_message": store.user_messages.get(request_id, ""),
            "event_count": len(events),
            "last_status": events[-1].status if events else "unknown",
        })
    return {"traces": traces}


@router.post("/events")
async def receive_event(request: Request, user_id: str = Depends(get_user_id)):
    body = await request.json()
    store = get_debug_store()
    store.append_event(
        DebugEvent(
            request_id=body.get("request_id", ""),
            stage=body.get("stage", "error"),
            status=body.get("status", "success"),
            service=body.get("service"),
            route=body.get("route"),
            method=body.get("method"),
            http_status=body.get("http_status"),
            duration_ms=body.get("duration_ms"),
            input_data=body.get("input"),
            output_data=body.get("output"),
            error=body.get("error"),
            error_type=body.get("error_type"),
        )
    )
    return {"status": "ok"}


@router.delete("/traces")
async def clear_traces(request: Request, user_id: str = Depends(get_user_id)):
    store = get_debug_store()
    store.clear()
    return {"status": "cleared"}
