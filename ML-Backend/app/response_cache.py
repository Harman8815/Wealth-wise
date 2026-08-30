"""
Simple in-memory response cache for ML-Backend.

Caches narrative responses keyed by (user_id, data_hash, agent) with a short TTL.
"""
from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, Optional, Tuple


class ResponseCache:
    def __init__(self, ttl_seconds: int = 300) -> None:
        self.ttl = ttl_seconds
        self._store: Dict[str, Tuple[Any, float]] = {}

    def _key(self, user_id: str, data_hash: str, agent: str) -> str:
        return f"{user_id}:{agent}:{data_hash}"

    def get(self, user_id: str, data_hash: str, agent: str) -> Optional[Any]:
        key = self._key(user_id, data_hash, agent)
        entry = self._store.get(key)
        if not entry:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, user_id: str, data_hash: str, agent: str, value: Any) -> None:
        key = self._key(user_id, data_hash, agent)
        self._store[key] = (value, time.time() + self.ttl)

    def invalidate(self, user_id: str, agent: str) -> None:
        prefix = f"{user_id}:{agent}:"
        keys = [k for k in self._store if k.startswith(prefix)]
        for key in keys:
            del self._store[key]

    def clear(self) -> None:
        self._store.clear()


def hash_data(data: Any) -> str:
    import json
    raw = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


response_cache = ResponseCache(ttl_seconds=int(__import__("os").environ.get("RESPONSE_CACHE_TTL", "300")))
