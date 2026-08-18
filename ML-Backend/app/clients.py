"""
Thin async client for the existing ``backend/`` Django REST API.

Every method forwards the caller's JWT in the ``Authorization`` header.
Never retries or caches — keep it minimal so Phase 5/6 tool functions can
wrap it directly.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000/api")


def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


async def get_transactions(
    token: str,
    *,
    page: int = 1,
    page_size: int = 100,
    category: Optional[str] = None,
    type_: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    params: Dict[str, Any] = {"page": page, "page_size": page_size}
    if category:
        params["category"] = category
    if type_:
        params["type"] = type_
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BACKEND_API_URL}/transactions/",
            headers=_headers(token),
            params=params,
        )
        resp.raise_for_status()
        return resp.json()


async def get_budgets(token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BACKEND_API_URL}/budget-categories/",
            headers=_headers(token),
        )
        resp.raise_for_status()
        return resp.json()


async def get_goals(token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BACKEND_API_URL}/goals/",
            headers=_headers(token),
        )
        resp.raise_for_status()
        return resp.json()


async def get_accounts(token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BACKEND_API_URL}/accounts/",
            headers=_headers(token),
        )
        resp.raise_for_status()
        return resp.json()


async def get_user_profile(token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{BACKEND_API_URL}/users/me/",
            headers=_headers(token),
        )
        resp.raise_for_status()
        return resp.json()
