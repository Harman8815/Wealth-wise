"""
Recurring transaction execution service.

Bridges the scheduling engine with the data layer: computes the next execution
date for a ``RecurringRule``, generates concrete ``Transaction`` rows when a
schedule becomes due, records ``RecurringExecution`` history, prevents
duplicate runs, and handles overdue schedules. It also publishes notifications
through the Notification Engine for recurring lifecycle events.
"""
from datetime import date, timedelta
from typing import Dict, List, Optional

from django.db import transaction
from django.utils import timezone

from ..models import RecurringRule, RecurringExecution, Transaction, Category, Account
from .scheduling import next_occurrence, preview_occurrences
from .notifications import notify_recurring_executed, notify_recurring_failed


def recompute_next_execution(rule: RecurringRule) -> Optional[date]:
    """Recompute and persist ``next_execution_date`` for ``rule``."""
    after = rule.last_execution_date or (rule.start_date - timedelta(days=1))
    nxt = next_occurrence(
        rule.frequency,
        rule.start_date,
        after,
        rule.interval,
        list(rule.weekdays or []),
        rule.day_of_month,
        rule.last_day_of_month,
    )
    if nxt and not rule.never_ends and rule.end_date and nxt > rule.end_date:
        nxt = None

    rule.next_execution_date = nxt
    if nxt is None:
        rule.status = 'completed'
    rule.save(update_fields=['next_execution_date', 'status', 'updated_at'])
    return nxt


def get_upcoming_preview(rule: RecurringRule, count: int = 5) -> List[date]:
    """Preview the next occurrences for a rule (for display)."""
    end = None if rule.never_ends else rule.end_date
    return preview_occurrences(
        rule.frequency,
        rule.start_date,
        count,
        rule.interval,
        list(rule.weekdays or []),
        rule.day_of_month,
        rule.last_day_of_month,
        end,
    )


def _resolve_category(rule: RecurringRule, user):
    """Return the category FK to attach to generated transactions.

    The ViewSet auto-creates the category (storing it on ``rule.category``),
    so here we always resolve to a concrete Category instance.
    """
    return rule.category


@transaction.atomic
def execute_rule(rule: RecurringRule, scheduled_date: date) -> RecurringExecution:
    """Generate a transaction for ``rule`` on ``scheduled_date``.

    Returns the created ``RecurringExecution`` (status reflects outcome).
    """
    user = rule.user
    category = _resolve_category(rule, user)

    execution = RecurringExecution.objects.create(
        rule=rule,
        user=user,
        project=rule.project,
        scheduled_date=scheduled_date,
        status='pending',
    )

    try:
        txn = Transaction.objects.create(
            user=user,
            project=rule.project,
            account=rule.account,
            date=scheduled_date,
            description=rule.name,
            category=category,
            amount=rule.amount,
            type=rule.type,
            status='completed',
        )
        execution.transaction = txn
        execution.status = 'executed'
        execution.executed_at = timezone.now()
        execution.save(update_fields=['transaction', 'status', 'executed_at'])

        rule.last_execution_date = scheduled_date
        rule.execution_count = (rule.execution_count or 0) + 1
        rule.save(update_fields=['last_execution_date', 'execution_count', 'updated_at'])

        notify_recurring_executed(rule, txn)
    except Exception as exc:  # pragma: no cover - defensive
        execution.status = 'failed'
        execution.error = str(exc)
        execution.save(update_fields=['status', 'error'])
        notify_recurring_failed(rule, str(exc))

    recompute_next_execution(rule)
    return execution


def run_due_rules(as_of: Optional[date] = None) -> Dict[str, int]:
    """Execute every active rule whose next execution is due.

    Catches up on overdue schedules (one execution per due date) and prevents
    duplicate executions via the ``RecurringExecution`` history. Returns a
    summary of how many rules were processed and executions created.
    """
    as_of = as_of or timezone.localdate()
    summary: Dict[str, int] = {'rules_checked': 0, 'executions': 0, 'failed': 0}

    due_rules = RecurringRule.objects.filter(
        status='active',
        next_execution_date__isnull=False,
        next_execution_date__lte=as_of,
    ).select_for_update(skip_locked=True)

    for rule in due_rules:
        summary['rules_checked'] += 1
        # Process each missed occurrence in chronological order.
        cursor = rule.next_execution_date
        safety = 0
        while cursor and cursor <= as_of and safety < 100:
            safety += 1
            already = RecurringExecution.objects.filter(
                rule=rule, scheduled_date=cursor,
            ).exists()
            if not already:
                execution = execute_rule(rule, cursor)
                summary['executions'] += 1
                if execution.status == 'failed':
                    summary['failed'] += 1
            # Advance to the next occurrence in this catch-up loop.
            cursor = next_occurrence(
                rule.frequency,
                rule.start_date,
                cursor,
                rule.interval,
                list(rule.weekdays or []),
                rule.day_of_month,
                rule.last_day_of_month,
            )
            if cursor and not rule.never_ends and rule.end_date and cursor > rule.end_date:
                cursor = None
            rule.refresh_from_db(fields=['next_execution_date'])
        # Ensure the persisted next date is current after catch-up.
        recompute_next_execution(rule)

    return summary
