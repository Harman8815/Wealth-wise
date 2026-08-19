"""
Tests for the Phase 3 context engine.
"""
from __future__ import annotations

import asyncio
import os
import sys

os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.context import ContextBudget, estimate_tokens, get_context_budget
from app.db import SessionLocal, init_db
from app.models import Conversation, Message, MessageRole
from app.services.context import build_context
from app.services.conversations import create_conversation


def _setup_db():
    init_db()
    db = SessionLocal()
    try:
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.commit()
    finally:
        db.close()


def test_context_budget_total():
    budget = ContextBudget()
    assert budget.total > 0


def test_estimate_tokens_empty():
    assert estimate_tokens("") == 0


def test_estimate_tokens_positive():
    tokens = estimate_tokens("Hello world")
    assert tokens > 0


def test_build_context_within_budget():
    _setup_db()
    conv = create_conversation(user_id="u1", title="Test")
    budget = ContextBudget(recent_messages=100)
    messages = [
        Message(conversation_id=str(conv.id), user_id="u1", role=MessageRole.user, content="Short"),
        Message(conversation_id=str(conv.id), user_id="u1", role=MessageRole.assistant, content="Also short"),
    ]
    result = asyncio.get_event_loop().run_until_complete(
        build_context(
            user_id="u1",
            conversation_id=str(conv.id),
            question="Next",
            budget=budget,
            messages=messages,
        )
    )
    assert any(m["role"] == "user" and m["content"] == "Next" for m in result)
