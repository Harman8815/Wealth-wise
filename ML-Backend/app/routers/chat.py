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
from app.services.conversations import add_message, create_conversation, get_conversation

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse_pack(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


async def _ollama_stream_to_sse(
    messages: list[dict],
    *,
    model: str,
    user_id: str,
    conversation_id: str,
) -> AsyncGenerator[str, None]:
    full_reply = ""
    try:
        async for token in stream(messages, model=model):
            full_reply += token
            payload = json.dumps({"token": token})
            yield _sse_pack("token", payload)
    except OllamaAdapterError as exc:
        payload = json.dumps({"error": str(exc)})
        yield _sse_pack("error", payload)
        return
    yield _sse_pack("done", json.dumps({"conversation_id": conversation_id}))
    add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=full_reply,
    )


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user_id: str = Depends(get_user_id),
) -> ChatResponse:
    conversation_id = body.conversation_id
    if conversation_id:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conv = create_conversation(user_id=user_id)
        conversation_id = str(conv.id)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.message},
    ]
    try:
        result = await generate(messages, model=body.model or DEFAULT_CHAT_MODEL)
        reply = result.get("message", {}).get("content", "")
        model = result.get("model", body.model or DEFAULT_CHAT_MODEL)
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=body.message,
        )
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=reply,
        )
        return ChatResponse(reply=reply, model=model, conversation_id=conversation_id)
    except OllamaAdapterError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user_id: str = Depends(get_user_id),
) -> StreamingResponse:
    conversation_id = body.conversation_id
    if conversation_id:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conv = create_conversation(user_id=user_id)
        conversation_id = str(conv.id)

    add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=body.message,
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.message},
    ]
    return StreamingResponse(
        _ollama_stream_to_sse(messages, model=body.model or DEFAULT_CHAT_MODEL, user_id=user_id, conversation_id=conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
