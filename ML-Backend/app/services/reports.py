"""
Report generator for ML-Backend.

Builds a Markdown financial report from backend/ data, using the LLM only
to fill narrative sections.  The structure is fixed; data comes from the
parameterized tool functions.
"""
from __future__ import annotations

from typing import Any, Dict

from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.services.calculations import calculate_budget_variance, calculate_savings_rate, project_goal_timeline
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_transactions_tool,
)


async def build_report_sections(token: str, user_id: str) -> Dict[str, Any]:
    transactions = await get_transactions_tool(token, user_id, page_size=200)
    income = await get_income_tool(token, user_id)
    balance = await get_balance_tool(token, user_id)
    budgets = await get_budget_tool(token, user_id)
    goals = await get_goals_tool(token, user_id)

    tx_data = transactions.get("data", {})
    results = tx_data.get("results", [])
    total_income = sum(item.get("amount", 0) for item in results if item.get("type") == "income")
    total_expense = sum(item.get("amount", 0) for item in results if item.get("type") == "expense")
    savings_rate = calculate_savings_rate(total_income, total_expense)

    budget_items = budgets.get("data", [])
    budget_variance = None
    if budget_items:
        total_budget = sum(item.get("amount", 0) for item in budget_items)
        budget_variance = calculate_budget_variance(total_budget, total_expense)

    goal_progress = []
    for goal in goals.get("data", []):
        goal_progress.append({
            "name": goal.get("name"),
            "target": goal.get("target_amount"),
            "current": goal.get("current_amount"),
        })

    return {
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "savings_rate": savings_rate,
        },
        "budget_variance": budget_variance,
        "goal_progress": goal_progress,
        "balance": balance.get("data"),
    }


async def generate_report_narrative(sections: Dict[str, Any]) -> str:
    prompt = (
        "You are a financial report assistant. "
        "Generate a concise Markdown report from the structured data below. "
        "Keep it factual and actionable.\n\n"
        f"Data: {sections}"
    )
    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")


async def build_report(token: str, user_id: str) -> Dict[str, Any]:
    sections = await build_report_sections(token, user_id)
    narrative = await generate_report_narrative(sections)
    return {
        "sections": sections,
        "narrative": narrative,
    }


async def explain_chart_or_alert(data: Dict[str, Any]) -> str:
    prompt = (
        "You are a financial assistant. Explain the following structured chart/alert data "
        "in clear, actionable language. Reference the exact figures.\n\n"
        f"Data: {data}"
    )
    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")
