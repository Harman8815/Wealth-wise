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
from app.services.validation import validate_insights_context
from app.services.fallbacks import get_fallback
from app.services.ollama_config import get_options


async def answer_insights_question(token: str, user_id: str, question: str) -> str:
    try:
        insights_data = await get_insights(token)
    except Exception:
        insights_data = {}

    is_valid, error_key = validate_insights_context(insights_data)
    if not is_valid:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="insights",
            event="insights_validation_fallback",
            input_data={"question": question, "error_key": error_key},
        )
        return get_fallback(error_key)

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
            options=get_options("insights"),
        )
        answer = result.get("message", {}).get("content", "")
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="insights",
            event="insights_question_answered",
            input_data={"question": question, "insights_count": len(insights_data.get("results", [])) if isinstance(insights_data, dict) else 0},
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
            input_data={"question": question, "insights_count": len(insights_data.get("results", [])) if isinstance(insights_data, dict) else 0},
            error=str(exc),
        )
        return get_fallback("ollama_unavailable")
