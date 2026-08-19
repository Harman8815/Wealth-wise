"""
Conversation CRUD endpoints for ML-Backend.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_user_id
from app.models import Conversation, MessageRole
from app.schemas.conversations import ConversationListResponse, ConversationOut, ConversationUpdateIn
from app.services.conversations import (
    add_message,
    create_conversation,
    delete_conversation,
    get_conversation,
    get_messages,
    list_conversations,
    update_conversation,
)

router = APIRouter(prefix="/chats", tags=["chats"])


def _serialize(conv: Conversation) -> ConversationOut:
    return ConversationOut(
        id=str(conv.id),
        title=conv.title,
        status=conv.status,
        message_count=conv.message_count or 0,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
    )


@router.get("", response_model=ConversationListResponse)
async def list_chats(user_id: str = Depends(get_user_id)):
    results = list_conversations(user_id)
    return ConversationListResponse(results=[_serialize(c) for c in results], count=len(results))


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_chat(conversation_id: str, user_id: str = Depends(get_user_id)):
    conv = get_conversation(user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return _serialize(conv)


@router.patch("/{conversation_id}", response_model=ConversationOut)
async def update_chat(conversation_id: str, body: ConversationUpdateIn, user_id: str = Depends(get_user_id)):
    conv = get_conversation(user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    updated = update_conversation(
        conversation_id,
        title=body.title,
        status=body.status,
    )
    return _serialize(updated)


@router.delete("/{conversation_id}")
async def delete_chat(conversation_id: str, user_id: str = Depends(get_user_id)):
    conv = get_conversation(user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    delete_conversation(conversation_id)
    return {"status": "deleted"}
