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
    data = await get_transactions(
        token,
        page=page,
        page_size=page_size,
        category=category,
        type_=type_,
        start_date=start_date,
        end_date=end_date,
    )
    return {"user_id": user_id, "data": data}


async def get_balance_tool(token: str, user_id: str) -> Dict[str, Any]:
    accounts = await get_accounts(token)
    return {"user_id": user_id, "data": accounts}


async def get_budget_tool(token: str, user_id: str) -> Dict[str, Any]:
    budgets = await get_budgets(token)
    return {"user_id": user_id, "data": budgets}


async def get_income_tool(
    token: str,
    user_id: str,
    *,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    data = await get_transactions(
        token,
        page=1,
        page_size=100,
        type_="income",
        start_date=start_date,
        end_date=end_date,
    )
    return {"user_id": user_id, "data": data}


async def get_goals_tool(token: str, user_id: str) -> Dict[str, Any]:
    goals = await get_goals(token)
    return {"user_id": user_id, "data": goals}


async def get_profile_tool(token: str, user_id: str) -> Dict[str, Any]:
    profile = await get_user_profile(token)
    return {"user_id": user_id, "data": profile}


async def search_transactions_nl(token: str, user_id: str, query: str) -> Dict[str, Any]:
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
    return {"user_id": user_id, "query": query, "filters": filters, "data": data}
