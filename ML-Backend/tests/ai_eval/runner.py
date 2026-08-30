"""
Eval test runner for ML-Backend AI agent quality.

Loads test cases from prompts.yaml, executes them against the agent,
runs scoring checks, and produces an EvalReport.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import yaml

from app.services.intent import classify_intent
from app.services.router import route_intent
from app.services.pipeline import process_response


@dataclass
class EvalCase:
    name: str
    prompt: str
    expected_intent: Optional[str] = None
    expected_type: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    checks: Dict[str, float] = field(default_factory=dict)
    weights: Dict[str, float] = field(default_factory=lambda: {
        "no_banned_phrases": 3.0,
        "format_correct": 3.0,
        "no_hallucination": 3.0,
        "contains_figure": 2.0,
        "max_length": 1.0,
        "min_length": 1.0,
    })


@dataclass
class CheckResult:
    check_name: str
    score: float
    weight: float
    weighted_score: float


@dataclass
class EvalReport:
    case_name: str
    passed: bool
    total_score: float
    max_score: float
    check_results: List[CheckResult]
    response: str
    intent: str
    duration_ms: float
    critical_failures: List[str] = field(default_factory=list)


def load_cases(path: str) -> List[EvalCase]:
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    cases = []
    for item in data.get("cases", []):
        case = EvalCase(
            name=item.get("name", "unnamed"),
            prompt=item.get("prompt", ""),
            expected_intent=item.get("expected_intent"),
            expected_type=item.get("expected_type"),
            context=item.get("context", {}),
            checks=item.get("checks", {}),
        )
        cases.append(case)
    return cases


async def run_case(case: EvalCase, token: str = "test-token", user_id: str = "test-user") -> EvalReport:
    start = time.perf_counter()
    try:
        intent = await classify_intent(case.prompt)
        result = await route_intent(
            intent=intent,
            token=token,
            user_id=user_id,
            message=case.prompt,
        )
        response = result.get("response", "")
        if response is None:
            response = ""
        response = process_response(response)
    except Exception as exc:
        response = f"ERROR: {exc}"
        intent = None
    duration_ms = (time.perf_counter() - start) * 1000

    from tests.ai_eval.checks import run_checks
    check_scores = run_checks(response, case.context, case.expected_type)

    check_results = []
    total_weighted = 0.0
    total_weight = 0.0
    critical_failures = []
    for check_name, score in check_scores.items():
        weight = case.weights.get(check_name, 1.0)
        weighted = score * weight
        total_weighted += weighted
        total_weight += weight
        check_results.append(CheckResult(
            check_name=check_name,
            score=score,
            weight=weight,
            weighted_score=weighted,
        ))
        if weight >= 3.0 and score < 1.0:
            critical_failures.append(check_name)

    normalized_score = total_weighted / total_weight if total_weight > 0 else 0.0
    passed = normalized_score >= 0.85 and len(critical_failures) == 0

    intent_str = intent.value if intent else "unknown"
    return EvalReport(
        case_name=case.name,
        passed=passed,
        total_score=normalized_score,
        max_score=1.0,
        check_results=check_results,
        response=response[:500],
        intent=intent_str,
        duration_ms=duration_ms,
        critical_failures=critical_failures,
    )


def save_report(report: EvalReport, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = {
        "case_name": report.case_name,
        "passed": report.passed,
        "total_score": report.total_score,
        "max_score": report.max_score,
        "check_results": [
            {
                "check_name": cr.check_name,
                "score": cr.score,
                "weight": cr.weight,
                "weighted_score": cr.weighted_score,
            }
            for cr in report.check_results
        ],
        "response": report.response,
        "intent": report.intent,
        "duration_ms": report.duration_ms,
        "critical_failures": report.critical_failures,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
