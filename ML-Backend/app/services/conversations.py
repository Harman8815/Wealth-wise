"""
Conversation and message service layer.

Every query is scoped by ``user_id`` from the verified JWT.  No endpoint
or caller should bypass these helpers and query the tables directly with
a client-supplied identifier.
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Conversation, Message, MessageRole


def _get_db() -> Session:
    return SessionLocal()


def create_conversation(user_id: str, title: Optional[str] = None) -> Conversation:
    db = _get_db()
    try:
        conv = Conversation(user_id=user_id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv
    finally:
        db.close()


def get_conversation(user_id: str, conversation_id: str) -> Optional[Conversation]:
    db = _get_db()
    try:
        return (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
            .first()
        )
    finally:
        db.close()


def list_conversations(user_id: str, *, limit: int = 50, offset: int = 0) -> List[Conversation]:
    db = _get_db()
    try:
        return (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
    finally:
        db.close()


def add_message(
    user_id: str,
    conversation_id: str,
    role: str,
    content: str,
    token_count: Optional[int] = None,
) -> Message:
    db = _get_db()
    try:
        msg = Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=MessageRole(role),
            content=content,
            token_count=token_count,
        )
        db.add(msg)
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.message_count = (conv.message_count or 0) + 1
        db.commit()
        db.refresh(msg)
        return msg
    finally:
        db.close()


def get_messages(user_id: str, conversation_id: str) -> List[Message]:
    db = _get_db()
    try:
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id, Message.user_id == user_id)
            .order_by(Message.created_at.asc())
            .all()
        )
    finally:
        db.close()
