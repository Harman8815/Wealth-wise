"""
Agent router for ML-Backend.

Routes classified intents to the matching Phase 5/6 handler.
"""
from __future__ import annotations

from typing import Any, Dict

from app.services.assistants import answer_budget_question, answer_goal_question
from app.services.intent import Intent
from app.services.reports import build_report, explain_chart_or_alert
from app.services.tools import search_transactions_nl


async def route_intent(
    intent: Intent,
    token: str,
    user_id: str,
    message: str,
) -> Dict[str, Any]:
    if intent == Intent.REPORT:
        report = await build_report(token, user_id)
        return {
            "intent": intent.value,
            "response": report.get("narrative", "Report generated."),
            "data": report.get("sections"),
        }

    if intent == Intent.CHART_ALERT:
        explanation = await explain_chart_or_alert({"message": message, "context": "chart or alert explanation request"})
        return {
            "intent": intent.value,
            "response": explanation or "No explanation available.",
        }

    if intent == Intent.GOAL:
        answer = await answer_goal_question(token, user_id, message)
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.BUDGET:
        answer = await answer_budget_question(token, user_id, message)
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.TRANSACTION_SEARCH:
        result = await search_transactions_nl(token, user_id, message)
        return {
            "intent": intent.value,
            "response": f"Found {len(result.get('data', {}).get('results', []))} transactions matching your query.",
            "data": result.get("data"),
            "filters": result.get("filters"),
        }

    # general_chat fallback
    return {
        "intent": Intent.GENERAL_CHAT.value,
        "response": None,
        "fallback": True,
    }
