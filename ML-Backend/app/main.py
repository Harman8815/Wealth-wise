"""
FastAPI application entry-point for the Duplicate Transaction Detection service.

Stateless / compute-only: receives candidate transaction records in request
bodies and returns duplicate groups / scores. It never touches a database or
requires authentication — the Django backend is the only caller and owns auth,
project scoping, and persistence.
"""
from __future__ import annotations

from fastapi import FastAPI

from .routers import duplicates

app = FastAPI(
    title="WealthWise Duplicate Detection",
    description="TF-IDF + cosine similarity duplicate-transaction detection microservice.",
    version="1.0.0",
)

app.include_router(duplicates.router)


@app.get("/health")
def health():
    return {"status": "ok"}
