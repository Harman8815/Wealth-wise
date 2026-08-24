"""
Intent classifier for ML-Backend.

Classifies a user message into one of the supported intent categories:
- report
- chart/alert
- goal
- budget
- transaction_search
- general_chat
"""
from __future__ import annotations

from enum import Enum
from typing import Dict

from app.ollama import DEFAULT_CHAT_MODEL, generate
from app.logging_utils import log_chat


class Intent(str, Enum):
    REPORT = "report"
    CHART_ALERT = "chart_alert"
    GOAL = "goal"
    BUDGET = "budget"
    TRANSACTION_SEARCH = "transaction_search"
    TRANSACTION_QUERY = "transaction_query"
    INSIGHTS = "insights"
    DB_CONTEXT = "db_context"
    ALERTS = "alerts"
    GENERAL_CHAT = "general_chat"


INTENT_CLASSIFIER_PROMPT = (
    "You are an intent classifier for a financial assistant. "
    "Classify the user's message into exactly one of these categories:\n"
    "- report: user wants a financial report or summary\n"
    "- chart_alert: user wants explanation of charts or alerts\n"
    "- goal: user is asking about financial goals or goal planning\n"
    "- budget: user is asking about budgets or budget planning\n"
    "- transaction_search: user is searching for transactions with simple filters\n"
    "- transaction_query: user is asking for specific transaction details, merchant lookups, date-specific transactions, or amount-filtered transactions\n"
    "- insights: user wants financial insights or AI-generated analysis\n"
    "- db_context: user is asking about database schema, tables, columns, or relationships\n"
    "- alerts: user is asking about alerts, notifications, warnings, or unusual activity\n"
    "- general_chat: everything else\n\n"
    "Return ONLY the category name, nothing else."
)


async def classify_intent(message: str) -> Intent:
    result = await generate(
        [
            {"role": "system", "content": INTENT_CLASSIFIER_PROMPT},
            {"role": "user", "content": message},
        ],
        model=DEFAULT_CHAT_MODEL,
        stream=False,
    )
    content = result.get("message", {}).get("content", "").strip().lower()
    try:
        intent = Intent(content)
        log_chat(
            request_id="",
            user_id=None,
            conversation_id=None,
            event="intent_classified",
            message=message,
            intent=intent.value,
        )
        return intent
    except ValueError:
        log_chat(
            request_id="",
            user_id=None,
            conversation_id=None,
            event="intent_classification_failed",
            message=message,
            intent="general_chat",
        )
        return Intent.GENERAL_CHAT
