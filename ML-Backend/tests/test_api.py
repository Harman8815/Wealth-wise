"""
API contract tests for the duplicate-detection service.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
