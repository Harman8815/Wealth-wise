"""
Context builder for ML-Backend chat.

Builds the message list sent to Ollama by combining:
- Fixed system prompt
- Conversation summary (if any)
- Recent messages within token budget
- Current user question

Message windowing keeps the total within ``ContextBudget.recent_messages``.
"""
from __future__ import annotations

from typing import List, Optional

from app.context import ContextBudget, estimate_tokens, get_context_budget
from app.models import Message, MessageRole
from app.prompt import SYSTEM_PROMPT
from app.services.conversations import get_conversation, get_messages


def _to_dict(message: Message) -> dict:
    return {"role": message.role.value, "content": message.content}


async def build_context(
    user_id: str,
    conversation_id: str,
    question: str,
    *,
    budget: Optional[ContextBudget] = None,
    messages: Optional[List[Message]] = None,
) -> List[dict]:
    budget = budget or get_context_budget()
    conv = get_conversation(user_id, conversation_id)
    if not conv:
        raise ValueError("Conversation not found.")

    context_messages: List[dict] = []
    system_prompt = SYSTEM_PROMPT
    if conv.summary:
        summary_text = conv.summary.strip()
        if estimate_tokens(summary_text) <= budget.summary:
            context_messages.append({"role": "system", "content": f"Conversation summary: {summary_text}"})

    context_messages.insert(0, {"role": "system", "content": system_prompt})

    if messages is None:
        messages = get_messages(user_id, conversation_id)
    recent_messages: List[dict] = []
    token_budget = budget.recent_messages
    for message in reversed(messages):
        msg_dict = _to_dict(message)
        msg_tokens = estimate_tokens(msg_dict["content"])
        if token_budget - msg_tokens < 0:
            break
        recent_messages.insert(0, msg_dict)
        token_budget -= msg_tokens

    context_messages.extend(recent_messages)
    context_messages.append({"role": "user", "content": question})
    return context_messages
