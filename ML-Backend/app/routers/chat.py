"""
Chat router — Phase 1 endpoints with persistence.

Phase 2 adds conversation/message persistence.
Phase 3 adds context windowing and summarization.
Phase 5 adds financial tool calling.
"""
from __future__ import annotations

import json
from typing import Any, AsyncGenerator, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.context import ContextBudget, get_context_budget
from app.deps import get_user_id
from app.ollama import DEFAULT_CHAT_MODEL, OllamaAdapterError, generate_with_tools, stream
from app.prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse
from app.ollama import generate
from app.services.context import build_context
from app.services.conversations import add_message, create_conversation, generate_title, get_conversation
from app.services.summarization import maybe_summarize
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_profile_tool,
    get_transactions_tool,
    search_transactions_nl,
)

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse_pack(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


FINANCIAL_TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "Get the user's transactions with optional filters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Category name or ID"},
                    "type_": {"type": "string", "enum": ["income", "expense"], "description": "Transaction type"},
                    "start_date": {"type": "string", "description": "Start date YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "End date YYYY-MM-DD"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_balance",
            "description": "Get the user's account balance summary.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget",
            "description": "Get the user's budget categories.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_income",
            "description": "Get the user's income transactions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Start date YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "End date YYYY-MM-DD"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_goals",
            "description": "Get the user's financial goals.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_transactions_nl",
            "description": "Search transactions using natural language. Use this when the user asks about spending, expenses, or transactions in plain language.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The user's natural language query about transactions"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_profile",
            "description": "Get the user's profile information.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


async def _execute_tool_call(name: str, arguments: Dict[str, Any], token: str, user_id: str) -> str:
    try:
        if name == "get_transactions":
            result = await get_transactions_tool(
                token,
                user_id,
                category=arguments.get("category"),
                type_=arguments.get("type_"),
                start_date=arguments.get("start_date"),
                end_date=arguments.get("end_date"),
            )
        elif name == "get_balance":
            result = await get_balance_tool(token, user_id)
        elif name == "get_budget":
            result = await get_budget_tool(token, user_id)
        elif name == "get_income":
            result = await get_income_tool(
                token,
                user_id,
                start_date=arguments.get("start_date"),
                end_date=arguments.get("end_date"),
            )
        elif name == "get_goals":
            result = await get_goals_tool(token, user_id)
        elif name == "get_profile":
            result = await get_profile_tool(token, user_id)
        elif name == "search_transactions_nl":
            query = arguments.get("query", "")
            result = await search_transactions_nl(token, user_id, query)
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
        return json.dumps(result)
    except Exception as exc:  # noqa: BLE001
        return json.dumps({"error": str(exc)})


async def _chat_with_tools(
    messages: List[Dict[str, Any]],
    token: str,
    user_id: str,
    model: str = DEFAULT_CHAT_MODEL,
) -> str:
    current_messages = messages[:]
    for _ in range(5):
        result = await generate_with_tools(current_messages, FINANCIAL_TOOLS, model=model)
        message = result.get("message", {})
        content = message.get("content", "")
        tool_calls = message.get("tool_calls", [])

        if not tool_calls:
            return content

        current_messages.append({"role": "assistant", "content": content, "tool_calls": tool_calls})

        for tool_call in tool_calls:
            function = tool_call.get("function", {})
            name = function.get("name", "")
            arguments = function.get("arguments", {})
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    arguments = {}
            tool_result = await _execute_tool_call(name, arguments, token, user_id)
            current_messages.append({
                "role": "tool",
                "content": tool_result,
                "tool_call_id": tool_call.get("id", ""),
            })

    return current_messages[-1].get("content", "")


async def _ollama_stream_to_sse(
    messages: list[dict],
    *,
    model: str,
    user_id: str,
    conversation_id: str,
    token: str,
) -> AsyncGenerator[str, None]:
    full_reply = ""
    try:
        async for token in stream(messages, model=model):
            full_reply += token
            payload = json.dumps({"token": token})
            yield _sse_pack("token", payload)
    except OllamaAdapterError as exc:
        payload = json.dumps({"error": str(exc)})
        yield _sse_pack("error", payload)
        return
    yield _sse_pack("done", json.dumps({"conversation_id": conversation_id}))
    add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=full_reply,
    )


def _maybe_generate_title(user_id: str, conversation_id: str, user_message: str) -> None:
    from app.services.conversations import get_conversation
    conv = get_conversation(user_id, conversation_id)
    if conv and not conv.title and conv.message_count == 1:
        title = generate_title(user_message)
        from app.services.conversations import update_conversation
        update_conversation(conversation_id, title=title)


def _get_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    return auth_header.split(" ")[1]


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    request: Request,
    user_id: str = Depends(get_user_id),
) -> ChatResponse:
    conversation_id = body.conversation_id
    if conversation_id:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conv = create_conversation(user_id=user_id)
        conversation_id = str(conv.id)

    context_messages = await build_context(
        user_id=user_id,
        conversation_id=conversation_id,
        question=body.message,
        budget=get_context_budget(),
    )
    token = _get_token(request)
    try:
        reply = await _chat_with_tools(
            context_messages,
            token=token,
            user_id=user_id,
            model=body.model or DEFAULT_CHAT_MODEL,
        )
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=body.message,
        )
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=reply,
        )
        _maybe_generate_title(user_id, conversation_id, body.message)
        return ChatResponse(reply=reply, model=body.model or DEFAULT_CHAT_MODEL, conversation_id=conversation_id)
    except OllamaAdapterError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    request: Request,
    user_id: str = Depends(get_user_id),
) -> StreamingResponse:
    conversation_id = body.conversation_id
    if conversation_id:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conv = create_conversation(user_id=user_id)
        conversation_id = str(conv.id)

    add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=body.message,
    )

    context_messages = await build_context(
        user_id=user_id,
        conversation_id=conversation_id,
        question=body.message,
        budget=get_context_budget(),
    )
    token = _get_token(request)
    return StreamingResponse(
        _ollama_stream_to_sse(context_messages, model=body.model or DEFAULT_CHAT_MODEL, user_id=user_id, conversation_id=conversation_id, token=token),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
