"""
Chat router — Phase 1 endpoints with persistence.

Phase 2 adds conversation/message persistence.
Phase 3 adds context windowing and summarization.
"""
from __future__ import annotations

import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.context import ContextBudget, get_context_budget
from app.deps import get_user_id
from app.ollama import DEFAULT_CHAT_MODEL, OllamaAdapterError, stream
from app.prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.ollama import generate
from app.services.context import build_context
from app.services.conversations import add_message, create_conversation, generate_title, get_conversation
from app.services.summarization import maybe_summarize

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


def _maybe_generate_title(user_id: str, conversation_id: str, user_message: str) -> None:
    from app.services.conversations import get_conversation
    conv = get_conversation(user_id, conversation_id)
    if conv and not conv.title and conv.message_count == 1:
        title = generate_title(user_message)
        from app.services.conversations import update_conversation
        update_conversation(conversation_id, title=title)


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

    context_messages = await build_context(
        user_id=user_id,
        conversation_id=conversation_id,
        question=body.message,
        budget=get_context_budget(),
    )
    try:
        result = await generate(context_messages, model=body.model or DEFAULT_CHAT_MODEL)
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
        _maybe_generate_title(user_id, conversation_id, body.message)
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

    context_messages = await build_context(
        user_id=user_id,
        conversation_id=conversation_id,
        question=body.message,
        budget=get_context_budget(),
    )
    return StreamingResponse(
        _ollama_stream_to_sse(context_messages, model=body.model or DEFAULT_CHAT_MODEL, user_id=user_id, conversation_id=conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
