"""
Conversation request/response schemas for ML-Backend.
"""
from __future__ import annotations

from pydantic import BaseModel

from app.models import ConversationStatus


class ConversationOut(BaseModel):
    id: str
    title: str | None
    status: ConversationStatus
    message_count: int
    created_at: str
    updated_at: str


class ConversationListResponse(BaseModel):
    results: list[ConversationOut]
    count: int


class ConversationUpdateIn(BaseModel):
    title: str | None = None
    status: ConversationStatus | None = None
