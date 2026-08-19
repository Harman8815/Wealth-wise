"""
FastAPI application entry-point for ML-Backend.

Serves two surfaces today:
- Duplicate transaction detection (stateless, called by Django backend).
- Chat + AI endpoints (auth-protected, Phase 1+).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .middleware import verify_jwt
from .ollama import OllamaAdapterError
from .routers import chat_router, conversations_router, duplicates_router, memory_router, reports_router

logger = logging.getLogger("ml_backend")

app = FastAPI(
    title="WealthWise ML-Backend",
    description="FastAPI service for AI chat, Ollama orchestration, and duplicate detection.",
    version="0.1.0",
)

app.include_router(duplicates_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(reports_router)

app.middleware("http")(verify_jwt)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(OllamaAdapterError)
async def ollama_error_handler(request: Request, exc: OllamaAdapterError):
    logger.error("Ollama error: %s", exc)
    return JSONResponse(
        status_code=502,
        content={"detail": "The AI service is temporarily unavailable. Please try again."},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )
