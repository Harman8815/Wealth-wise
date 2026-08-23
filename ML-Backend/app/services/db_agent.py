"""
Database context agent for ML-Backend.

Answers questions about the database schema and structure.
"""
from __future__ import annotations

from typing import Any, Dict

from app.services.db_context import get_database_context, refresh_database_context
from app.ollama import DEFAULT_CHAT_MODEL, generate


async def answer_database_question(question: str) -> str:
    """Answer a question about the database schema."""
    context = get_database_context()

    prompt = (
        "You are a database schema assistant. "
        "Using the database context below, answer the user's question clearly and concisely. "
        "Only use the provided schema information. "
        "Do not expose sensitive data like passwords, tokens, or secret keys.\n\n"
        f"Database Context: {context}\n"
        f"Question: {question}"
    )

    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")
