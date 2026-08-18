"""
Chat router — Phase 1 non-streaming endpoint.

No database yet; Phase 2 adds conversation/message persistence.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_user_id
from app.ollama import generate, OllamaAdapterError
from app.prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.ollama import DEFAULT_CHAT_MODEL

router = APIRouter(prefix="/chat", tags=["chat"])


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
