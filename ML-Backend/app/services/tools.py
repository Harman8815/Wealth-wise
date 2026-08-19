"""
Financial tool functions for ML-Backend.

Each function is a fixed, parameterized wrapper around the Phase 0 backend
API client.  No LLM-generated queries are allowed here.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.clients import (
    get_accounts,
    get_budgets,
    get_goals,
    get_transactions,
    get_user_profile,
)


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
