"""
Benchmark script for comparing LLM models on the WealthWise AI eval suite.

Usage:
    python scripts/benchmark_models.py [--model qwen2.5:4b] [--model llama3.2]

Requires Ollama running locally with the specified models pulled.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from dataclasses import dataclass, field
from typing import List, Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ML-Backend"))

from tests.ai_eval.prompts import load_cases
from app.services.intent import classify_intent
from app.services.router import route_intent
from app.services.pipeline import process_response


@dataclass
class BenchmarkResult:
    model: str
    case_name: str
    score: float
    latency_ms: float
    passed: bool
    failures: List[str] = field(default_factory=list)


async def benchmark_case(model: str, case, token: str = "bench-token", user_id: str = "bench-user") -> BenchmarkResult:
    prompt = case.get("prompt", "")
    expected_intent = case.get("expected_intent")
    start = time.perf_counter()
    try:
        intent = await classify_intent(prompt)
        result = await route_intent(
            intent=intent,
            token=token,
            user_id=user_id,
            message=prompt,
        )
        response = result.get("response", "") or ""
        response = process_response(response)
    except Exception as exc:
        response = f"ERROR: {exc}"
        intent = None
    latency_ms = (time.perf_counter() - start) * 1000

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

    return BenchmarkResult(
        model=model,
        case_name=case.get("name", "unnamed"),
        score=max(0.0, score),
        latency_ms=latency_ms,
        passed=score >= 0.85 and len(failures) == 0,
        failures=failures,
    )


async def run_benchmark(models: List[str], cases_path: str, output_path: str) -> None:
    cases = load_cases(cases_path)
    all_results: List[BenchmarkResult] = []

    for model in models:
        os.environ["OLLAMA_CHAT_MODEL"] = model
        for case in cases:
            result = await benchmark_case(model, case)
            all_results.append(result)

    summary = {}
    for result in all_results:
        if result.model not in summary:
            summary[result.model] = {
                "cases": [],
                "avg_score": 0.0,
                "avg_latency_ms": 0.0,
                "passed": 0,
                "failed": 0,
            }
        summary[result.model]["cases"].append({
            "name": result.case_name,
            "score": result.score,
            "latency_ms": result.latency_ms,
            "passed": result.passed,
            "failures": result.failures,
        })
        if result.passed:
            summary[result.model]["passed"] += 1
        else:
            summary[result.model]["failed"] += 1

    for model, data in summary.items():
        scores = [c["score"] for c in data["cases"]]
        latencies = [c["latency_ms"] for c in data["cases"]]
        data["avg_score"] = sum(scores) / len(scores) if scores else 0.0
        data["avg_latency_ms"] = sum(latencies) / len(latencies) if latencies else 0.0

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Benchmark complete. Results saved to {output_path}")
    for model, data in summary.items():
        print(f"\nModel: {model}")
        print(f"  Avg score: {data['avg_score']:.2f}")
        print(f"  Avg latency: {data['avg_latency_ms']:.0f}ms")
        print(f"  Passed: {data['passed']}/{len(data['cases'])}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark LLM models on WealthWise eval suite")
    parser.add_argument("--model", action="append", required=True, help="Model name(s) to benchmark")
    parser.add_argument("--cases", default=os.path.join(os.path.dirname(__file__), "..", "ML-Backend", "tests", "ai_eval", "prompts.yaml"))
    parser.add_argument("--output", default=os.path.join(os.path.dirname(__file__), "benchmark_results.json"))
    args = parser.parse_args()

    asyncio.run(run_benchmark(args.model, args.cases, args.output))


if __name__ == "__main__":
    main()
