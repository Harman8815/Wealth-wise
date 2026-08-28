"""
Chat router — Phase 1 endpoints with persistence.

Phase 2 adds conversation/message persistence.
Phase 3 adds context windowing and summarization.
Phase 5 adds financial tool calling.
"""
from __future__ import annotations

import json
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.requests import ClientDisconnect

from app.context import ContextBudget, get_context_budget
from app.deps import get_user_id
from app.ollama import DEFAULT_CHAT_MODEL, OllamaAdapterError, generate_with_tools, stream
from app.prompt import SYSTEM_PROMPT
from app.schemas.agent_response import StructuredResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.ollama import generate
from app.services.context import build_context
from app.services.conversations import add_message, create_conversation, generate_title, get_conversation
from app.services.summarization import maybe_summarize
from app.services.assistants import answer_budget_question, answer_goal_question
from app.services.intent import classify_intent
from app.services.router import route_intent
from app.services.pipeline import process_response
from app.rate_limit import enforce_rate_limit
from app.logging_utils import get_request_id, log_chat, log_llm_call, log_tool_call, log_validation
from app.schemas.structured_response import StructuredResponse
from app.services.tools import (
    get_balance_tool,
    get_budget_tool,
    get_goals_tool,
    get_income_tool,
    get_profile_tool,
    get_transactions_tool,
    search_transactions_nl,
    get_alerts_tool,
    query_transactions_dynamic,
)
from app.services.alerts_agent import answer_alerts_question
from app.debug_events import DebugEvent, DebugStage, StageStatus, get_debug_store

router = APIRouter(prefix="/chat", tags=["chat"])


def _emit_debug_event(
    request_id: str,
    stage: DebugStage,
    status: StageStatus,
    service: str = "backend",
    route: Optional[str] = None,
    method: Optional[str] = None,
    http_status: Optional[int] = None,
    duration_ms: Optional[float] = None,
    input_data: Optional[Dict[str, Any]] = None,
    output_data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    error_type: Optional[str] = None,
) -> None:
    try:
        store = get_debug_store()
        store.append_event(
            DebugEvent(
                request_id=request_id,
                stage=stage,
                status=status,
                service=service,
                route=route,
                method=method,
                http_status=http_status,
                duration_ms=duration_ms,
                input_data=input_data,
                output_data=output_data,
                error=error,
                error_type=error_type,
            )
        )
    except Exception:
        pass


def _sse_pack(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


def _parse_structured_response(content: str) -> Dict[str, Any]:
    if not content:
        return {"type": "text", "text": ""}
    try:
        data = json.loads(content)
        if isinstance(data, dict) and data.get("type"):
            try:
                validated = StructuredResponse(**data)
                return validated.model_dump()
            except Exception as exc:
                from app.logging_utils import logger as chat_logger
                chat_logger.warning(
                    "structured_response_validation_failed",
                    extra={"content": content[:500], "error": str(exc)},
                )
                return {"type": "markdown", "markdown": content}
        return {"type": "markdown", "markdown": content}
    except Exception:
        return {"type": "text", "text": content}


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
    {
        "type": "function",
        "function": {
            "name": "get_alerts",
            "description": "Get the user's alerts and notifications. Use this when the user asks about alerts, warnings, or notifications.",
            "parameters": {
                "type": "object",
                "properties": {
                    "read": {"type": "boolean", "description": "Filter by read status"},
                    "category": {"type": "string", "description": "Filter by category (Budget, Bills, Goals, Security, Account, Investments, Activity, System, AI)"},
                    "type_": {"type": "string", "description": "Filter by type (warning, info, success, error)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_transactions_dynamic",
            "description": "Search transactions using a structured dynamic query derived from natural language. Supports merchant, date, date range, amount range, category, transaction type, description, and limit.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The user's natural language query about transactions"},
                },
                "required": ["query"],
            },
        },
    },
]


async def _execute_tool_call(name: str, arguments: Dict[str, Any], token: str, user_id: str, conversation_id: Optional[str] = None, message_id: Optional[str] = None) -> str:
    start = time.perf_counter()
    result = None
    status = "success"
    error = None
    output = None
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
        elif name == "get_alerts":
            result = await get_alerts_tool(
                token,
                user_id,
                read=arguments.get("read"),
                category=arguments.get("category"),
                type_=arguments.get("type_"),
            )
        elif name == "query_transactions_dynamic":
            query = arguments.get("query", "")
            result = await query_transactions_dynamic(token, user_id, query)
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
        return json.dumps(result)
    except Exception as exc:  # noqa: BLE001
        status = "error"
        error = str(exc)
        return json.dumps({"error": error})
    finally:
        latency = (time.perf_counter() - start) * 1000
        if output is None:
            try:
                parsed = json.loads(result) if isinstance(result, str) else result
                output = parsed if isinstance(parsed, dict) else {"raw": str(parsed)}
            except Exception:
                output = {"raw": str(result)}
        if status == "error":
            output = {"error": error}
        from app.services.conversations import add_tool_execution
        add_tool_execution(
            user_id=user_id,
            conversation_id=conversation_id or "",
            tool_name=name,
            status=status,
            input_data=arguments,
            output_data=output,
            error=error,
            latency_ms=latency,
            message_id=message_id,
        )


async def _chat_with_tools(
    messages: List[Dict[str, Any]],
    token: str,
    user_id: str,
    model: str = DEFAULT_CHAT_MODEL,
    conversation_id: Optional[str] = None,
    request: Optional[Request] = None,
) -> str:
    current_messages = messages[:]
    for _ in range(5):
        start = time.perf_counter()
        result = await generate_with_tools(current_messages, FINANCIAL_TOOLS, model=model, format="json")
        latency = (time.perf_counter() - start) * 1000
        log_llm_call(
            request_id=get_request_id(request),
            user_id=user_id,
            conversation_id=conversation_id,
            model=model,
            latency_ms=latency,
        )
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
            tool_start = time.perf_counter()
            tool_result = await _execute_tool_call(name, arguments, token, user_id, conversation_id=conversation_id)
            tool_latency = (time.perf_counter() - tool_start) * 1000
            log_tool_call(
                request_id=get_request_id(request),
                user_id=user_id,
                conversation_id=conversation_id,
                tool_name=name,
                latency_ms=tool_latency,
                arguments=arguments,
            )
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
    except ClientDisconnect:
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content="Request cancelled by user.",
        )
        return
    except OllamaAdapterError as exc:
        payload = json.dumps({"error": str(exc)})
        yield _sse_pack("error", payload)
        return
    structured = _parse_structured_response(full_reply)
    add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=structured.get("text") or structured.get("markdown") or full_reply,
    )
    yield _sse_pack("done", json.dumps({"conversation_id": conversation_id, "structured": structured}))


async def _maybe_generate_title(user_id: str, conversation_id: str, user_message: str) -> None:
    from app.services.conversations import get_conversation
    conv = get_conversation(user_id, conversation_id)
    if conv and conv.message_count == 1:
        import re
        if not conv.title or re.match(r"^New Chat(?: \(\d+\))?$", conv.title or ""):
            from app.services.conversations import generate_title, update_conversation
            title = await generate_title(user_message)
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
    _: None = Depends(enforce_rate_limit),
) -> ChatResponse:
    request_id = get_request_id(request)
    _emit_debug_event(request_id, DebugStage.BACKEND_REQUEST, StageStatus.RUNNING, service="backend", route="/chat", method="POST", input_data={"message": body.message})
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=body.conversation_id,
        event="request_received",
        message=body.message,
    )
    conversation_id = body.conversation_id
    if conversation_id:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat", http_status=404, error="Conversation not found")
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
    _emit_debug_event(request_id, DebugStage.DATA_PROCESSING, StageStatus.SUCCESS, service="backend", output_data={"context_messages": len(context_messages)})
    token = _get_token(request)
    try:
        raw_reply = await _chat_with_tools(
            context_messages,
            token=token,
            user_id=user_id,
            model=body.model or DEFAULT_CHAT_MODEL,
            conversation_id=conversation_id,
            request=request,
        )
        _emit_debug_event(request_id, DebugStage.OLLAMA_RESPONSE, StageStatus.SUCCESS, service="backend", output_data={"reply_length": len(raw_reply)})
        structured = _parse_structured_response(raw_reply)
        _emit_debug_event(request_id, DebugStage.RESPONSE_PARSING, StageStatus.SUCCESS, service="backend", output_data={"type": structured.get("type")})
        reply = structured.get("text") or structured.get("markdown") or raw_reply
        if structured.get("type") in ("text", "markdown"):
            reply = process_response(reply)
        add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=body.message,
        )
        await _maybe_generate_title(user_id, conversation_id, body.message)
        assistant_msg = add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=reply,
            structured_data=structured if structured.get("type") != "text" else None,
            extra_data={"model": body.model or DEFAULT_CHAT_MODEL},
        )
        _emit_debug_event(request_id, DebugStage.FRONTEND_RENDER, StageStatus.SUCCESS, service="backend", output_data={"reply": reply})
        log_chat(
            request_id=request_id,
            user_id=user_id,
            conversation_id=conversation_id,
            event="response_generated",
            response=reply,
        )
        _emit_debug_event(request_id, DebugStage.BACKEND_REQUEST, StageStatus.SUCCESS, service="backend", route="/chat", http_status=200)
        return ChatResponse(reply=reply, model=body.model or DEFAULT_CHAT_MODEL, conversation_id=conversation_id, structured=structured)
    except OllamaAdapterError as exc:
        _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat", http_status=502, error=str(exc), error_type="OllamaAdapterError")
        log_chat(
            request_id=request_id,
            user_id=user_id,
            conversation_id=conversation_id,
            event="error",
            error=str(exc),
        )
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat", http_status=500, error=str(exc), error_type=type(exc).__name__)
        raise


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    request: Request,
    user_id: str = Depends(get_user_id),
    _: None = Depends(enforce_rate_limit),
) -> StreamingResponse:
    request_id = get_request_id(request)
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=body.conversation_id,
        event="stream_request_received",
        message=body.message,
    )
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


@router.post("/goal-planning")
async def goal_planning(request: Request, user_id: str = Depends(get_user_id), _: None = Depends(enforce_rate_limit)):
    request_id = get_request_id(request)
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="goal_planning_request",
    )
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ")[1]
    body = await request.json()
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Missing question.")
    answer = await answer_goal_question(token, user_id, question)
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="goal_planning_response",
        response=answer,
    )
    return {"answer": answer}


@router.post("/budget-planning")
async def budget_planning(request: Request, user_id: str = Depends(get_user_id), _: None = Depends(enforce_rate_limit)):
    request_id = get_request_id(request)
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="budget_planning_request",
    )
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ")[1]
    body = await request.json()
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Missing question.")
    answer = await answer_budget_question(token, user_id, question)
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="budget_planning_response",
        response=answer,
    )
    return {"answer": answer}


@router.post("/db/refresh")
async def refresh_db_context():
    """Refresh the database schema context."""
    from app.services.db_context import refresh_database_context
    context = refresh_database_context()
    return {
        "status": "refreshed",
        "table_count": context.get("table_count", 0),
        "database_type": context.get("database_type", ""),
    }


@router.post("/agent")
async def agent_chat(request: Request, user_id: str = Depends(get_user_id), _: None = Depends(enforce_rate_limit)):
    request_id = get_request_id(request)
    _emit_debug_event(request_id, DebugStage.BACKEND_REQUEST, StageStatus.RUNNING, service="backend", route="/chat/agent", method="POST", input_data={"message": body.get("message"), "agent": body.get("agent")})
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="agent_request_received",
        message=None,
    )
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat/agent", http_status=401, error="Missing or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ")[1]
    body = await request.json()
    message = body.get("message", "")
    if not message:
        _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat/agent", http_status=400, error="Missing message")
        raise HTTPException(status_code=400, detail="Missing message.")
    agent_name = body.get("agent")
    if agent_name:
        from app.services.agents import get_agent
        agent_entry = get_agent(agent_name)
        if not agent_entry:
            _emit_debug_event(request_id, DebugStage.ERROR, StageStatus.ERROR, service="backend", route="/chat/agent", http_status=400, error=f"Unknown agent: {agent_name}")
            raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_name}")
        slash_command = agent_entry.get("slash_command", f"/{agent_name}")
        if message.startswith(slash_command):
            message = message[len(slash_command):].strip()
        intent_value = agent_entry.get("intent", agent_name)
        from app.services.intent import Intent
        try:
            intent = Intent(intent_value)
        except ValueError:
            intent = Intent.GENERAL_CHAT
    else:
        _emit_debug_event(request_id, DebugStage.INTENT_DETECTION, StageStatus.RUNNING, service="backend")
        intent = await classify_intent(message)
        _emit_debug_event(request_id, DebugStage.INTENT_DETECTION, StageStatus.SUCCESS, service="backend", output_data={"intent": intent.value})
    _emit_debug_event(request_id, DebugStage.AGENT_SELECTION, StageStatus.SUCCESS, service="backend", output_data={"agent": agent_name or "auto", "intent": intent.value})
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="agent_selected",
        agent=agent_name or "auto",
        intent=intent.value,
    )
    _emit_debug_event(request_id, DebugStage.BACKEND_REQUEST, StageStatus.SUCCESS, service="backend", route="/chat/agent", http_status=200)
    routed = await route_intent(intent, token, user_id, message)
    response = routed.get("response") or ""
    if not response.strip():
        response = "I'm not sure how to help with that. Could you rephrase?"
        fallback = True
    else:
        fallback = routed.get("fallback", False)
    _emit_debug_event(request_id, DebugStage.FRONTEND_RENDER, StageStatus.SUCCESS, service="backend", output_data={"response": response})
    log_chat(
        request_id=request_id,
        user_id=user_id,
        conversation_id=None,
        event="agent_response_generated",
        agent=agent_name or "auto",
        intent=intent.value,
        response=response,
    )
    return {
        "intent": routed["intent"],
        "response": response,
        "data": routed.get("data"),
        "filters": routed.get("filters"),
        "fallback": fallback,
    }
