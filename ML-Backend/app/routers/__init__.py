"""
FastAPI router package for ML-Backend.
"""
from .chat import router as chat_router
from .conversations import router as conversations_router
from .duplicates import router as duplicates_router
from .memory import router as memory_router

__all__ = ["chat_router", "conversations_router", "duplicates_router", "memory_router"]
