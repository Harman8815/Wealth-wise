"""
FastAPI dependencies for ML-Backend.
"""
from __future__ import annotations

from fastapi import Request, HTTPException


def get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user_id
