"""
Report and explanation endpoints for ML-Backend.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from app.deps import get_user_id
from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.services.reports import build_report, build_report_sections, explain_chart_or_alert

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate")
async def generate_report(request: Request, user_id: str = Depends(get_user_id)):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ")[1]
    report = await build_report(token, user_id)
    return report


@router.get("/summary")
async def report_summary(request: Request, user_id: str = Depends(get_user_id)):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ")[1]
    sections = await build_report_sections(token, user_id)
    return sections


@router.post("/explain")
async def explain_chart_or_alert(request: Request, user_id: str = Depends(get_user_id)):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    body = await request.json()
    data = body.get("data", {})
    explanation = await explain_chart_or_alert(data)
    return {"explanation": explanation}

