"""
Secrets audit tests for ML-Backend.

Verifies that no backend credentials or secrets ever reach the LLM context.
"""
import os
import sys

os.environ.setdefault("JWT_SECRET", "test-secret")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch

from app.main import app
from app.middleware import JWT_SECRET
from fastapi.testclient import TestClient
from tests.test_api import _auth_header, _setup_db

client = TestClient(app)


@patch("app.routers.chat.generate_with_tools")
def test_jwt_secret_never_reaches_llm(mock_generate_with_tools):
    mock_generate_with_tools.return_value = {"message": {"content": "ok"}, "model": "test"}
    _setup_db()
    client.post("/chat", json={"message": "hello"}, headers=_auth_header("u1"))
    call_args = mock_generate_with_tools.call_args
    if call_args.kwargs:
        messages = call_args.kwargs.get("messages", [])
    else:
        messages = call_args[0][0] if call_args[0] else []
    all_text = " ".join(m.get("content", "") if isinstance(m, dict) else str(m) for m in messages)
    assert JWT_SECRET not in all_text
    assert "test-secret" not in all_text


@patch("app.routers.chat.generate_with_tools")
def test_bearer_token_never_reaches_llm(mock_generate_with_tools):
    mock_generate_with_tools.return_value = {"message": {"content": "ok"}, "model": "test"}
    _setup_db()
    token = _auth_header("u1")["Authorization"]
    client.post("/chat", json={"message": "hello"}, headers=_auth_header("u1"))
    call_args = mock_generate_with_tools.call_args
    if call_args.kwargs:
        messages = call_args.kwargs.get("messages", [])
    else:
        messages = call_args[0][0] if call_args[0] else []
    all_text = " ".join(m.get("content", "") if isinstance(m, dict) else str(m) for m in messages)
    assert token not in all_text
    assert "Bearer" not in all_text
