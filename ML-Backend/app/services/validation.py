"""
Input validation for ML-Backend agent data.

Validates that data retrieved from the Django backend is well-formed
before passing it to Ollama.  Each validator returns a tuple of
(is_valid, error_key).  If is_valid is False, the caller should use the
pre-written fallback for that error_key instead of calling the model.

Backend responses may be:
- A raw list (unpaginated)
- A dict with "results" key (paginated)
- A dict with "data" key containing either of the above
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple


def _extract_list(data: Any) -> Any:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if "results" in data and isinstance(data["results"], list):
            return data["results"]
        if "data" in data:
            return _extract_list(data["data"])
    return None


def validate_insights_context(data: Any) -> Tuple[bool, str]:
    results = _extract_list(data)
    if results is None:
        return False, "malformed_insights_data"
    if len(results) == 0:
        return False, "no_insights_data"
    return True, ""


def validate_alerts_context(data: Any) -> Tuple[bool, str]:
    results = _extract_list(data)
    if results is None:
        return False, "malformed_alerts_data"
    if len(results) == 0:
        return False, "no_alerts_data"
    return True, ""


def validate_transactions_context(data: Any) -> Tuple[bool, str]:
    results = _extract_list(data)
    if results is None:
        return False, "malformed_transactions_data"
    if len(results) == 0:
        return False, "no_transactions_data"
    for item in results:
        if not isinstance(item, dict):
            continue
        if "date" not in item or "amount" not in item:
            return False, "partial_transactions_data"
    return True, ""


def validate_budget_context(data: Any) -> Tuple[bool, str]:
    results = _extract_list(data)
    if results is None:
        return False, "malformed_budget_data"
    if len(results) == 0:
        return False, "no_budget_data"
    return True, ""


def validate_goals_context(data: Any) -> Tuple[bool, str]:
    results = _extract_list(data)
    if results is None:
        return False, "malformed_goals_data"
    if len(results) == 0:
        return False, "no_goals_data"
    return True, ""


def validate_profile_context(data: Any) -> Tuple[bool, str]:
    if not isinstance(data, dict):
        return False, "malformed_profile_data"
    if "monthly_income" not in data or "name" not in data:
        return False, "partial_profile_data"
    return True, ""
