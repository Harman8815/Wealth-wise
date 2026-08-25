"""
Insights agent for ML-Backend.

Fetches AI-generated financial insights from the Django backend and
uses the LLM to present them in natural language.
"""
from __future__ import annotations

from typing import Any, Dict

from app.clients import get_insights
from app.ollama import DEFAULT_CHAT_MODEL, generate, OllamaAdapterError
from app.logging_utils import log_agent


async def answer_insights_question(token: str, user_id: str, question: str) -> str:
    try:
        insights_data = await get_insights(token)
    except Exception:
        insights_data = {}

    try:
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
        answer = result.get("message", {}).get("content", "")
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="insights",
            event="insights_question_answered",
            input_data={"question": question, "insights_count": len(insights_data) if isinstance(insights_data, list) else 0},
            output_data={"answer": answer},
        )
        return answer
    except OllamaAdapterError as exc:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="insights",
            event="insights_ollama_fallback",
            input_data={"question": question, "insights_count": len(insights_data) if isinstance(insights_data, list) else 0},
            error=str(exc),
        )
        if insights_data:
            return f"I found {len(insights_data)} insights for you, but I'm having trouble generating a summary right now. Please try again later."
        return "I'm unable to generate insights right now. Please try again later."
