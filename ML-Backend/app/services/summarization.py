"""
Conversation summarization for ML-Backend.

When a conversation exceeds ``SUMMARIZE_THRESHOLD`` messages, older messages
are summarized via Ollama and stored on ``conversations.summary``.  The most
recent messages are kept intact so the next reply can still use them directly.
"""
from __future__ import annotations

from typing import List

from app.db import SessionLocal
from app.models import Message, MessageRole
from app.ollama import generate, DEFAULT_CHAT_MODEL
from app.prompt import SYSTEM_PROMPT
from app.services.conversations import get_conversation, update_conversation

SUMMARIZE_THRESHOLD = 20
KEEP_RECENT = 10


async def maybe_summarize(user_id: str, conversation_id: str) -> None:
    conv = get_conversation(user_id, conversation_id)
    if not conv or conv.summary:
        return
    if conv.message_count < SUMMARIZE_THRESHOLD:
        return

    db = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.user_id == user_id,
            )
            .order_by(Message.created_at.asc())
            .all()
        )
        if len(messages) < SUMMARIZE_THRESHOLD:
            return

        to_summarize = messages[:-KEEP_RECENT] if len(messages) > KEEP_RECENT else messages
        if not to_summarize:
            return

        transcript = "\n".join(
            f"{m.role.value}: {m.content}" for m in to_summarize if m.content
        )
        prompt = (
            "Summarize the following conversation in 2-3 sentences. "
            "Keep only durable facts the assistant should remember for future turns."
        )
        try:
            result = await generate(
                [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": transcript},
                ],
                model=DEFAULT_CHAT_MODEL,
                stream=False,
            )
            summary = result.get("message", {}).get("content", "").strip()
            if summary:
                update_conversation(conversation_id, summary=summary)
        except Exception:
            pass
    finally:
        db.close()
