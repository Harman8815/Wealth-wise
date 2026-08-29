"""
Report generator for ML-Backend.

Builds a Markdown financial report from backend/ data, using the LLM only
to fill narrative sections.  The structure is fixed; data comes from the
parameterized tool functions.
"""
from __future__ import annotations

from typing import Any, Dict

from app.ollama import DEFAULT_CHAT_MODEL, generate, OllamaAdapterError
from app.services.calculations import calculate_budget_variance, calculate_savings_rate, project_goal_timeline
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_transactions_tool,
)
from app.logging_utils import log_agent
from app.services.validation import validate_transactions_context, validate_budget_context, validate_goals_context
from app.services.fallbacks import get_fallback
from app.services.ollama_config import get_options


async def build_report_sections(token: str, user_id: str) -> Dict[str, Any]:
    transactions = await get_transactions_tool(token, user_id, page=1, page_size=200)
    income = await get_income_tool(token, user_id)
    balance = await get_balance_tool(token, user_id)
    budgets = await get_budget_tool(token, user_id)
    goals = await get_goals_tool(token, user_id)

    tx_data = transactions.get("data", {})
    results = tx_data.get("results", [])
    total_income = sum(item.get("amount", 0) for item in results if item.get("type") == "income")
    total_expense = sum(item.get("amount", 0) for item in results if item.get("type") == "expense")
    savings_rate = calculate_savings_rate(total_income, total_expense)

    budget_items = budgets.get("data", {}).get("results", [])
    budget_variance = None
    if budget_items:
        total_budget = sum(item.get("amount", 0) for item in budget_items)
        budget_variance = calculate_budget_variance(total_budget, total_expense)

    goal_progress = []
    for goal in goals.get("data", {}).get("results", []):
        goal_progress.append({
            "name": goal.get("name"),
            "target": goal.get("target_amount"),
            "current": goal.get("current_amount"),
        })

    sections = {
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "savings_rate": savings_rate,
        },
        "budget_variance": budget_variance,
        "goal_progress": goal_progress,
        "balance": balance.get("data"),
    }
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="report",
        event="report_sections_built",
        output_data=sections,
    )
    return sections


async def generate_report_narrative(sections: Dict[str, Any]) -> str:
    prompt = (
        "You are a financial report assistant. "
        "Generate a concise Markdown report from the structured data below. "
        "Keep it factual and actionable.\n\n"
        f"Data: {sections}"
    )
    try:
        result = await generate(
            [{"role": "system", "content": prompt}],
            model=DEFAULT_CHAT_MODEL,
            stream=False,
            options=get_options("report"),
            num_predict=256,
        )
        narrative = result.get("message", {}).get("content", "")
    except OllamaAdapterError as exc:
        narrative = f"Report data is available, but narrative generation failed: {exc}"
    log_agent(
        request_id="",
        user_id=None,
        conversation_id=None,
        agent="report",
        event="report_narrative_generated",
        output_data={"narrative": narrative},
    )
    return narrative


async def build_report(token: str, user_id: str) -> Dict[str, Any]:
    try:
        transactions = await get_transactions_tool(token, user_id, page=1, page_size=200)
        income = await get_income_tool(token, user_id)
        balance = await get_balance_tool(token, user_id)
        budgets = await get_budget_tool(token, user_id)
        goals = await get_goals_tool(token, user_id)

        tx_data = transactions.get("data", {})
        is_valid, error_key = validate_transactions_context(tx_data)
        if not is_valid:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="report",
                event="report_validation_fallback",
                input_data={"error_key": error_key},
            )
            return {
                "sections": {},
                "narrative": get_fallback(error_key),
            }

        budget_data = budgets.get("data", {})
        is_valid_budget, error_key_budget = validate_budget_context(budget_data)
        if not is_valid_budget:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="report",
                event="report_validation_fallback",
                input_data={"error_key": error_key_budget},
            )
            return {
                "sections": {},
                "narrative": get_fallback(error_key_budget),
            }

        goals_data = goals.get("data", {})
        is_valid_goals, error_key_goals = validate_goals_context(goals_data)
        if not is_valid_goals:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="report",
                event="report_validation_fallback",
                input_data={"error_key": error_key_goals},
            )
            return {
                "sections": {},
                "narrative": get_fallback(error_key_goals),
            }

        sections = await build_report_sections(token, user_id)
        narrative = await generate_report_narrative(sections)
        return {
            "sections": sections,
            "narrative": narrative,
        }
    except Exception as exc:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="report",
            event="report_generation_error",
            error=str(exc),
        )
        return {
            "sections": {},
            "narrative": f"I encountered an error generating your report: {str(exc)}",
        }


async def explain_chart_or_alert(data: Dict[str, Any]) -> str:
    prompt = (
        "You are a financial assistant. Explain the following structured chart/alert data "
        "in clear, actionable language. Reference the exact figures.\n\n"
        f"Data: {data}"
    )
    try:
        result = await generate(
            [{"role": "system", "content": prompt}],
            model=DEFAULT_CHAT_MODEL,
            stream=False,
            num_predict=150,
        )
        explanation = result.get("message", {}).get("content", "")
    except OllamaAdapterError as exc:
        explanation = f"Chart/alert explanation is temporarily unavailable: {exc}"
    log_agent(
        request_id="",
        user_id=None,
        conversation_id=None,
        agent="chart_alert",
        event="chart_or_alert_explained",
        input_data=data,
        output_data={"explanation": explanation},
    )
    return explanation
