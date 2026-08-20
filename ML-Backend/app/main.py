"""
FastAPI application entry-point for ML-Backend.

Serves two surfaces today:
- Duplicate transaction detection (stateless, called by Django backend).
- Chat + AI endpoints (auth-protected, Phase 1+).
"""
from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .logging_utils import get_request_id, log_error, log_request
from .middleware import verify_jwt
from .ollama import OllamaAdapterError
from .routers import chat_router, conversations_router, duplicates_router, memory_router, reports_router

logger = logging.getLogger("ml_backend")

app = FastAPI(
    title="WealthWise ML-Backend",
    description="FastAPI service for AI chat, Ollama orchestration, and duplicate detection.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(duplicates_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(reports_router)

app.middleware("http")(verify_jwt)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    latency = (time.perf_counter() - start) * 1000
    log_request(
        request_id=get_request_id(request),
        user_id=getattr(request.state, "user_id", None),
        path=request.url.path,
        method=request.method,
        status_code=response.status_code,
        latency_ms=latency,
    )
    return response


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(OllamaAdapterError)
async def ollama_error_handler(request: Request, exc: OllamaAdapterError):
    log_error(
        request_id=get_request_id(request),
        user_id=getattr(request.state, "user_id", None),
        error=str(exc),
    )
    return JSONResponse(
        status_code=502,
        content={"detail": "The AI service is temporarily unavailable. Please try again."},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    log_error(
        request_id=get_request_id(request),
        user_id=getattr(request.state, "user_id", None),
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )
