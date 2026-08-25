"""
Tests for ML-Backend input validation and fallback messages.
"""
from __future__ import annotations

import pytest

from app.services.validation import (
    validate_alerts_context,
    validate_budget_context,
    validate_goals_context,
    validate_insights_context,
    validate_profile_context,
    validate_transactions_context,
)
from app.services.fallbacks import get_fallback, FALLBACKS


class TestValidateInsightsContext:
    def test_valid_insights(self):
        data = {"results": [{"title": "Test", "description": "Desc"}]}
        assert validate_insights_context(data) == (True, "")

    def test_empty_results(self):
        data = {"results": []}
        assert validate_insights_context(data) == (False, "no_insights_data")

    def test_missing_results(self):
        data = {"other": "value"}
        assert validate_insights_context(data) == (False, "no_insights_data")

    def test_not_dict(self):
        assert validate_insights_context([]) == (False, "malformed_insights_data")
        assert validate_insights_context(None) == (False, "malformed_insights_data")


class TestValidateAlertsContext:
    def test_valid_alerts(self):
        data = {"results": [{"title": "Alert"}]}
        assert validate_alerts_context(data) == (True, "")

    def test_empty_results(self):
        data = {"results": []}
        assert validate_alerts_context(data) == (False, "no_alerts_data")


class TestValidateTransactionsContext:
    def test_valid_transactions(self):
        data = {"results": [{"date": "2026-08-25", "amount": 100}]}
        assert validate_transactions_context(data) == (True, "")

    def test_empty_results(self):
        data = {"results": []}
        assert validate_transactions_context(data) == (False, "no_transactions_data")

    def test_partial_data(self):
        data = {"results": [{"date": "2026-08-25"}]}
        assert validate_transactions_context(data) == (False, "partial_transactions_data")


class TestValidateBudgetContext:
    def test_valid_budget(self):
        data = {"results": [{"category": "food", "amount": 5000}]}
        assert validate_budget_context(data) == (True, "")

    def test_empty_results(self):
        data = {"results": []}
        assert validate_budget_context(data) == (False, "no_budget_data")


class TestValidateGoalsContext:
    def test_valid_goals(self):
        data = {"results": [{"name": "Emergency Fund", "target_amount": 100000}]}
        assert validate_goals_context(data) == (True, "")

    def test_empty_results(self):
        data = {"results": []}
        assert validate_goals_context(data) == (False, "no_goals_data")


class TestValidateProfileContext:
    def test_valid_profile(self):
        data = {"name": "John", "monthly_income": 50000}
        assert validate_profile_context(data) == (True, "")

    def test_missing_fields(self):
        data = {"name": "John"}
        assert validate_profile_context(data) == (False, "partial_profile_data")


class TestFallbacks:
    def test_known_fallback(self):
        assert get_fallback("no_insights_data") == FALLBACKS["no_insights_data"]

    def test_unknown_fallback(self):
        assert get_fallback("unknown_error") == FALLBACKS["empty_response"]

    def test_all_fallbacks_exist(self):
        for key in [
            "no_insights_data",
            "malformed_insights_data",
            "no_alerts_data",
            "malformed_alerts_data",
            "no_transactions_data",
            "malformed_transactions_data",
            "partial_transactions_data",
            "no_budget_data",
            "malformed_budget_data",
            "no_goals_data",
            "malformed_goals_data",
            "partial_profile_data",
            "malformed_profile_data",
            "ollama_unavailable",
            "ambiguous_query",
            "empty_response",
            "invalid_token",
        ]:
            assert key in FALLBACKS
            assert len(FALLBACKS[key]) > 0
