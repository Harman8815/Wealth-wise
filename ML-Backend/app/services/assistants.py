"""
Goal and budget planning assistants for ML-Backend.

Each assistant combines calculation helpers with backend/ data to answer
user questions in a structured, data-driven way.
"""
from __future__ import annotations

from typing import Any, Dict, List

from app.ollama import DEFAULT_CHAT_MODEL, generate, OllamaAdapterError
from app.services.calculations import calculate_budget_variance, calculate_savings_rate, project_goal_timeline
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_profile_tool,
    get_transactions_tool,
)
from app.logging_utils import log_agent
from app.services.validation import validate_goals_context, validate_transactions_context, validate_budget_context, validate_profile_context
from app.services.fallbacks import get_fallback
from app.services.ollama_config import get_options


async def answer_goal_question(token: str, user_id: str, question: str) -> str:
    try:
        goals = await get_goals_tool(token, user_id)
        profile = await get_profile_tool(token, user_id)
        goals_data = goals.get("data", [])
        profile_data = profile.get("data", {})

        is_valid, error_key = validate_goals_context(goals_data)
        if not is_valid:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="goal",
                event="goal_validation_fallback",
                input_data={"question": question, "error_key": error_key},
            )
            return get_fallback(error_key)

        is_valid_profile, error_key_profile = validate_profile_context(profile_data)
        if not is_valid_profile:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="goal",
                event="goal_validation_fallback",
                input_data={"question": question, "error_key": error_key_profile},
            )
            return get_fallback(error_key_profile)

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
        try:
            result = await generate(
                [{"role": "system", "content": prompt}],
                model=DEFAULT_CHAT_MODEL,
                stream=False,
                options=get_options("goal"),
                num_predict=200,
            )
            answer = result.get("message", {}).get("content", "")
        except OllamaAdapterError as exc:
            answer = get_fallback("ollama_unavailable")
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="goal",
            event="goal_question_answered",
            input_data={"question": question, "goal_count": len(goals_data)},
            output_data={"answer": answer},
        )
        return answer
    except Exception as exc:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="goal",
            event="goal_error",
            error=str(exc),
        )
        return f"I encountered an error processing your goal question: {str(exc)}"


async def answer_budget_question(token: str, user_id: str, question: str) -> str:
    try:
        transactions = await get_transactions_tool(token, user_id, page=1, page_size=200)
        budgets = await get_budget_tool(token, user_id)
        profile = await get_profile_tool(token, user_id)

        tx_data = transactions.get("data", {})
        is_valid_tx, error_key_tx = validate_transactions_context(tx_data)
        if not is_valid_tx:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="budget",
                event="budget_validation_fallback",
                input_data={"question": question, "error_key": error_key_tx},
            )
            return get_fallback(error_key_tx)

        budget_data = budgets.get("data", [])
        is_valid_budget, error_key_budget = validate_budget_context(budget_data)
        if not is_valid_budget:
            log_agent(
                request_id="",
                user_id=user_id,
                conversation_id=None,
                agent="budget",
                event="budget_validation_fallback",
                input_data={"question": question, "error_key": error_key_budget},
            )
            return get_fallback(error_key_budget)

        results = tx_data.get("results", [])
        total_expense = sum(item.get("amount", 0) for item in results if item.get("type") == "expense")
        total_income = sum(item.get("amount", 0) for item in results if item.get("type") == "income")
        savings_rate = calculate_savings_rate(total_income, total_expense)

        budget_items = budget_data
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
        try:
            result = await generate(
                [{"role": "system", "content": prompt}],
                model=DEFAULT_CHAT_MODEL,
                stream=False,
                options=get_options("budget"),
                num_predict=200,
            )
            answer = result.get("message", {}).get("content", "")
        except OllamaAdapterError as exc:
            answer = get_fallback("ollama_unavailable")
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="budget",
            event="budget_question_answered",
            input_data={"question": question, "total_income": total_income, "total_expense": total_expense, "savings_rate": savings_rate, "budget_variance": budget_variance},
            output_data={"answer": answer},
        )
        return answer
    except Exception as exc:
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="budget",
            event="budget_error",
            error=str(exc),
        )
        return f"I encountered an error processing your budget question: {str(exc)}"
