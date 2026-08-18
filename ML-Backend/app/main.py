"""
FastAPI application entry-point for ML-Backend.

Serves two surfaces today:
- Duplicate transaction detection (stateless, called by Django backend).
- Chat + AI endpoints (auth-protected, Phase 1+).
"""
from __future__ import annotations

from fastapi import FastAPI

from .middleware import verify_jwt
from .routers import chat_router, duplicates_router

app = FastAPI(
    title="WealthWise ML-Backend",
    description="FastAPI service for AI chat, Ollama orchestration, and duplicate detection.",
    version="0.1.0",
)

app.include_router(duplicates_router)
app.include_router(chat_router)

app.middleware("http")(verify_jwt)


@app.get("/health")
def health():
    return {"status": "ok"}
