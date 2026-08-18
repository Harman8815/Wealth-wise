"""
Chat request/response schemas for ML-Backend.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    model: str | None = None


class ChatResponse(BaseModel):
    reply: str
    model: str
