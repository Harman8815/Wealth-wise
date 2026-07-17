"""
Recurring notification helpers.

Thin layer over the unified ``Alert`` resource for recurring-lifecycle events.
Each helper builds a single Alert for the owning user, scoped to the same
project as the rule, and de-duplicates within a short window using a stable
``dedup_key`` so the same event cannot spam the user.
"""
from datetime import timedelta
from typing import Optional

from django.utils import timezone

from ..models import Alert
from ..models import RecurringRule, Transaction


_DUPLICATE_WINDOW = timedelta(hours=24)


def _recent_duplicate(user, dedup_key, project) -> bool:
    since = timezone.now() - _DUPLICATE_WINDOW
    qs = Alert.objects.filter(
        user=user, dedup_key=dedup_key, read=False, timestamp__gte=since,
    )
    if project is not None:
        qs = qs.filter(project=project)
    else:
        qs = qs.filter(project__isnull=True)
    return qs.exists()


def _create(user, project, dedup_key, **kwargs) -> Optional[Alert]:
    if _recent_duplicate(user, dedup_key, project):
        return None
    return Alert.objects.create(
        user=user,
        project=project,
        dedup_key=dedup_key,
        type=kwargs.get('type', 'info'),
        title=kwargs.get('title', ''),
        message=kwargs.get('message', ''),
        category=kwargs.get('category', 'Bills'),
        priority=kwargs.get('priority', 'medium'),
        action_url=kwargs.get('action_url', '/dashboard/recurring'),
        dismissed=False,
    )


def notify_recurring_executed(rule: RecurringRule, txn: Transaction) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:executed:{rule.id}:{txn.date}",
        type='success',
        title=f"Recurring {rule.type} recorded: {rule.name}",
        message=f"₹{rule.amount} was automatically added for {rule.name}.",
        category='Bills',
        priority='low',
    )


def notify_recurring_failed(rule: RecurringRule, error: str) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:failed:{rule.id}",
        type='error',
        title=f"Recurring transaction failed: {rule.name}",
        message=f"Could not generate {rule.name}: {error}",
        category='System',
        priority='high',
    )


def notify_recurring_paused(rule: RecurringRule) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:paused:{rule.id}",
        type='info',
        title=f"Recurring rule paused: {rule.name}",
        message=f"{rule.name} has been paused and will not generate transactions.",
        category='Bills',
        priority='low',
    )


def notify_recurring_resumed(rule: RecurringRule) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:resumed:{rule.id}",
        type='info',
        title=f"Recurring rule resumed: {rule.name}",
        message=f"{rule.name} is active again and will resume scheduled transactions.",
        category='Bills',
        priority='low',
    )


def notify_recurring_upcoming(rule: RecurringRule, due_date) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:upcoming:{rule.id}:{due_date}",
        type='info',
        title=f"Upcoming recurring payment: {rule.name}",
        message=f"₹{rule.amount} for {rule.name} is scheduled for {due_date}.",
        category='Bills',
        priority='medium',
    )


def notify_recurring_completed(rule: RecurringRule) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurring:completed:{rule.id}",
        type='info',
        title=f"Recurring rule completed: {rule.name}",
        message=f"{rule.name} has reached its end date and will no longer run.",
        category='Bills',
        priority='low',
    )
