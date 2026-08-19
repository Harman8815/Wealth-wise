"""
Tests for goal and budget planning assistants.
"""
import asyncio
from unittest.mock import patch

from app.services.assistants import answer_budget_question, answer_goal_question


@patch("app.services.assistants.generate")
@patch("app.services.assistants.get_profile_tool")
@patch("app.services.assistants.get_goals_tool")
def test_answer_goal_question(mock_get_goals, mock_get_profile, mock_generate):
    mock_get_goals.return_value = {"data": [{"name": "Emergency Fund", "target_amount": 100000, "current_amount": 20000, "monthly_contribution": 5000}]}
    mock_get_profile.return_value = {"data": {"monthly_income": 50000}}
    mock_generate.return_value = {"message": {"content": "You'll reach your goal in 16 months."}}
    result = asyncio.get_event_loop().run_until_complete(
        answer_goal_question("token", "u1", "When will I reach my goal?")
    )
    assert "16 months" in result


@patch("app.services.assistants.generate")
@patch("app.services.assistants.get_profile_tool")
@patch("app.services.assistants.get_budget_tool")
@patch("app.services.assistants.get_transactions_tool")
def test_answer_budget_question(mock_get_transactions, mock_get_budget, mock_get_profile, mock_generate):
    mock_get_transactions.return_value = {"data": {"results": [{"type": "income", "amount": 50000}, {"type": "expense", "amount": 30000}]}}
    mock_get_budget.return_value = {"data": [{"amount": 35000}]}
    mock_get_profile.return_value = {"data": {"monthly_income": 50000}}
    mock_generate.return_value = {"message": {"content": "You are under budget by ₹5,000."}}
    result = asyncio.get_event_loop().run_until_complete(
        answer_budget_question("token", "u1", "How is my budget?")
    )
    assert "under budget" in result
