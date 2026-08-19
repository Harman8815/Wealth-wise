"""
Tests for agent router.
"""
import asyncio
from unittest.mock import patch

from app.services.intent import Intent
from app.services.router import route_intent


@patch("app.services.intent.classify_intent")
@patch("app.services.router.search_transactions_nl")
def test_route_transaction_search(mock_search, mock_classify):
    mock_classify.return_value = Intent.TRANSACTION_SEARCH
    mock_search.return_value = {"data": {"results": [{"id": "1"}]}, "filters": {}}
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.TRANSACTION_SEARCH, "token", "u1", "Find grocery transactions")
    )
    assert result["intent"] == "transaction_search"
    assert "Found 1 transactions" in result["response"]


@patch("app.services.intent.classify_intent")
@patch("app.services.router.answer_goal_question")
def test_route_goal(mock_answer_goal, mock_classify):
    mock_classify.return_value = Intent.GOAL
    mock_answer_goal.return_value = "You will reach your goal in 12 months."
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.GOAL, "token", "u1", "When will I reach my goal?")
    )
    assert result["intent"] == "goal"
    assert "12 months" in result["response"]


@patch("app.services.intent.classify_intent")
@patch("app.services.router.answer_budget_question")
def test_route_budget(mock_answer_budget, mock_classify):
    mock_classify.return_value = Intent.BUDGET
    mock_answer_budget.return_value = "You are under budget by ₹200."
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.BUDGET, "token", "u1", "How is my budget?")
    )
    assert result["intent"] == "budget"
    assert "under budget" in result["response"]


@patch("app.services.intent.classify_intent")
@patch("app.services.router.build_report")
def test_route_report(mock_build_report, mock_classify):
    mock_classify.return_value = Intent.REPORT
    mock_build_report.return_value = {"narrative": "Your report is ready.", "sections": {}}
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.REPORT, "token", "u1", "Generate a report")
    )
    assert result["intent"] == "report"
    assert "report is ready" in result["response"]


@patch("app.services.intent.classify_intent")
@patch("app.services.router.explain_chart_or_alert")
def test_route_chart_alert(mock_explain, mock_classify):
    mock_classify.return_value = Intent.CHART_ALERT
    mock_explain.return_value = "Your expenses are 20% over budget."
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.CHART_ALERT, "token", "u1", "Explain my expense chart")
    )
    assert result["intent"] == "chart_alert"
    assert "20% over budget" in result["response"]


@patch("app.services.intent.classify_intent")
def test_route_general_chat_fallback(mock_classify):
    mock_classify.return_value = Intent.GENERAL_CHAT
    result = asyncio.get_event_loop().run_until_complete(
        route_intent(Intent.GENERAL_CHAT, "token", "u1", "Hello")
    )
    assert result["intent"] == "general_chat"
    assert result["response"] is None
    assert result["fallback"] is True
