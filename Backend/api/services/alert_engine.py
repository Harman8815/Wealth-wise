"""
Smart Notification Engine for WealthWise.

Evaluates a user's budget, goals, transactions, accounts, and recurring
obligations against a registry of rule functions and creates ``Alert`` rows
for the conditions the user has enabled in their ``AlertSetting`` preferences.

The engine is intentionally extensible: add a new rule by writing a function
that accepts an ``AlertContext`` and returns a list of ``Candidate`` dicts,
then register it in ``ALERT_RULES``. Each candidate is de-duplicated before
creation using a stable ``dedup_key`` so the same condition cannot spam the
user with repeated alerts within the duplicate window.
"""
from decimal import Decimal
from typing import Callable, Dict, List, Optional

from django.utils import timezone
from datetime import timedelta

from ..models import Alert, AlertSetting, BudgetCategory, Goal, Transaction, Account


DUPLICATE_WINDOW = timedelta(hours=24)


def _get_setting(settings: Dict[str, AlertSetting], setting_id: str) -> Optional[AlertSetting]:
    """Return a single AlertSetting by its setting_id, or None if absent."""
    return settings.get(setting_id)


def _is_enabled(settings: Dict[str, AlertSetting], setting_id: str) -> bool:
    """Return True when a setting exists and is enabled."""
    setting = settings.get(setting_id)
    return setting is not None and setting.enabled


def _has_recent_unread_alert(user, dedup_key: str, project=None) -> bool:
    """Check whether an unread alert with the same dedup_key exists in the window."""
    since = timezone.now() - DUPLICATE_WINDOW
    qs = Alert.objects.filter(
        user=user,
        dedup_key=dedup_key,
        read=False,
        timestamp__gte=since,
    )
    if project is not None:
        qs = qs.filter(project=project)
    else:
        qs = qs.filter(project__isnull=True)
    return qs.exists()


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

    @property
    def unusual_spending_threshold(self) -> Decimal:
        setting = self.settings.get('unusual_spending')
        if setting and setting.threshold is not None:
            return setting.threshold
        return Decimal('15000')

    @property
    def low_balance_threshold(self) -> Decimal:
        setting = self.settings.get('low_balance')
        if setting and setting.threshold is not None:
            return setting.threshold
        return Decimal('5000')


Candidate = Dict[str, object]


# ---------------------------------------------------------------------------
# Budget rules
# ---------------------------------------------------------------------------

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
            'priority': 'high',
            'title': 'Overall budget exceeded',
            'message': (
                f"You've spent {total_spent} against a total budget of "
                f"{total_budgeted} across all categories."
            ),
            'category': 'Budget',
            'action_url': '/dashboard/budget',
            'setting_id': 'budget_warning',
            'dedup_key': 'budget:overall:exceeded',
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
                'priority': 'high',
                'title': f"Budget exceeded: {bc.name}",
                'message': (
                    f"Your {bc.name} spending of {bc.spent} has exceeded the "
                    f"budget of {bc.budgeted}."
                ),
                'category': 'Budget',
                'action_url': '/dashboard/budget',
                'setting_id': 'budget_warning',
                'dedup_key': f"budget:category:{bc.id}:exceeded",
            }
        )
    return candidates


_BUDGET_THRESHOLDS = [
    (Decimal('90'), 'critical', 'Budget almost maxed out: {name}',
     "You've used {pct}% of your {name} budget ({spent} of {budgeted}).", 'budget:category:{id}:90'),
    (Decimal('80'), 'high', 'Approaching budget limit: {name}',
     "You've used {pct}% of your {name} budget ({spent} of {budgeted}).", 'budget:category:{id}:80'),
    (Decimal('50'), 'medium', 'Half of budget used: {name}',
     "You've used {pct}% of your {name} budget ({spent} of {budgeted}).", 'budget:category:{id}:50'),
]


def rule_budget_approaching_threshold(ctx: AlertContext) -> List[Candidate]:
    """Alert at configurable budget usage tiers (50%, 80%, 90%).

    A single highest-tier alert is emitted per category per day to avoid
    notification spam as spending climbs through the tiers.
    """
    if not _is_enabled(ctx.settings, 'budget_warning'):
        return []

    candidates: List[Candidate] = []
    for bc in ctx.budget_categories:
        if bc.budgeted <= 0 or bc.spent <= 0:
            continue
        percentage = (bc.spent / bc.budgeted) * Decimal('100')
        if percentage >= Decimal('100'):
            continue

        matched = None
        for threshold, priority, title_tpl, msg_tpl, key_tpl in _BUDGET_THRESHOLDS:
            if percentage >= threshold:
                matched = (threshold, priority, title_tpl, msg_tpl, key_tpl)
                break

        if matched is None:
            continue

        _, priority, title_tpl, msg_tpl, key_tpl = matched
        candidates.append(
            {
                'type': 'info',
                'priority': priority,
                'title': title_tpl.format(name=bc.name),
                'message': msg_tpl.format(
                    name=bc.name, pct=f"{percentage:.0f}",
                    spent=bc.spent, budgeted=bc.budgeted,
                ),
                'category': 'Budget',
                'action_url': '/dashboard/budget',
                'setting_id': 'budget_warning',
                'dedup_key': key_tpl.format(id=bc.id),
            }
        )
    return candidates


# ---------------------------------------------------------------------------
# Goal rules
# ---------------------------------------------------------------------------

_GOAL_MILESTONES = [
    (Decimal('100'), 'success', 'critical', 'Goal achieved: {title}',
     "Congratulations! You've reached your goal: {title}.", 'goal:{id}:100'),
    (Decimal('75'), 'success', 'high', 'Goal almost complete: {title}',
     "You're at {pct}% of your goal: {title}. Keep going!", 'goal:{id}:75'),
    (Decimal('50'), 'info', 'medium', 'Goal halfway: {title}',
     "You've reached 50% of your goal: {title}.", 'goal:{id}:50'),
]


def rule_goal_milestones(ctx: AlertContext) -> List[Candidate]:
    """Alert on goal progress milestones (50%, 75%, 100%)."""
    if not _is_enabled(ctx.settings, 'goal_milestones'):
        return []

    goals = Goal.objects.filter(user=ctx.user, status='active')

    candidates: List[Candidate] = []
    for goal in goals:
        if goal.target_amount <= 0:
            continue
        percentage = (goal.current_amount / goal.target_amount) * Decimal('100')

        matched = None
        for threshold, ntype, priority, title_tpl, msg_tpl, key_tpl in _GOAL_MILESTONES:
            if percentage >= threshold:
                matched = (ntype, priority, title_tpl, msg_tpl, key_tpl)
                break

        if matched is None:
            continue

        ntype, priority, title_tpl, msg_tpl, key_tpl = matched
        candidates.append(
            {
                'type': ntype,
                'priority': priority,
                'title': title_tpl.format(title=goal.title),
                'message': msg_tpl.format(title=goal.title, pct=f"{percentage:.0f}"),
                'category': 'Goals',
                'action_url': '/dashboard/goals',
                'setting_id': 'goal_milestones',
                'dedup_key': key_tpl.format(id=goal.id),
            }
        )
    return candidates


# ---------------------------------------------------------------------------
# Transaction / Security rules
# ---------------------------------------------------------------------------

def rule_large_transaction(ctx: AlertContext) -> List[Candidate]:
    """Alert on unusually large expense transactions.

    Flags a single expense that exceeds the user's configured
    ``unusual_spending`` threshold.
    """
    if not _is_enabled(ctx.settings, 'unusual_spending'):
        return []

    threshold = ctx.unusual_spending_threshold
    recent = Transaction.objects.filter(
        user=ctx.user,
        type='expense',
        amount__gte=threshold,
    ).order_by('-date')[:5]

    candidates: List[Candidate] = []
    for txn in recent:
        candidates.append(
            {
                'type': 'warning',
                'priority': 'high',
                'title': f"Large transaction detected: {txn.amount}",
                'message': (
                    f"A transaction of {txn.amount} on {txn.date} "
                    f"({txn.category}) is larger than usual."
                ),
                'category': 'Security',
                'action_url': '/dashboard/transactions',
                'setting_id': 'unusual_spending',
                'dedup_key': f"txn:large:{txn.id}",
            }
        )
    return candidates


# ---------------------------------------------------------------------------
# Account rules
# ---------------------------------------------------------------------------

def rule_low_balance(ctx: AlertContext) -> List[Candidate]:
    """Alert when an account balance falls below the configured threshold."""
    if not _is_enabled(ctx.settings, 'low_balance'):
        return []

    threshold = ctx.low_balance_threshold
    low_accounts = Account.objects.filter(
        user=ctx.user, is_active=True, balance__lt=threshold
    )

    candidates: List[Candidate] = []
    for account in low_accounts:
        candidates.append(
            {
                'type': 'warning',
                'priority': 'medium',
                'title': f"Low balance: {account.name}",
                'message': (
                    f"Your {account.name} balance is {account.balance}, "
                    f"below the {threshold} threshold."
                ),
                'category': 'Account',
                'action_url': '/dashboard/account-management',
                'setting_id': 'low_balance',
                'dedup_key': f"balance:low:{account.id}",
            }
        )
    return candidates


# Registry of rule functions. Add new notification sources by appending here.
ALERT_RULES: List[Callable[[AlertContext], List[Candidate]]] = [
    rule_overall_budget_exceeded,
    rule_category_budget_exceeded,
    rule_budget_approaching_threshold,
    rule_goal_milestones,
    rule_large_transaction,
    rule_low_balance,
]


def generate_user_alerts(user, project=None) -> int:
    """Evaluate all registered rules for ``user`` and create Alert rows.

    Only enabled categories are considered, and duplicate unread alerts with
    the same ``dedup_key`` are suppressed within ``DUPLICATE_WINDOW``.

    Returns the number of alerts created.
    """
    budget_categories = (
        user.budget_categories.filter(project=project)
        if project
        else user.budget_categories.filter(project__isnull=True)
    )
    settings = {
        setting.setting_id: setting
        for setting in AlertSetting.objects.filter(user=user, project=project)
    }
    context = AlertContext(user, budget_categories, settings)

    created = 0
    for rule in ALERT_RULES:
        for candidate in rule(context):
            dedup_key = str(candidate.get('dedup_key', ''))
            if dedup_key and _has_recent_unread_alert(user, dedup_key, project):
                continue
            Alert.objects.create(
                user=user,
                project=project,
                type=str(candidate.get('type', 'info')),
                title=str(candidate.get('title', '')),
                message=str(candidate.get('message', '')),
                category=str(candidate.get('category', 'Budget')),
                priority=str(candidate.get('priority', 'medium')),
                dismissed=False,
                dedup_key=dedup_key,
                action_url=str(candidate.get('action_url', '') or ''),
            )
            created += 1

    return created
