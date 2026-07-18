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
from ..models import RecurringBudget


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


# ---------------------------------------------------------------------------
# Recurring Budgets (budget generation lifecycle events)
# ---------------------------------------------------------------------------

def notify_recurring_budget_generated(rule: RecurringBudget) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:generated:{rule.id}:{rule.last_generation_date}",
        type='success',
        title=f"Budget generated: {rule.name}",
        message=f"A new budget of ₹{rule.total_budget} was automatically created for {rule.name}.",
        category='Budget',
        priority='low',
        action_url='/dashboard/budget',
    )


def notify_recurring_budget_failed(rule: RecurringBudget, error: str) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:failed:{rule.id}",
        type='error',
        title=f"Budget generation failed: {rule.name}",
        message=f"Could not generate the budget for {rule.name}: {error}",
        category='System',
        priority='high',
    )


def notify_recurring_budget_paused(rule: RecurringBudget) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:paused:{rule.id}",
        type='info',
        title=f"Recurring budget paused: {rule.name}",
        message=f"{rule.name} is paused and will not generate new budgets.",
        category='Budget',
        priority='low',
    )


def notify_recurring_budget_resumed(rule: RecurringBudget) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:resumed:{rule.id}",
        type='info',
        title=f"Recurring budget resumed: {rule.name}",
        message=f"{rule.name} is active again and will resume scheduled budgets.",
        category='Budget',
        priority='low',
    )


def notify_recurring_budget_completed(rule: RecurringBudget) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:completed:{rule.id}",
        type='info',
        title=f"Recurring budget completed: {rule.name}",
        message=f"{rule.name} has reached its end date and will no longer generate budgets.",
        category='Budget',
        priority='low',
    )


def notify_recurring_budget_upcoming(rule: RecurringBudget, due_date) -> Optional[Alert]:
    return _create(
        rule.user, rule.project, f"recurringbudget:upcoming:{rule.id}:{due_date}",
        type='info',
        title=f"Upcoming budget renewal: {rule.name}",
        message=f"Your {rule.name} budget renews on {due_date}.",
        category='Budget',
        priority='medium',
        action_url='/dashboard/recurring-budgets',
    )


# ---------------------------------------------------------------------------
# Financial Health Score events
# ---------------------------------------------------------------------------

def notify_financial_health(user, project, event: str, snapshot, delta=None) -> Optional[Alert]:
    """Notify about a meaningful financial-health-score change.

    ``event`` is one of: improved, dropped, risk, budget, recommendations.
    """
    configs = {
        'improved': (
            f"financial_health:improved:{snapshot.id}",
            'success', 'Financial health improved',
            f"Your financial health score rose to {snapshot.score:.0f} ({snapshot.grade_label}).",
            'Goals', 'medium',
        ),
        'dropped': (
            f"financial_health:dropped:{snapshot.id}",
            'warning', 'Financial health dropped',
            f"Your financial health score fell to {snapshot.score:.0f} ({snapshot.grade_label}).",
            'Goals', 'high',
        ),
        'risk': (
            f"financial_health:risk:{snapshot.id}",
            'error', 'Financial risk increased',
            f"Risk indicators are up; your health score is {snapshot.score:.0f} ({snapshot.grade_label}).",
            'Goals', 'high',
        ),
        'budget': (
            f"financial_health:budget:{snapshot.id}",
            'warning', 'Budget health deteriorating',
            f"Budget overruns detected; health score is {snapshot.score:.0f} ({snapshot.grade_label}).",
            'Budget', 'high',
        ),
        'recommendations': (
            f"financial_health:recommendations:{snapshot.id}",
            'info', 'New financial recommendations',
            'New ways to improve your financial health score are available.',
            'Goals', 'low',
        ),
    }
    key, ntype, title, message, category, priority = configs.get(
        event, configs['recommendations']
    )
    return _create(
        user, project, key,
        type=ntype, title=title, message=message,
        category=category, priority=priority,
        action_url='/dashboard/reports',
    )


# ---------------------------------------------------------------------------
# Dynamic AI Insights events
# ---------------------------------------------------------------------------

def notify_insight_found(user, project, count: int, sample_title: Optional[str] = None) -> Optional[Alert]:
    """Notify the user that new financial insights are available.

    Uses a stable per-day per-project dedup_key so repeated regenerations do not
    spam the user with Alerts.
    """
    date_key = timezone.localdate().isoformat()
    dedup_key = f"insights:generated:{date_key}"
    title = "New financial insights available"
    if sample_title:
        message = (
            f"{count} new insight{'s' if count != 1 else ''} generated, "
            f"including \"{sample_title}\"."
        )
    else:
        message = f"{count} new financial insight{'s' if count != 1 else ''} available to review."
    return _create(
        user, project, dedup_key,
        type='info',
        title=title,
        message=message,
        category='AI',
        priority='low',
        action_url='/dashboard',
    )


# ---------------------------------------------------------------------------
# Duplicate Transaction Detection events
# ---------------------------------------------------------------------------

def notify_duplicates_found(user, project, group_count: int, source: str = 'scan') -> Optional[Alert]:
    """Notify the user that potential duplicate transactions were found.

    ``source`` is either ``scan`` (standing scan) or ``import`` (import-time
    dedup). Uses a stable dedup_key so repeated scans do not spam the user.
    """
    date_key = timezone.localdate().isoformat()
    if source == 'import':
        dedup_key = f"duplicates:import:{date_key}"
        title = "Duplicates skipped during import"
        message = (
            f"Potential duplicate transactions were detected and skipped while "
            f"importing. Review them in Import / Export."
        )
    else:
        dedup_key = f"duplicates:found:{date_key}:{group_count}"
        title = f"{group_count} potential duplicate group{'s' if group_count != 1 else ''} found"
        message = (
            f"We found {group_count} group{'s' if group_count != 1 else ''} of "
            f"likely duplicate transactions. Review them to keep your data clean."
        )
    return _create(
        user, project, dedup_key,
        type='warning',
        title=title,
        message=message,
        category='Activity',
        priority='medium',
        action_url='/dashboard/import-export',
    )


# ---------------------------------------------------------------------------
# Subscription Detection events
# ---------------------------------------------------------------------------

def notify_subscriptions_found(user, project, count: int, sample_name: Optional[str] = None) -> Optional[Alert]:
    """Notify the user that new subscriptions were detected from their history.

    Uses a stable per-day per-project dedup_key so repeated scans do not spam the
    user with Alerts.
    """
    date_key = timezone.localdate().isoformat()
    dedup_key = f"subscriptions:detected:{date_key}"
    title = f"{count} subscription{'s' if count != 1 else ''} detected"
    if sample_name:
        message = (
            f"We found {count} recurring subscription{'s' if count != 1 else ''} "
            f"in your transactions, including \"{sample_name}\". Review and confirm them."
        )
    else:
        message = (
            f"We found {count} recurring subscription{'s' if count != 1 else ''} "
            f"in your transaction history."
        )
    return _create(
        user, project, dedup_key,
        type='info',
        title=title,
        message=message,
        category='Bills',
        priority='low',
        action_url='/dashboard/recurring',
    )
