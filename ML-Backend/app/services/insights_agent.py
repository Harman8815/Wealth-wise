"""
Insights agent for ML-Backend.

Fetches AI-generated financial insights from the Django backend and
uses the LLM to present them in natural language.
"""
from __future__ import annotations

from typing import Any, Dict

from app.clients import get_insights
from app.ollama import DEFAULT_CHAT_MODEL, generate


async def answer_insights_question(token: str, user_id: str, question: str) -> str:
    try:
        insights_data = await get_insights(token)
    except Exception:
        insights_data = {}

    prompt = (
        "You are a financial insights assistant. "
        "Using the insights data below, answer the user's question clearly and concisely. "
        "Reference specific figures and trends. "
        "If the data is empty or unavailable, say so honestly.\n\n"
        f"Insights Data: {insights_data}\n"
        f"Question: {question}"
    )
    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")
