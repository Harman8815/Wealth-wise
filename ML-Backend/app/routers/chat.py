"""
Chat router — Phase 1 endpoints (no persistence yet).

No database yet; Phase 2 adds conversation/message persistence.
"""
from __future__ import annotations

import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.deps import get_user_id
from app.ollama import DEFAULT_CHAT_MODEL, OllamaAdapterError, stream
from app.prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.ollama import generate

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse_pack(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


async def _ollama_stream_to_sse(
    messages: list[dict],
    *,
    model: str,
) -> AsyncGenerator[str, None]:
    try:
        async for token in stream(messages, model=model):
            payload = json.dumps({"token": token})
            yield _sse_pack("token", payload)
    except OllamaAdapterError as exc:
        payload = json.dumps({"error": str(exc)})
        yield _sse_pack("error", payload)
        return
    yield _sse_pack("done", "{}")


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user_id: str = Depends(get_user_id),
) -> ChatResponse:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.message},
    ]
    try:
        result = await generate(messages, model=body.model or DEFAULT_CHAT_MODEL)
        reply = result.get("message", {}).get("content", "")
        model = result.get("model", body.model or DEFAULT_CHAT_MODEL)
        return ChatResponse(reply=reply, model=model)
    except OllamaAdapterError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user_id: str = Depends(get_user_id),
) -> StreamingResponse:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.message},
    ]
    return StreamingResponse(
        _ollama_stream_to_sse(messages, model=body.model or DEFAULT_CHAT_MODEL),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
