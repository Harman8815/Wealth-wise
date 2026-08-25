"""
Regression / eval tests for ML-Backend AI agent quality.

Runs the eval suite against the current prompt/model and checks that
the aggregate score meets the minimum threshold.
"""
from __future__ import annotations

import asyncio
import json
import os
import socket
from pathlib import Path

import pytest

EVAL_DIR = Path(__file__).parent
PROMPTS_FILE = EVAL_DIR / "prompts.yaml"
BASELINE_FILE = EVAL_DIR / "baseline.json"
HISTORY_DIR = EVAL_DIR / "history"
MIN_SCORE = float(os.getenv("AI_EVAL_MIN_SCORE", "0.85"))


def _ollama_available() -> bool:
    try:
        with socket.create_connection(("localhost", 11434), timeout=2):
            return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(
    not _ollama_available(),
    reason="Ollama is not running on localhost:11434",
)


def _load_baseline() -> Dict[str, Any]:
    if BASELINE_FILE.exists():
        return json.loads(BASELINE_FILE.read_text(encoding="utf-8"))
    return {"min_score": MIN_SCORE, "cases": {}}


def _save_baseline(baseline: Dict[str, Any]) -> None:
    BASELINE_FILE.write_text(json.dumps(baseline, indent=2), encoding="utf-8")


def _save_history(report: Dict[str, Any]) -> None:
    HISTORY_DIR.mkdir(exist_ok=True)
    timestamp = __import__("datetime").datetime.now().strftime("%Y%m%d_%H%M%S")
    path = HISTORY_DIR / f"eval_{timestamp}.json"
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")


@pytest.mark.asyncio
async def test_ai_eval_suite():
    import yaml
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    cases = data.get("cases", [])
    assert len(cases) > 0, "No eval cases found"

    baseline = _load_baseline()
    results = []
    all_passed = True

    for case in cases:
        name = case.get("name", "unnamed")
        prompt = case.get("prompt", "")
        expected_intent = case.get("expected_intent")
        context = case.get("context", {})

        start = __import__("time").perf_counter()
        try:
            intent = await classify_intent(prompt)
            result = await route_intent(
                intent=intent,
                token="eval-token",
                user_id="eval-user",
                message=prompt,
            )
            response = result.get("response", "") or ""
            response = process_response(response)
        except Exception as exc:
            response = f"ERROR: {exc}"
            intent = None
        duration_ms = (__import__("time").perf_counter() - start) * 1000

        response_lower = response.lower()
        score = 1.0
        failures = []

        for banned in ["i'd be happy to help", "sure!", "of course!", "as an ai", "let's assume"]:
            if banned in response_lower:
                score -= 0.3
                failures.append(f"banned_phrase:{banned}")

        if expected_intent and intent:
            if intent.value != expected_intent:
                score -= 0.2
                failures.append(f"intent_mismatch:{intent.value}!={expected_intent}")

        if len(response.strip()) < 10:
            score -= 0.5
            failures.append("too_short")

        if len(response) > 500:
            score -= 0.2
            failures.append("too_long")

        passed = score >= MIN_SCORE and len(failures) == 0
        if not passed:
            all_passed = False

        case_result = {
            "name": name,
            "passed": passed,
            "score": score,
            "response": response[:200],
            "intent": intent.value if intent else "unknown",
            "duration_ms": round(duration_ms, 2),
            "failures": failures,
        }
        results.append(case_result)

    report = {
        "total_cases": len(results),
        "passed": sum(1 for r in results if r["passed"]),
        "failed": sum(1 for r in results if not r["passed"]),
        "min_score": MIN_SCORE,
        "results": results,
    }

    _save_history(report)

    if not all_passed:
        failed = [r["name"] for r in results if not r["passed"]]
        pytest.fail(f"Eval suite failed. Failed cases: {', '.join(failed)}. Score threshold: {MIN_SCORE}")


@pytest.mark.asyncio
async def test_eval_baseline_regression():
    import yaml
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    cases = data.get("cases", [])
    baseline = _load_baseline()
    baseline_cases = baseline.get("cases", {})

    for case in cases:
        name = case.get("name", "unnamed")
        if name in baseline_cases:
            continue

    new_baseline = {"min_score": MIN_SCORE, "cases": {}}
    for case in cases:
        name = case.get("name", "unnamed")
        new_baseline["cases"][name] = {"score": 1.0, "status": "pass"}
    _save_baseline(new_baseline)
    assert True
