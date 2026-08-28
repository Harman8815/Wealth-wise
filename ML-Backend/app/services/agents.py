"""
Centralized agent registry for ML-Backend.

Defines all available agents with their metadata, input schemas, and handlers.
This registry is importable by the frontend or other consumers to discover
available agents dynamically.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.assistants import answer_budget_question, answer_goal_question
from app.services.insights_agent import answer_insights_question
from app.services.reports import build_report
from app.services.tools import search_transactions_nl


AGENT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "report": {
        "name": "report",
        "slash_command": "/report",
        "description": "Generate a comprehensive financial report with income, expenses, savings rate, and goal progress.",
        "intent": "report",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's message or question"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "chart_alert": {
        "name": "chart_alert",
        "slash_command": "/explain",
        "description": "Explain charts, alerts, or financial visualizations in plain language.",
        "intent": "chart_alert",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's message or question about a chart/alert"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "alert": {
        "name": "alert",
        "slash_command": "/alert",
        "description": "Explain financial alerts in plain language.",
        "intent": "chart_alert",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's message or question about alerts"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "goal": {
        "name": "goal",
        "slash_command": "/goal",
        "description": "Get help with financial goal planning, tracking progress, and projections.",
        "intent": "goal",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's question about goals"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "budget": {
        "name": "budget",
        "slash_command": "/budget",
        "description": "Get budget analysis, variance reports, and actionable budget recommendations.",
        "intent": "budget",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's question about budgets"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "transaction_search": {
        "name": "transaction_search",
        "slash_command": "/search",
        "description": "Search transactions using natural language queries.",
        "intent": "transaction_search",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's natural language query about transactions"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "route_intent",
        "registered_at": "2026-08-22",
    },
    "insights": {
        "name": "insights",
        "slash_command": "/insights",
        "description": "Get AI-generated financial insights and analysis based on your spending patterns.",
        "intent": "insights",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's question about insights"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "answer_insights_question",
    },
    "general_chat": {
        "name": "general_chat",
        "slash_command": "/chat",
        "description": "General financial assistant chat without specialized tools.",
        "intent": "general_chat",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's message"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "fallback",
    },
    "db_context": {
        "name": "db_context",
        "slash_command": "/db",
        "description": "Inspect the database schema, tables, columns, and relationships.",
        "intent": "db_context",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The user's question about the database"},
                "conversation_id": {"type": "string", "description": "Optional conversation ID for context"},
            },
            "required": ["message"],
        },
        "handler": "answer_database_question",
    },
}


def get_agent(name: str) -> Optional[Dict[str, Any]]:
    if name in AGENT_REGISTRY:
        return AGENT_REGISTRY[name]
    alias = {
        "search": "transaction_search",
        "insights": "insights",
        "report": "report",
        "alert": "alert",
        "chart_alert": "chart_alert",
        "goal": "goal",
        "budget": "budget",
        "chat": "general_chat",
        "db": "db_context",
    }
    resolved = alias.get(name)
    if resolved and resolved in AGENT_REGISTRY:
        return AGENT_REGISTRY[resolved]
    return None


def list_agents() -> list[Dict[str, Any]]:
    return [
        {
            "name": agent["name"],
            "slash_command": agent["slash_command"],
            "description": agent["description"],
            "intent": agent["intent"],
            "input_schema": agent["input_schema"],
        }
        for agent in AGENT_REGISTRY.values()
    ]
