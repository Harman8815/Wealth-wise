"""
Simple circuit breaker for Ollama calls.

Tracks consecutive failures and opens the circuit after a threshold,
preventing further Ollama calls until a cooldown period expires.
"""
from __future__ import annotations

import time
from typing import Optional


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, cooldown_seconds: float = 60.0) -> None:
        self.failure_threshold = failure_threshold
        self.cooldown = cooldown_seconds
        self._failures = 0
        self._opened_at: Optional[float] = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self.failure_threshold:
            self._opened_at = time.time()

    def record_success(self) -> None:
        self._failures = 0
        self._opened_at = None

    @property
    def is_open(self) -> bool:
        if self._opened_at is None:
            return False
        if time.time() - self._opened_at > self.cooldown:
            self._failures = 0
            self._opened_at = None
            return False
        return True

    @property
    def failure_count(self) -> int:
        return self._failures


ollama_circuit_breaker = CircuitBreaker(
    failure_threshold=int(__import__("os").environ.get("OLLAMA_CIRCUIT_THRESHOLD", "3")),
    cooldown_seconds=float(__import__("os").environ.get("OLLAMA_CIRCUIT_COOLDOWN", "60")),
)
