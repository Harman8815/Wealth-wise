"""
SQLAlchemy database setup for ML-Backend.

Uses a local SQLite file under ``data/ml_backend.db`` by default.
Call ``init_db()`` on app startup to create tables (Phase 2+).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./data/ml_backend.db",
)

# Ensure the data directory exists for SQLite file URLs.
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create all tables. Call this once on startup or in migrations."""
    from app import models  # noqa: F401  # ensure models are imported
    Base.metadata.create_all(bind=engine)
