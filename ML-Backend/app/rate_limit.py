"""
In-memory rate limiter for ML-Backend.

Simple token-bucket implementation per user_id.  This is intentionally
single-instance only: it won't work across multiple processes or machines.
Revisit before any multi-instance deployment.
"""
from __future__ import annotations

import threading
import time
from typing import Dict, Tuple

from fastapi import Request, HTTPException


class RateLimiter:
    def __init__(
        self,
        *,
        rate: float = 1.0,
        per: float = 1.0,
        max_burst: int = 10,
    ) -> None:
        self.rate = rate
        self.per = per
        self.max_burst = max_burst
        self._buckets: Dict[str, Tuple[float, float]] = {}
        self._lock = threading.Lock()

    def _now(self) -> float:
        return time.monotonic()

    def is_allowed(self, key: str) -> bool:
        with self._lock:
            now = self._now()
            tokens, last = self._buckets.get(key, (self.max_burst, now))
            elapsed = now - last
            tokens = min(self.max_burst, tokens + elapsed * (self.rate / self.per))
            if tokens >= 1.0:
                tokens -= 1.0
                self._buckets[key] = (tokens, now)
                return True
            self._buckets[key] = (tokens, last)
            return False


chat_rate_limiter = RateLimiter(rate=10.0, per=60.0, max_burst=10)


def enforce_rate_limit(request: Request) -> None:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        return
    if not chat_rate_limiter.is_allowed(user_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down.",
        )
