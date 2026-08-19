"""
Tests for financial calculation helpers.
"""
from app.services.calculations import calculate_savings_rate, calculate_budget_variance, project_goal_timeline


def test_calculate_savings_rate_happy_path():
    assert calculate_savings_rate(1000, 400) == 0.6


def test_calculate_savings_rate_no_income():
    assert calculate_savings_rate(0, 100) == 0.0


def test_calculate_budget_variance_under_budget():
    result = calculate_budget_variance(1000, 800)
    assert result["variance"] == -200
    assert result["percentage"] == -20.0
    assert result["over_budget"] is False


def test_calculate_budget_variance_over_budget():
    result = calculate_budget_variance(1000, 1200)
    assert result["variance"] == 200
    assert result["percentage"] == 20.0
    assert result["over_budget"] is True


def test_project_goal_timeline_happy_path():
    result = project_goal_timeline(100000, 20000, 5000)
    assert result["months"] == 16
    assert result["completed"] is False


def test_project_goal_timeline_already_completed():
    result = project_goal_timeline(100000, 100000, 5000)
    assert result["months"] == 0
    assert result["completed"] is True
