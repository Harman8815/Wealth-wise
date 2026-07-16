"""
Alert generation engine for WealthWise.

Evaluates a user's budget data and alert preferences against a registry of
rule functions and creates Alert rows for conditions the user has enabled.

The engine is intentionally extensible: add a new rule by writing a function
that accepts an AlertContext and returns a list of candidate alerts, then
register it in ALERT_RULES.
"""
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from django.utils import timezone
from datetime import timedelta

from ..models import Alert, AlertSetting, BudgetCategory


DUPLICATE_WINDOW = timedelta(hours=24)


def _get_setting(settings: Dict[str, AlertSetting], setting_id: str) -> Optional[AlertSetting]:
    """Return a single AlertSetting by its setting_id, or None if absent."""
    return settings.get(setting_id)


def _is_enabled(settings: Dict[str, AlertSetting], setting_id: str) -> bool:
    """Return True when a setting exists and is enabled."""
    setting = settings.get(setting_id)
    return setting is not None and setting.enabled


def _has_recent_unread_alert(user, title: str, project=None) -> bool:
    """Check whether an unread alert with the same title exists in the window."""
    since = timezone.now() - DUPLICATE_WINDOW
    return Alert.objects.filter(
        user=user,
        project=project,
        title=title,
        read=False,
        timestamp__gte=since,
    ).exists()


class AlertContext:
    """Bundled data passed to every rule function."""

    def __init__(self, user, budget_categories, settings):
        self.user = user
        self.budget_categories = list(budget_categories)
        self.settings = settings

    @property
    def budget_warning_threshold(self) -> Decimal:
        setting = self.settings.get('budget_warning')
        if setting and setting.threshold is not None:
            return setting.threshold
        return Decimal('80')


Candidate = Dict[str, object]


def rule_overall_budget_exceeded(ctx: AlertContext) -> List[Candidate]:
    """Alert when total spending exceeds total budgeted across categories."""
    if not _is_enabled(ctx.settings, 'budget_warning'):
        return []
    if not ctx.budget_categories:
        return []

    total_budgeted = sum((bc.budgeted for bc in ctx.budget_categories), Decimal('0'))
    total_spent = sum((bc.spent for bc in ctx.budget_categories), Decimal('0'))

    if total_budgeted <= 0 or total_spent <= total_budgeted:
        return []

    return [
        {
            'type': 'warning',
            'title': 'Overall budget exceeded',
            'message': (
                f"You've spent {total_spent} against a total budget of "
                f"{total_budgeted} across all categories."
            ),
            'category': 'Budget',
            'action_url': '/dashboard/budget',
            'setting_id': 'budget_warning',
        }
    ]


def rule_category_budget_exceeded(ctx: AlertContext) -> List[Candidate]:
    """Alert for each individual category whose spending exceeds its budget."""
    if not _is_enabled(ctx.settings, 'budget_warning'):
        return []

    candidates: List[Candidate] = []
    for bc in ctx.budget_categories:
        if bc.budgeted <= 0 or bc.spent <= bc.budgeted:
            continue
        candidates.append(
            {
                'type': 'warning',
                'title': f"Budget exceeded: {bc.name}",
                'message': (
                    f"Your {bc.name} spending of {bc.spent} has exceeded the "
                    f"budget of {bc.budgeted}."
                ),
                'category': 'Budget',
                'action_url': '/dashboard/budget',
                'setting_id': 'budget_warning',
            }
        )
    return candidates


def rule_budget_approaching_threshold(ctx: AlertContext) -> List[Candidate]:
    """Alert when a category reaches the warning threshold percentage of budget."""
    if not _is_enabled(ctx.settings, 'budget_warning'):
        return []
    threshold = ctx.budget_warning_threshold

    candidates: List[Candidate] = []
    for bc in ctx.budget_categories:
        if bc.budgeted <= 0:
            continue
        if bc.spent <= 0:
            continue
        percentage = (bc.spent / bc.budgeted) * Decimal('100')
        if percentage < threshold or percentage >= Decimal('100'):
            continue
        candidates.append(
            {
                'type': 'info',
                'title': f"Approaching budget limit: {bc.name}",
                'message': (
                    f"You've used {percentage:.0f}% of your {bc.name} budget "
                    f"({bc.spent} of {bc.budgeted})."
                ),
                'category': 'Budget',
                'action_url': '/dashboard/budget',
                'setting_id': 'budget_warning',
            }
        )
    return candidates


# Registry of rule functions. Add new alert types by appending here.
ALERT_RULES: List[Callable[[AlertContext], List[Candidate]]] = [
    rule_overall_budget_exceeded,
    rule_category_budget_exceeded,
    rule_budget_approaching_threshold,
]


def generate_user_alerts(user, project=None) -> int:
    """
    Evaluate all registered rules for ``user`` and create Alert rows.

    Only enabled categories are considered, and duplicate unread alerts with
    the same title are suppressed within ``DUPLICATE_WINDOW``.

    Returns the number of alerts created.
    """
    budget_categories = user.budget_categories.filter(project=project) if project else user.budget_categories.filter(project__isnull=True)
    settings = {
        setting.setting_id: setting
        for setting in AlertSetting.objects.filter(user=user, project=project)
    }
    context = AlertContext(user, budget_categories, settings)

    created = 0
    for rule in ALERT_RULES:
        for candidate in rule(context):
            title = str(candidate.get('title', ''))
            if _has_recent_unread_alert(user, title, project):
                continue
            Alert.objects.create(
                user=user,
                project=project,
                type=str(candidate.get('type', 'info')),
                title=title,
                message=str(candidate.get('message', '')),
                category=str(candidate.get('category', 'Budget')),
                action_url=str(candidate.get('action_url', '') or ''),
            )
            created += 1

    return created
