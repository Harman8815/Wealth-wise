"""
FastAPI router package for ML-Backend.
"""
from .chat import router as chat_router
from .duplicates import router as duplicates_router

__all__ = ["chat_router", "duplicates_router"]
