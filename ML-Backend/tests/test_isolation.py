"""
Data isolation tests for ML-Backend conversations/messages.

Proves that user A cannot read user B's conversation by guessing an ID,
and that every query is scoped by the verified ``user_id`` from the JWT.
"""
from __future__ import annotations

import os
import sys

os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal, init_db
from app.models import Conversation, Message
from app.services.conversations import (
    create_conversation,
    get_conversation,
    list_conversations,
)


def _setup_db():
    init_db()
    db = SessionLocal()
    try:
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.commit()
    finally:
        db.close()


def test_user_cannot_read_others_conversation():
    _setup_db()
    user_a = "user-a"
    user_b = "user-b"

    conv = create_conversation(user_id=user_a, title="Secret plans")
    conv_id = str(conv.id)

    own = get_conversation(user_a, conv_id)
    assert own is not None

    other = get_conversation(user_b, conv_id)
    assert other is None


def test_user_sees_only_own_conversations():
    _setup_db()
    user_a = "user-a"
    user_b = "user-b"

    create_conversation(user_id=user_a, title="A-1")
    create_conversation(user_id=user_a, title="A-2")
    create_conversation(user_id=user_b, title="B-1")

    results = list_conversations(user_a)
    titles = [c.title for c in results]
    assert "A-1" in titles
    assert "A-2" in titles
    assert "B-1" not in titles
