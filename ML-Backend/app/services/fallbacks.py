"""
Pre-written fallback messages for ML-Backend agent services.

These are used when validation fails or Ollama is unavailable, so the
user always gets a coherent response instead of raw error text.
"""
from __future__ import annotations

FALLBACKS: Dict[str, str] = {
    "no_insights_data": (
        "No insights are available yet. Keep using the app and I'll generate "
        "personalized insights based on your activity."
    ),
    "malformed_insights_data": (
        "I couldn't read your insights data right now. Please try again later."
    ),
    "no_alerts_data": (
        "You have no active alerts right now. I'll notify you if anything needs attention."
    ),
    "malformed_alerts_data": (
        "I couldn't read your alerts data right now. Please try again later."
    ),
    "no_transactions_data": (
        "No transactions found for that query. Try adjusting the filters or time period."
    ),
    "malformed_transactions_data": (
        "I couldn't read your transactions data right now. Please try again later."
    ),
    "partial_transactions_data": (
        "I found some transactions but the data is incomplete. Showing what I have — "
        "some fields may be missing."
    ),
    "no_budget_data": (
        "No budget data is available yet. Set up a budget to get personalized guidance."
    ),
    "malformed_budget_data": (
        "I couldn't read your budget data right now. Please try again later."
    ),
    "no_goals_data": (
        "No goals found. Create a savings goal to get started."
    ),
    "malformed_goals_data": (
        "I couldn't read your goals data right now. Please try again later."
    ),
    "partial_profile_data": (
        "Your profile looks incomplete. Some details may be missing."
    ),
    "malformed_profile_data": (
        "I couldn't read your profile data right now. Please try again later."
    ),
    "ollama_unavailable": (
        "The AI assistant is temporarily unavailable. Please try again in a moment."
    ),
    "ambiguous_query": (
        "Could you clarify? Are you asking about your budget, goals, transactions, or alerts?"
    ),
    "empty_response": (
        "I couldn't generate a response. Please try rephrasing your question."
    ),
    "invalid_token": (
        "Your session has expired. Please log in again."
    ),
}


def get_fallback(error_key: str) -> str:
    return FALLBACKS.get(error_key, FALLBACKS["empty_response"])
