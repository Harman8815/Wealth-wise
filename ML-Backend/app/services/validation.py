"""
Input validation for ML-Backend agent data.

Validates that data retrieved from the Django backend is well-formed
before passing it to Ollama.  Each validator returns a tuple of
(is_valid, error_key).  If is_valid is False, the caller should use the
pre-written fallback for that error_key instead of calling the model.
"""
from __future__ import annotations

from typing import Any, Dict, Tuple


def _is_non_empty_list(value: Any) -> bool:
    return isinstance(value, list) and len(value) > 0


def _is_dict(value: Any) -> bool:
    return isinstance(value, dict)


def validate_insights_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_insights_data"
    results = data.get("results") if isinstance(data, dict) else None
    if not _is_non_empty_list(results):
        return False, "no_insights_data"
    return True, ""


def validate_alerts_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_alerts_data"
    results = data.get("results") if isinstance(data, dict) else None
    if not _is_non_empty_list(results):
        return False, "no_alerts_data"
    return True, ""


def validate_transactions_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_transactions_data"
    results = data.get("results") if isinstance(data, dict) else None
    if not _is_non_empty_list(results):
        return False, "no_transactions_data"
    for item in results:
        if not isinstance(item, dict):
            continue
        if "date" not in item or "amount" not in item:
            return False, "partial_transactions_data"
    return True, ""


def validate_budget_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_budget_data"
    results = data.get("results") if isinstance(data, dict) else None
    if not _is_non_empty_list(results):
        return False, "no_budget_data"
    return True, ""


def validate_goals_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_goals_data"
    results = data.get("results") if isinstance(data, dict) else None
    if not _is_non_empty_list(results):
        return False, "no_goals_data"
    return True, ""


def validate_profile_context(data: Any) -> Tuple[bool, str]:
    if not _is_dict(data):
        return False, "malformed_profile_data"
    if "monthly_income" not in data or "name" not in data:
        return False, "partial_profile_data"
    return True, ""
