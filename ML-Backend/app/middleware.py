"""
JWT verification middleware for ML-Backend.

Validates the token that ``backend/`` issued by forwarding it to the Django
``/api/users/me/`` endpoint.  Django is the single source of auth truth —
it handles token expiry, rotation, blacklisting, and user-state centrally.

This avoids the fragile shared-secret approach: no need to keep JWT_SECRET
in sync, no risk of library incompatibilities between PyJWT (Django) and
python-jose (ML-Backend), and no stale-token edge cases.

No login/signup logic here — ``backend/`` remains the identity source of
truth.
"""
from __future__ import annotations

import os
import uuid
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import Request
from fastapi.responses import JSONResponse

# Load .env before reading any env vars so the module-level defaults are
# populated even when this module is imported before db.py.
load_dotenv()

# Read lazily at call-time (inside the function) so that test overrides and
# late load_dotenv() calls are always honoured.
_BACKEND_API_URL_DEFAULT = "http://localhost:8000/api"

_PUBLIC_PATHS = {
    "/health",
    "/duplicates",
}


def _is_public(path: str) -> bool:
    for public in _PUBLIC_PATHS:
        if path == public or path.startswith(public + "/"):
            return True
    return False


async def _get_user_id_from_django(token: str) -> Optional[str]:
    """
    Validate ``token`` against Django's ``/api/users/me/`` endpoint.

    Returns the user's ``id`` (UUID string) on success, or ``None`` if the
    token is invalid, expired, or Django is unreachable.
    """
    backend_url = os.getenv("BACKEND_API_URL", _BACKEND_API_URL_DEFAULT)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{backend_url}/users/me/",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                },
            )
        if resp.status_code == 200:
            data = resp.json()
            # Django UserSerializer exposes the PK as "id"
            user_id = data.get("id")
            return str(user_id) if user_id else None
        return None
    except httpx.RequestError:
        # Django backend is unreachable — fail closed.
        return None


async def verify_jwt(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())

    # CORS preflight requests are browser-generated and never carry an
    # Authorization header.  Pass them through so CORSMiddleware (the
    # outermost layer) can respond with the correct CORS headers.
    if request.method == "OPTIONS":
        return await call_next(request)

    if _is_public(request.url.path):
        return await call_next(request)

    auth_header: Optional[str] = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid Authorization header."},
        )

    token = auth_header.split(" ", 1)[1]
    user_id = await _get_user_id_from_django(token)

    if not user_id:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token."},
        )

    request.state.user_id = user_id
    return await call_next(request)
