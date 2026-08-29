"""
Financial tool functions for ML-Backend.

Each function is a fixed, parameterized wrapper around the Phase 0 backend
API client.  No LLM-generated queries are allowed here.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from app.clients import (
    get_accounts,
    get_alerts,
    get_budgets,
    get_goals,
    get_transactions,
    get_user_profile,
)
from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.logging_utils import log_agent, log_validation


_DATE_RANGE_PATTERNS = [
    (r"\blast\s+month\b", "_last_month"),
    (r"\bthis\s+month\b", "_this_month"),
    (r"\blast\s+week\b", "_last_week"),
    (r"\bthis\s+week\b", "_this_week"),
    (r"\btoday\b", "_today"),
    (r"\byesterday\b", "_yesterday"),
]

_AMOUNT_PATTERNS = [
    (r"\bover\s+\$?(\d+(?:\.\d+)?)\b", ">"),
    (r"\bmore\s+than\s+\$?(\d+(?:\.\d+)?)\b", ">"),
    (r"\babove\s+\$?(\d+(?:\.\d+)?)\b", ">"),
    (r"\bunder\s+\$?(\d+(?:\.\d+)?)\b", "<"),
    (r"\bless\s+than\s+\$?(\d+(?:\.\d+)?)\b", "<"),
    (r"\bbelow\s+\$?(\d+(?:\.\d+)?)\b", "<"),
    (r"\bbetween\s+\$?(\d+(?:\.\d+)?)\s+and\s+\$?(\d+(?:\.\d+)?)\b", "between"),
]

_TYPE_KEYWORDS = {
    "income": "income",
    "expense": "expense",
    "spent": "expense",
    "earned": "income",
    "received": "income",
    "paid": "expense",
}


def _date_range_to_dates(range_name: str) -> Dict[str, Optional[str]]:
    today = date.today()
    if range_name == "_today":
        return {"start_date": today.isoformat(), "end_date": today.isoformat()}
    if range_name == "_yesterday":
        yesterday = today - timedelta(days=1)
        return {"start_date": yesterday.isoformat(), "end_date": yesterday.isoformat()}
    if range_name == "_this_week":
        start = today - timedelta(days=today.weekday())
        return {"start_date": start.isoformat(), "end_date": today.isoformat()}
    if range_name == "_last_week":
        start = today - timedelta(days=today.weekday() + 7)
        end = start + timedelta(days=6)
        return {"start_date": start.isoformat(), "end_date": end.isoformat()}
    if range_name == "_this_month":
        start = today.replace(day=1)
        return {"start_date": start.isoformat(), "end_date": today.isoformat()}
    if range_name == "_last_month":
        first_of_this_month = today.replace(day=1)
        last_month_end = first_of_this_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return {"start_date": last_month_start.isoformat(), "end_date": last_month_end.isoformat()}
    return {}


def _extract_filters_rule_based(query: str) -> Dict[str, Optional[str]]:
    filters: Dict[str, Optional[str]] = {}
    lower_query = query.lower()

    for pattern, range_name in _DATE_RANGE_PATTERNS:
        if re.search(pattern, lower_query, re.IGNORECASE):
            filters.update(_date_range_to_dates(range_name))
            break

    for pattern, op in _AMOUNT_PATTERNS:
        match = re.search(pattern, lower_query, re.IGNORECASE)
        if match:
            groups = match.groups()
            if op == "between" and len(groups) == 2:
                filters["amount_min"] = str(float(groups[0]))
                filters["amount_max"] = str(float(groups[1]))
            elif len(groups) == 1:
                amount = str(float(groups[0]))
                if op == ">":
                    filters["amount_min"] = amount
                elif op == "<":
                    filters["amount_max"] = amount
            break

    for keyword, type_ in _TYPE_KEYWORDS.items():
        if re.search(rf"\b{keyword}\b", lower_query, re.IGNORECASE):
            filters["type_"] = type_
            break

    category_match = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:coffee|restaurant|store|shop|transactions?|purchases?)\b", query)
    if not category_match:
        category_match = re.search(r"\b(?:at|from|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b", query)
    if category_match:
        filters["category"] = category_match.group(1)

    return filters


async def _extract_transaction_filters(query: str) -> Dict[str, Optional[str]]:
    rule_based = _extract_filters_rule_based(query)
    if rule_based.get("category") or rule_based.get("start_date") or rule_based.get("end_date") or rule_based.get("type_") or rule_based.get("amount_min") or rule_based.get("amount_max"):
        log_validation(
            request_id="",
            user_id="",
            event="filter_extraction_rule_based",
            schema="TransactionFilter",
            data={"query": query, "filters": rule_based},
            valid=True,
        )
        return {k: v for k, v in rule_based.items() if k in {"category", "type_", "start_date", "end_date"} and v}

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
            num_predict=60,
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


async def get_alerts_tool(
    token: str,
    user_id: str,
    *,
    read: Optional[bool] = None,
    category: Optional[str] = None,
    type_: Optional[str] = None,
) -> Dict[str, Any]:
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_alerts_called",
        input_data={"read": read, "category": category, "type_": type_},
    )
    data = await get_alerts(token, read=read, category=category, type_=type_)
    result_count = len(data.get("results", [])) if isinstance(data, dict) else 0
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="get_alerts_result",
        output_data={"result_count": result_count},
    )
    return {"user_id": user_id, "data": data}


async def query_transactions_dynamic(token: str, user_id: str, query: str) -> Dict[str, Any]:
    rule_based = _extract_filters_rule_based(query)
    if rule_based.get("category") or rule_based.get("start_date") or rule_based.get("end_date") or rule_based.get("type_") or rule_based.get("amount_min") or rule_based.get("amount_max"):
        log_validation(
            request_id="",
            user_id=user_id,
            event="query_transactions_dynamic_rule_based",
            schema="TransactionQuery",
            data={"query": query, "filters": rule_based},
            valid=True,
        )
        api_data = await get_transactions(
            token,
            page=1,
            page_size=rule_based.get("limit", 20),
            category=rule_based.get("category"),
            type_=rule_based.get("type_"),
            start_date=rule_based.get("start_date"),
            end_date=rule_based.get("end_date"),
        )
        results = api_data.get("results", []) if isinstance(api_data, dict) else []
        amount_min = rule_based.get("amount_min")
        amount_max = rule_based.get("amount_max")
        if amount_min is not None or amount_max is not None:
            filtered_results = []
            for item in results:
                amount = float(item.get("amount", 0))
                if amount_min is not None and amount < float(amount_min):
                    continue
                if amount_max is not None and amount > float(amount_max):
                    continue
                filtered_results.append(item)
            results = filtered_results
            api_data = dict(api_data)
            api_data["results"] = results
        result_count = len(results)
        log_agent(
            request_id="",
            user_id=user_id,
            conversation_id=None,
            agent="tool",
            event="query_transactions_dynamic_result",
            output_data={"filters": rule_based, "result_count": result_count},
        )
        return {"user_id": user_id, "query": query, "filters": rule_based, "data": api_data}

    extraction_prompt = (
        "Extract transaction search filters from the user's query. "
        "Return ONLY a JSON object with these exact keys:\n"
        '{"query_type":"transaction","merchant":null,"date":null,"start_date":null,"end_date":null,'
        '"amount_min":null,"amount_max":null,"category":null,"transaction_type":null,"description":null,"limit":20}\n'
        "Use null for missing values. Dates must be YYYY-MM-DD. "
        "transaction_type must be income or expense. limit must be a positive integer."
    )
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="query_transactions_dynamic_called",
        input_data={"query": query},
    )
    try:
        result = await generate(
            [
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": query},
            ],
            model=DEFAULT_CHAT_MODEL,
            stream=False,
            num_predict=100,
        )
        content = result.get("message", {}).get("content", "").strip()
        if not content:
            log_validation(
                request_id="",
                user_id=user_id,
                event="query_transactions_dynamic_validation_failed",
                schema="TransactionQuery",
                data=None,
                valid=False,
                error="Empty Ollama response",
            )
            return {"user_id": user_id, "query": query, "filters": {}, "data": {}, "error": "Empty response"}
        data = json.loads(content)
        if data.get("query_type") != "transaction":
            log_validation(
                request_id="",
                user_id=user_id,
                event="query_transactions_dynamic_validation_failed",
                schema="TransactionQuery",
                data=data,
                valid=False,
                error="Invalid query_type",
            )
            return {"user_id": user_id, "query": query, "filters": {}, "data": {}, "error": "Invalid query_type"}
    except Exception as exc:
        log_validation(
            request_id="",
            user_id=user_id,
            event="query_transactions_dynamic_validation_failed",
            schema="TransactionQuery",
            data=None,
            valid=False,
            error=str(exc),
        )
        return {"user_id": user_id, "query": query, "filters": {}, "data": {}, "error": str(exc)}

    filters: Dict[str, Any] = {}
    if data.get("merchant"):
        filters["search"] = data["merchant"]
    if data.get("description"):
        filters["search"] = data["description"]
    if data.get("date"):
        filters["date"] = data["date"]
    if data.get("start_date"):
        filters["start_date"] = data["start_date"]
    if data.get("end_date"):
        filters["end_date"] = data["end_date"]
    if data.get("category"):
        filters["category"] = data["category"]
    if data.get("transaction_type"):
        filters["type_"] = data["transaction_type"]
    limit = int(data.get("limit") or 20)
    limit = max(1, min(limit, 100))

    log_validation(
        request_id="",
        user_id=user_id,
        event="query_transactions_dynamic_validated",
        schema="TransactionQuery",
        data=data,
        valid=True,
    )

    api_data = await get_transactions(
        token,
        page=1,
        page_size=limit,
        category=filters.get("category"),
        type_=filters.get("type_"),
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
    )

    results = api_data.get("results", []) if isinstance(api_data, dict) else []
    amount_min = data.get("amount_min")
    amount_max = data.get("amount_max")
    if amount_min is not None or amount_max is not None:
        filtered_results = []
        for item in results:
            amount = float(item.get("amount", 0))
            if amount_min is not None and amount < float(amount_min):
                continue
            if amount_max is not None and amount > float(amount_max):
                continue
            filtered_results.append(item)
        results = filtered_results
        api_data = dict(api_data)
        api_data["results"] = results

    result_count = len(results)
    log_agent(
        request_id="",
        user_id=user_id,
        conversation_id=None,
        agent="tool",
        event="query_transactions_dynamic_result",
        output_data={"filters": filters, "result_count": result_count},
    )
    return {"user_id": user_id, "query": query, "filters": filters, "data": api_data}
