"""
Tests for in-memory rate limiting.
"""
import os
import sys

os.environ.setdefault("JWT_SECRET", "test-secret")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rate_limit import RateLimiter, chat_rate_limiter
from tests.test_api import _auth_header, _setup_db


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    chat_rate_limiter._buckets.clear()
    yield
    chat_rate_limiter._buckets.clear()


@pytest.fixture()
def client():
    return TestClient(app)


@patch("app.routers.chat.generate_with_tools")
def test_rate_limit_exceeds_returns_429(mock_generate_with_tools, client):
    mock_generate_with_tools.return_value = {"message": {"content": "ok"}, "model": "test"}
    _setup_db()
    strict_limiter = RateLimiter(rate=1.0, per=60.0, max_burst=1)
    import app.rate_limit as rate_limit_module
    original_limiter = rate_limit_module.chat_rate_limiter
    rate_limit_module.chat_rate_limiter = strict_limiter
    try:
        headers = _auth_header("u1")
        resp = client.post("/chat", json={"message": "hi"}, headers=headers)
        assert resp.status_code == 200
        resp = client.post("/chat", json={"message": "hi"}, headers=headers)
        assert resp.status_code == 429
    finally:
        rate_limit_module.chat_rate_limiter = original_limiter
