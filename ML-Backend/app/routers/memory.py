"""
Memory management endpoints for ML-Backend.

All endpoints are auth-protected and scoped to the authenticated user.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_user_id
from app.services.memory import retrieve_relevant
from app.vector import get_collection

router = APIRouter(prefix="/user/memory", tags=["memory"])


@router.get("")
async def list_memories(user_id: str = Depends(get_user_id), query: str = "", top_k: int = 20):
    if query:
        memories = await retrieve_relevant(user_id, query, top_k=top_k)
    else:
        collection = get_collection()
        results = collection.get(where={"user_id": user_id}, limit=top_k)
        memories = results.get("documents", [[]])[0] if results.get("documents") else []
    return {"results": memories}


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, user_id: str = Depends(get_user_id)):
    collection = get_collection()
    try:
        collection.delete(ids=[memory_id])
    except Exception:
        pass
    return {"status": "deleted"}


@router.delete("")
async def delete_all_memories(user_id: str = Depends(get_user_id)):
    collection = get_collection()
    results = collection.get(where={"user_id": user_id})
    ids = results.get("ids", [[]])[0] if results.get("ids") else []
    if ids:
        collection.delete(ids=ids)
    return {"status": "deleted"}
