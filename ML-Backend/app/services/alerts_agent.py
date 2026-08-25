"""
Alerts agent for ML-Backend.

Retrieves the user's alerts from the Django backend and uses the LLM to
present them in natural language.  Relevant alert data is retrieved and
passed to Ollama as structured context; the full database is never sent.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from app.clients import get_alerts
from app.ollama import DEFAULT_CHAT_MODEL, generate, OllamaAdapterError
from app.logging_utils import log_agent


async def answer_alerts_question(token: str, user_id: str, question: str) -> str:
    try:
        alerts_data = await get_alerts(token)
    except Exception:
        alerts_data = {}

    try:
        prompt = (
            "You are a financial alerts assistant. "
            "Using the alerts data below, answer the user's question clearly and concisely. "
            "Reference specific alert titles, types, categories, and timestamps. "
            "If the data is empty or unavailable, say so honestly.\n\n"
            f"Alerts Data: {alerts_data}\n"
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
            agent="alerts",
            event="alerts_question_answered",
            input_data={"question": question, "alerts_count": len(alerts_data.get("results", [])) if isinstance(alerts_data, dict) else 0},
            output_data={"answer": answer},
        )
        return answer
    except OllamaAdapterError as exc:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="alerts",
            event="alerts_ollama_fallback",
            input_data={"question": question, "alerts_count": len(alerts_data.get("results", [])) if isinstance(alerts_data, dict) else 0},
            error=str(exc),
        )
        if alerts_data:
            return f"I found {len(alerts_data.get('results', []))} alerts for you, but I'm having trouble generating a summary right now. Please try again later."
        return "I'm unable to check alerts right now. Please try again later."
