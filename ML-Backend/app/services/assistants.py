"""
Goal and budget planning assistants for ML-Backend.

Each assistant combines calculation helpers with backend/ data to answer
user questions in a structured, data-driven way.
"""
from __future__ import annotations

from typing import Any, Dict, List

from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.services.calculations import calculate_budget_variance, calculate_savings_rate, project_goal_timeline
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_profile_tool,
    get_transactions_tool,
)


async def answer_goal_question(token: str, user_id: str, question: str) -> str:
    goals = await get_goals_tool(token, user_id)
    profile = await get_profile_tool(token, user_id)
    goals_data = goals.get("data", [])
    profile_data = profile.get("data", {})

    monthly_income = profile_data.get("monthly_income", 0)
    if not monthly_income and goals_data:
        monthly_income = sum(goal.get("monthly_contribution", 0) for goal in goals_data)

    goal_summaries = []
    for goal in goals_data:
        timeline = project_goal_timeline(
            target_amount=goal.get("target_amount", 0),
            current_amount=goal.get("current_amount", 0),
            monthly_contribution=goal.get("monthly_contribution", monthly_income / max(len(goals_data), 1)),
        )
        goal_summaries.append({
            "name": goal.get("name"),
            "timeline": timeline,
        })

    prompt = (
        "You are a goal planning assistant. "
        "Answer the user's question using the goal data and projections below. "
        "Be specific with numbers and timelines.\n\n"
        f"Goals: {goal_summaries}\n"
        f"Question: {question}"
    )
    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")


async def answer_budget_question(token: str, user_id: str, question: str) -> str:
    transactions = await get_transactions_tool(token, user_id, page_size=200)
    budgets = await get_budget_tool(token, user_id)
    profile = await get_profile_tool(token, user_id)

    tx_data = transactions.get("data", {})
    results = tx_data.get("results", [])
    total_expense = sum(item.get("amount", 0) for item in results if item.get("type") == "expense")
    total_income = sum(item.get("amount", 0) for item in results if item.get("type") == "income")
    savings_rate = calculate_savings_rate(total_income, total_expense)

    budget_items = budgets.get("data", [])
    budget_variance = None
    if budget_items:
        total_budget = sum(item.get("amount", 0) for item in budget_items)
        budget_variance = calculate_budget_variance(total_budget, total_expense)

    prompt = (
        "You are a budget planning assistant. "
        "Answer the user's question using the financial data below. "
        "Be specific with numbers and suggest actionable improvements.\n\n"
        f"Total Income: {total_income}\n"
        f"Total Expense: {total_expense}\n"
        f"Savings Rate: {savings_rate}\n"
        f"Budget Variance: {budget_variance}\n"
        f"Question: {question}"
    )
    result = await generate(
        [{"role": "system", "content": prompt}],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    return result.get("message", {}).get("content", "")

