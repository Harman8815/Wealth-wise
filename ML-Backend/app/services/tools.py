"""
Financial tool functions for ML-Backend.

Each function is a fixed, parameterized wrapper around the Phase 0 backend
API client.  No LLM-generated queries are allowed here.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.clients import (
    get_accounts,
    get_budgets,
    get_goals,
    get_transactions,
    get_user_profile,
)
from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.logging_utils import log_agent


async def _extract_transaction_filters(query: str) -> Dict[str, Optional[str]]:
    extraction_prompt = (
        "Extract transaction search filters from the user's query. "
        "Return ONLY a JSON object with keys: category, type_ (income|expense), "
        "start_date (YYYY-MM-DD), end_date (YYYY-MM-DD). "
        "Use null for missing values."
    )
    try:
        result = await generate(
            [
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": query},
            ],
            model=DEFAULT_CHAT_MODEL,
            stream=False,
        )
        content = result.get("message", {}).get("content", "").strip()
        if not content:
            return {}
        data = json.loads(content)
        return {k: v for k, v in data.items() if k in {"category", "type_", "start_date", "end_date"} and v}
    except Exception:
        return {}


async def get_transactions_tool(
    token: str,
    user_id: str,
    *,
    category: Optional[str] = None,
    type_: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    page_size: int = 100,
) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_transactions_called",
        input_data={"category": category, "type_": type_, "start_date": start_date, "end_date": end_date, "page": page, "page_size": page_size},
    )
    data = await get_transactions(
        token,
        page=page,
        page_size=page_size,
        category=category,
        type_=type_,
        start_date=start_date,
        end_date=end_date,
    )
    result_count = len(data.get("results", [])) if isinstance(data, dict) else 0
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_transactions_result",
        output_data={"result_count": result_count},
    )
    return {"user_id": user_id, "data": data}


async def get_balance_tool(token: str, user_id: str) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_balance_called",
    )
    accounts = await get_accounts(token)
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_balance_result",
        output_data={"account_count": len(accounts.get("results", [])) if isinstance(accounts, dict) else 0},
    )
    return {"user_id": user_id, "data": accounts}


async def get_budget_tool(token: str, user_id: str) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_budget_called",
    )
    budgets = await get_budgets(token)
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_budget_result",
        output_data={"budget_count": len(budgets.get("results", [])) if isinstance(budgets, dict) else 0},
    )
    return {"user_id": user_id, "data": budgets}


async def get_income_tool(
    token: str,
    user_id: str,
    *,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_income_called",
        input_data={"start_date": start_date, "end_date": end_date},
    )
    data = await get_transactions(
        token,
        page=1,
        page_size=100,
        type_="income",
        start_date=start_date,
        end_date=end_date,
    )
    result_count = len(data.get("results", [])) if isinstance(data, dict) else 0
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_income_result",
        output_data={"result_count": result_count},
    )
    return {"user_id": user_id, "data": data}


async def get_goals_tool(token: str, user_id: str) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_goals_called",
    )
    goals = await get_goals(token)
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_goals_result",
        output_data={"goal_count": len(goals.get("results", [])) if isinstance(goals, dict) else 0},
    )
    return {"user_id": user_id, "data": goals}


async def get_profile_tool(token: str, user_id: str) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_profile_called",
    )
    profile = await get_user_profile(token)
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_profile_result",
    )
    return {"user_id": user_id, "data": profile}


async def search_transactions_nl(token: str, user_id: str, query: str) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="search_transactions_nl_called",
        input_data={"query": query},
    )
    filters = await _extract_transaction_filters(query)
    data = await get_transactions(
        token,
        page=1,
        page_size=100,
        category=filters.get("category"),
        type_=filters.get("type_"),
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
    )
    result_count = len(data.get("results", [])) if isinstance(data, dict) else 0
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="search_transactions_nl_result",
        output_data={"query": query, "filters": filters, "result_count": result_count},
    )
    return {"user_id": user_id, "query": query, "filters": filters, "data": data}
