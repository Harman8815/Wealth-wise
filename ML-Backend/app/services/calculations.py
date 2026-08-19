"""
Pure financial calculation helpers for ML-Backend.

No I/O, no LLM calls — deterministic functions operating on data already
fetched from `backend/`.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def calculate_savings_rate(
    income: float,
    expense: float,
    *,
    precision: int = 2,
) -> float:
    if income <= 0:
        return 0.0
    return round(max(0.0, (income - expense) / income), precision)


def project_goal_timeline(
    target_amount: float,
    current_amount: float,
    monthly_contribution: float,
    *,
    precision: int = 2,
) -> Dict[str, Any]:
    remaining = max(0.0, target_amount - current_amount)
    if monthly_contribution <= 0 or remaining <= 0:
        months = 0 if remaining <= 0 else None
        return {
            "target_amount": target_amount,
            "current_amount": current_amount,
            "remaining": remaining,
            "monthly_contribution": monthly_contribution,
            "months": months,
            "completed": remaining <= 0,
        }
    months = int(remaining / monthly_contribution)
    if months * monthly_contribution < remaining:
        months += 1
    return {
        "target_amount": target_amount,
        "current_amount": current_amount,
        "remaining": remaining,
        "monthly_contribution": monthly_contribution,
        "months": months,
        "completed": False,
    }


def calculate_budget_variance(
    budgeted: float,
    actual: float,
    *,
    precision: int = 2,
) -> Dict[str, Any]:
    variance = actual - budgeted
    percentage = 0.0
    if budgeted != 0:
        percentage = round((variance / abs(budgeted)) * 100, precision)
    return {
        "budgeted": budgeted,
        "actual": actual,
        "variance": variance,
        "percentage": percentage,
        "over_budget": variance > 0,
    }
