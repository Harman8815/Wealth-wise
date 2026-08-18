"""
JWT verification middleware for ML-Backend.

Validates the same JWT that ``backend/`` issues (signed with the shared
``JWT_SECRET``) and attaches ``request.state.user_id``.  Public paths
(``/health`` and the duplicate-detection endpoints) are excluded.

No login/signup logic here — ``backend/`` remains the identity source of
truth.
"""
from __future__ import annotations

import os
from typing import Optional

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from jose import JWTError, jwt

ALGORITHM = "HS256"
JWT_SECRET = os.getenv("JWT_SECRET", "")

_PUBLIC_PATHS = {
    "/health",
    "/duplicates",
}


def _is_public(path: str) -> bool:
    for public in _PUBLIC_PATHS:
        if path == public or path.startswith(public + "/"):
            return True
    return False


async def verify_jwt(request: Request, call_next):
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured on the ML-Backend server.",
        )

    if _is_public(request.url.path):
        return await call_next(request)

    auth_header: Optional[str] = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid Authorization header."},
        )

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user_id.")
        request.state.user_id = str(user_id)
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token."},
        )

    response = await call_next(request)
    return response
