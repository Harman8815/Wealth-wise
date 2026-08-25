"""
Agent router for ML-Backend.

Routes classified intents to the matching Phase 5/6 handler.
"""
from __future__ import annotations

from typing import Any, Dict

from app.services.assistants import answer_budget_question, answer_goal_question
from app.services.alerts_agent import answer_alerts_question
from app.services.db_agent import answer_database_question
from app.services.insights_agent import answer_insights_question
from app.services.intent import Intent
from app.services.reports import build_report, explain_chart_or_alert
from app.services.tools import search_transactions_nl, query_transactions_dynamic
from app.services.pipeline import process_response
from app.logging_utils import log_agent


async def route_intent(
    intent: Intent,
    token: str,
    user_id: str,
    message: str,
) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="router",
        event="intent_routed",
        input_data={"intent": intent.value, "message": message},
    )
    if intent == Intent.REPORT:
        report = await build_report(token, user_id)
        narrative = process_response(report.get("narrative", "Report generated."))
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="report",
            event="report_generated",
            output_data={"narrative": narrative, "sections": report.get("sections")},
        )
        return {
            "intent": intent.value,
            "response": narrative,
            "data": report.get("sections"),
        }

    if intent == Intent.CHART_ALERT:
        explanation = await explain_chart_or_alert({"message": message, "context": "chart or alert explanation request"})
        explanation = process_response(explanation or "No explanation available.")
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="chart_alert",
            event="chart_alert_explained",
            output_data={"explanation": explanation},
        )
        return {
            "intent": intent.value,
            "response": explanation,
        }

    if intent == Intent.GOAL:
        answer = await answer_goal_question(token, user_id, message)
        answer = process_response(answer)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="goal",
            event="goal_question_answered",
            output_data={"answer": answer},
        )
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.BUDGET:
        answer = await answer_budget_question(token, user_id, message)
        answer = process_response(answer)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="budget",
            event="budget_question_answered",
            output_data={"answer": answer},
        )
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.TRANSACTION_SEARCH:
        result = await search_transactions_nl(token, user_id, message)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="transaction_search",
            event="transaction_search_completed",
            output_data={"result_count": len(result.get("data", {}).get("results", [])), "filters": result.get("filters")},
        )
        return {
            "intent": intent.value,
            "response": f"Found {len(result.get('data', {}).get('results', []))} transactions matching your query.",
            "data": result.get("data"),
            "filters": result.get("filters"),
        }

    if intent == Intent.INSIGHTS:
        answer = await answer_insights_question(token, user_id, message)
        answer = process_response(answer)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="insights",
            event="insights_question_answered",
            output_data={"answer": answer},
        )
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.DB_CONTEXT:
        answer = await answer_database_question(message)
        answer = process_response(answer)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="db_context",
            event="database_question_answered",
            output_data={"answer": answer},
        )
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.ALERTS:
        answer = await answer_alerts_question(token, user_id, message)
        answer = process_response(answer)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="alerts",
            event="alerts_question_answered",
            output_data={"answer": answer},
        )
        return {
            "intent": intent.value,
            "response": answer,
        }

    if intent == Intent.TRANSACTION_QUERY:
        result = await query_transactions_dynamic(token, user_id, message)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="transaction_query",
            event="transaction_query_completed",
            output_data={"filters": result.get("filters"), "result_count": len(result.get("data", {}).get("results", [])) if isinstance(result.get("data"), dict) else 0},
        )
        return {
            "intent": intent.value,
            "response": f"Found {len(result.get('data', {}).get('results', [])) if isinstance(result.get('data'), dict) else 0} transactions matching your query.",
            "data": result.get("data"),
            "filters": result.get("filters"),
        }

    # general_chat fallback
    return {
        "intent": Intent.GENERAL_CHAT.value,
        "response": None,
        "fallback": True,
    }
