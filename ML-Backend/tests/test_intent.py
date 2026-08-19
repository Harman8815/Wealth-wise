"""
Tests for intent classifier.
"""
import asyncio
from unittest.mock import patch

from app.services.intent import Intent, classify_intent


@patch("app.services.intent.generate")
def test_classify_report_intent(mock_generate):
    mock_generate.return_value = {"message": {"content": "report"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("Give me a financial report"))
    assert result == Intent.REPORT


@patch("app.services.intent.generate")
def test_classify_goal_intent(mock_generate):
    mock_generate.return_value = {"message": {"content": "goal"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("When will I reach my goal?"))
    assert result == Intent.GOAL


@patch("app.services.intent.generate")
def test_classify_budget_intent(mock_generate):
    mock_generate.return_value = {"message": {"content": "budget"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("How is my budget?"))
    assert result == Intent.BUDGET


@patch("app.services.intent.generate")
def test_classify_transaction_search_intent(mock_generate):
    mock_generate.return_value = {"message": {"content": "transaction_search"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("Find my grocery transactions"))
    assert result == Intent.TRANSACTION_SEARCH


@patch("app.services.intent.generate")
def test_classify_general_chat_intent(mock_generate):
    mock_generate.return_value = {"message": {"content": "general_chat"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("Hello, how are you?"))
    assert result == Intent.GENERAL_CHAT


@patch("app.services.intent.generate")
def test_classify_invalid_intent_falls_back_to_general(mock_generate):
    mock_generate.return_value = {"message": {"content": "unknown_intent"}}
    result = asyncio.get_event_loop().run_until_complete(classify_intent("Random message"))
    assert result == Intent.GENERAL_CHAT
