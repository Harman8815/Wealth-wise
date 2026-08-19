"""
API contract tests for the duplicate-detection service and chat endpoints.
"""
import sys
import os

os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from app.db import SessionLocal, init_db
from app.main import app
from app.models import Conversation, Message

client = TestClient(app)


def _auth_header(user_id: str) -> dict:
    from jose import jwt
    from app.middleware import ALGORITHM, JWT_SECRET

    token = jwt.encode({"user_id": user_id}, JWT_SECRET, algorithm=ALGORITHM)
    return {"Authorization": f"Bearer {token}"}


def _setup_db():
    init_db()
    db = SessionLocal()
    try:
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.commit()
    finally:
        db.close()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_scan_endpoint():
    body = {
        "transactions": [
            {"id": "a", "date": "2024-01-05", "amount": 2500.0, "description": "Swiggy order 1234", "type": "expense"},
            {"id": "b", "date": "2024-01-06", "amount": 2500.0, "description": "SWIGGY ORDER 1234", "type": "expense"},
        ]
    }
    resp = client.post("/duplicates/scan", json=body)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["groups"]) == 1
    assert data["groups"][0]["matches"][0]["confidence"] == "high"


def test_score_batch_endpoint():
    body = {
        "candidate": {"id": "new", "date": "2024-02-01", "amount": 1200.0, "description": "Zomato 9981", "type": "expense"},
        "existing": [
            {"id": "x", "date": "2024-02-02", "amount": 1200.0, "description": "ZOMATO 9981", "type": "expense"}
        ],
    }
    resp = client.post("/duplicates/score-batch", json=body)
    assert resp.status_code == 200
    assert len(resp.json()["matches"]) == 1


def test_scan_too_large():
    body = {
        "transactions": [
            {"id": str(i), "date": "2024-01-05", "amount": 10.0, "description": "x", "type": "expense"}
            for i in range(50001)
        ]
    }
    resp = client.post("/duplicates/scan", json=body)
    assert resp.status_code == 413


def test_create_chat_creates_conversation():
    _setup_db()
    resp = client.post("/chat", json={"message": "Hello"}, headers=_auth_header("u1"))
    assert resp.status_code == 200
    data = resp.json()
    assert "conversation_id" in data
    assert data["reply"]


def test_list_chats_returns_only_own():
    _setup_db()
    client.post("/chat", json={"message": "Hi A"}, headers=_auth_header("u1"))
    client.post("/chat", json={"message": "Hi B"}, headers=_auth_header("u2"))

    resp = client.get("/chats", headers=_auth_header("u1"))
    assert resp.status_code == 200
    titles = [c["title"] for c in resp.json()["results"]]
    assert all("u1" in t or not t for t in titles)


def test_delete_chat():
    _setup_db()
    create_resp = client.post("/chat", json={"message": "Bye"}, headers=_auth_header("u1"))
    conv_id = create_resp.json()["conversation_id"]

    resp = client.delete(f"/chats/{conv_id}", headers=_auth_header("u1"))
    assert resp.status_code == 200

    resp2 = client.get(f"/chats/{conv_id}", headers=_auth_header("u1"))
    assert resp2.status_code == 404
