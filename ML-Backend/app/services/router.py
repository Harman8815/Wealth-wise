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
from app.debug_events import DebugEvent, DebugStage, StageStatus, get_debug_store


def _emit_debug_event(
    request_id: str,
    stage: DebugStage,
    status: StageStatus,
    service: str = "backend",
    route: Optional[str] = None,
    method: Optional[str] = None,
    http_status: Optional[int] = None,
    duration_ms: Optional[float] = None,
    input_data: Optional[Dict[str, Any]] = None,
    output_data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    error_type: Optional[str] = None,
) -> None:
    try:
        store = get_debug_store()
        store.append_event(
            DebugEvent(
                request_id=request_id,
                stage=stage,
                status=status,
                service=service,
                route=route,
                method=method,
                http_status=http_status,
                duration_ms=duration_ms,
                input_data=input_data,
                output_data=output_data,
                error=error,
                error_type=error_type,
            )
        )
    except Exception:
        pass


async def route_intent(
    intent: Intent,
    token: str,
    user_id: str,
    message: str,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    log_agent(
        request_id=request_id or "",
        user_id=user_id,
        conversation_id=None,
        agent="router",
        event="intent_routed",
        input_data={"intent": intent.value, "message": message},
    )
    if request_id:
        _emit_debug_event(request_id, DebugStage.AGENT_SELECTION, StageStatus.SUCCESS, service="backend", output_data={"intent": intent.value, "message": message})
    if intent == Intent.REPORT:
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/reports/generate")
        report = await build_report(token, user_id)
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.SUCCESS, service="backend", output_data={"sections": list(report.get("sections", {}).keys())})
        narrative = process_response(report.get("narrative") or "Report generated successfully.")
        if not narrative:
            narrative = "Report generated successfully. I couldn't create a narrative summary, but the data is ready."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"narrative_length": len(narrative)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/reports/explain")
        explanation = await explain_chart_or_alert({"message": message, "context": "chart or alert explanation request"})
        explanation = process_response(explanation or "No explanation available.")
        if not explanation:
            explanation = "I couldn't generate an explanation right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"explanation_length": len(explanation)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/chat/goal-planning")
        answer = await answer_goal_question(token, user_id, message)
        answer = process_response(answer)
        if not answer:
            answer = "I couldn't generate a goal plan right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"answer_length": len(answer)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/chat/budget-planning")
        answer = await answer_budget_question(token, user_id, message)
        answer = process_response(answer)
        if not answer:
            answer = "I couldn't generate a budget analysis right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"answer_length": len(answer)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/chat/search")
        result = await search_transactions_nl(token, user_id, message)
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.SUCCESS, service="backend", output_data={"result_count": len(result.get("data", {}).get("results", [])), "filters": result.get("filters")})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/api/insights")
        answer = await answer_insights_question(token, user_id, message)
        answer = process_response(answer)
        if not answer:
            answer = "I couldn't generate insights right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"answer_length": len(answer)})
        log_agent(
            request_id=request_id or "",
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
        if not answer:
            answer = "I couldn't answer that database question right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"answer_length": len(answer)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/api/alerts")
        answer = await answer_alerts_question(token, user_id, message)
        answer = process_response(answer)
        if not answer:
            answer = "I couldn't analyze your alerts right now. Please try again."
        if request_id:
            _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"answer_length": len(answer)})
        log_agent(
            request_id=request_id or "",
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
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.RUNNING, service="backend", route="/chat/search")
        result = await query_transactions_dynamic(token, user_id, message)
        if request_id:
            _emit_debug_event(request_id, DebugStage.DATA_RETRIEVAL, StageStatus.SUCCESS, service="backend", output_data={"filters": result.get("filters"), "result_count": len(result.get("data", {}).get("results", [])) if isinstance(result.get("data"), dict) else 0})
        log_agent(
            request_id=request_id or "",
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
        "response": "I'm not sure how to help with that. Could you rephrase?",
        "fallback": True,
    }
