"""
Embedded Chroma vector store for ML-Backend.

Persists to ``ML-Backend/data/chroma`` by default. Uses a single
collection ``memories`` with ``user_id`` stored as metadata so every
query can be scoped to the authenticated user.
"""
from __future__ import annotations

import os
from pathlib import Path

import chromadb
from chromadb.config import Settings

CHROMA_DIR = os.getenv("CHROMA_DIR", "data/chroma")
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "memories")


def _client() -> chromadb.Client:
    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
    return chromadb.Client(Settings(chroma_db_impl="duckdb+parquet", persist_directory=CHROMA_DIR))


def get_collection():
    client = _client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
