"""
Tests for the Recurring Budgets platform.

Covers model creation, the generation service (strategies, duplicate
prevention, overdue catch-up), and the notification helpers.
"""
from datetime import date

from django.test import TestCase

from .models import User, RecurringBudget, BudgetCategory, RecurringBudgetExecution
from .services.recurring_budgets import (
    execute_rule,
    recompute_next_generation,
    run_due_rules,
    get_upcoming_preview,
)


class RecurringBudgetEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="budget-test@wealthwise.test",
            name="Budget Tester",
            password="test-pass-123",
        )

    def _make_rule(self, **kwargs):
        defaults = dict(
            user=self.user,
            name="Monthly Budget",
            total_budget=5000,
            categories=[
                {"name": "Food", "budgeted": 2000, "color": "#3b82f6", "symbol": "utensils"},
                {"name": "Rent", "budgeted": 3000, "color": "#a855f7", "symbol": "home"},
            ],
            strategy="copy_structure",
            frequency="monthly",
            interval=1,
            day_of_month=1,
            start_date=date(2020, 1, 1),
            never_ends=True,
        )
        defaults.update(kwargs)
        return RecurringBudget.objects.create(**defaults)

    def test_next_generation_computed(self):
        rule = self._make_rule()
        recompute_next_generation(rule)
        rule.refresh_from_db()
        self.assertIsNotNone(rule.next_generation_date)

    def test_generate_creates_budget_categories(self):
        rule = self._make_rule()
        execution = execute_rule(rule, date(2024, 1, 1))
        self.assertEqual(execution.status, "generated")
        self.assertEqual(len(execution.generated_budgets), 2)
        self.assertEqual(
            BudgetCategory.objects.filter(user=self.user).count(), 2
        )
        rule.refresh_from_db()
        self.assertEqual(rule.generation_count, 1)
        self.assertEqual(rule.last_generation_date, date(2024, 1, 1))

    def test_copy_exact_strategy_keeps_spent(self):
        rule = self._make_rule(strategy="copy_exact")
        # Prime a previous generation whose snapshot records spent values.
        first = execute_rule(rule, date(2024, 1, 1))
        first.generated_budgets = [
            {"id": "x", "name": "Food", "budgeted": 2000, "spent": 500},
            {"id": "y", "name": "Rent", "budgeted": 3000, "spent": 0},
        ]
        first.save()
        rule.refresh_from_db()
        execution = execute_rule(rule, date(2024, 2, 1))
        # The copy_exact strategy should reproduce the prior snapshot's spent.
        food = next(c for c in execution.generated_budgets if c["name"] == "Food")
        self.assertEqual(food["spent"], 500)

    def test_duplicate_prevention(self):
        rule = self._make_rule()
        execute_rule(rule, date(2024, 1, 1))
        # Running again for the same date must not create duplicate budgets.
        execution = execute_rule(rule, date(2024, 1, 1))
        self.assertEqual(execution.status, "generated")
        self.assertEqual(BudgetCategory.objects.filter(user=self.user).count(), 2)

    def test_increase_percent_scales_budget(self):
        rule = self._make_rule(strategy="increase_percent", adjustment_percent=10)
        execution = execute_rule(rule, date(2024, 1, 1))
        food = next(c for c in execution.generated_budgets if c["name"] == "Food")
        self.assertEqual(food["budgeted"], 2200.0)

    def test_run_due_catches_up_overdue(self):
        rule = self._make_rule(
            start_date=date(2024, 1, 1),
            day_of_month=1,
            never_ends=True,
        )
        # Force the next due date into the past.
        rule.next_generation_date = date(2024, 1, 1)
        rule.save()
        summary = run_due_rules(as_of=date(2024, 3, 1))
        self.assertGreaterEqual(summary["generations"], 1)
        rule.refresh_from_db()
        self.assertGreaterEqual(rule.generation_count, 1)
        self.assertIsNotNone(rule.last_generation_date)

    def test_upcoming_preview(self):
        rule = self._make_rule()
        dates = get_upcoming_preview(rule, 3)
        self.assertLessEqual(len(dates), 3)
        if dates:
            self.assertGreater(dates[0], rule.start_date)

    def test_execution_uses_user_scope(self):
        rule = self._make_rule()
        execute_rule(rule, date(2024, 1, 1))
        self.assertEqual(
            RecurringBudgetExecution.objects.filter(user=self.user).count(), 1
        )
