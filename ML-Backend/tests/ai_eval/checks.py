"""
Scoring checks for ML-Backend AI eval tests.

Each check returns a score between 0.0 and 1.0.
Weights are defined in the EvalCase and aggregated in EvalReport.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


BANNED_PHRASES = [
    "i'd be happy to help",
    "let's assume",
    "here's an example",
    "please provide",
    "feel free to",
    "as an ai",
    "as a financial assistant",
    "i don't see any data provided",
    "sure!",
    "of course!",
    "let me tell you",
    "let me show you",
    "based on the data",
]


def check_no_banned_phrases(response: str) -> float:
    lowered = response.lower()
    for phrase in BANNED_PHRASES:
        if phrase in lowered:
            return 0.0
    return 1.0


def check_format_correct(response: str, expected_type: Optional[str] = None) -> float:
    try:
        data = __import__("json").loads(response)
        if isinstance(data, dict) and data.get("type"):
            return 1.0
    except Exception:
        pass
    if expected_type == "text" or expected_type == "markdown":
        return 1.0
    return 0.5


def check_no_hallucination(response: str, context: Dict[str, Any]) -> float:
    lowered = response.lower()
    for key in ["total_income", "total_expense", "savings_rate", "budget"]:
        if key in lowered:
            return 1.0
    return 0.3


def check_contains_figure(response: str) -> float:
    if re.search(r'[\d,]+(?:\.\d+)?\s*(?:₹|rs\.?|inr|%)', response, re.IGNORECASE):
        return 1.0
    if re.search(r'\d+\.?\d*\s*%', response):
        return 1.0
    return 0.0


def check_max_length(response: str, max_chars: int = 500) -> float:
    if len(response) <= max_chars:
        return 1.0
    return 0.0


def check_min_length(response: str, min_chars: int = 10) -> float:
    if len(response.strip()) >= min_chars:
        return 1.0
    return 0.0


def run_checks(response: str, context: Dict[str, Any], expected_type: Optional[str] = None) -> Dict[str, float]:
    return {
        "no_banned_phrases": check_no_banned_phrases(response),
        "format_correct": check_format_correct(response, expected_type),
        "no_hallucination": check_no_hallucination(response, context),
        "contains_figure": check_contains_figure(response),
        "max_length": check_max_length(response),
        "min_length": check_min_length(response),
    }
