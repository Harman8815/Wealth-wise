"""
Dynamic AI Insights Engine.

A cross-cutting insight feed that aggregates richer, narrative *business-rule
findings* (spending anomalies, category spikes, recurring/subscription drift,
savings opportunities, goal momentum) as a **persisted, dismissible feed**.

It deliberately mirrors ``services.financial_health``: a ``RuleContext`` holds the
data snapshot, an ``INSIGHT_RULES`` registry of pure functions emits candidate
insights, ``generate_for_project`` persists (deduping by a stable key so repeated
regenerations update in place), and ``generate_after_change`` is the defensive
event hook that the financial-health recompute calls so insights refresh
automatically whenever existing data changes.

Insights are pure over querysets and self-contained (no tight coupling to the
financial-health engine) so they can be tested without mocking anything external.
"""
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Callable, Dict, List, Optional, Tuple

from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from ..models import (
    Transaction,
    BudgetCategory,
    Goal,
    Account,
    RecurringRule,
    Insight,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ZERO = Decimal('0')
ONE_HUNDRED = Decimal('100')
SPENDING_SPIKE_THRESHOLD = Decimal('15')  # MoM expense growth % that flags a spike
SUBSCRIPTION_CREEP_THRESHOLD = Decimal('30')  # recurring expense % of income
GOAL_MOMENTUM_THRESHOLD = Decimal('75')  # % funded that triggers celebration


def _d(value) -> Decimal:
    """Coerce a value (Decimal/int/float/None) to a Decimal."""
    if value is None:
        return ZERO
    try:
        return Decimal(str(value))
    except (TypeError, ValueError):
        return ZERO


def _pct(numerator: Decimal, denominator: Decimal) -> Decimal:
    if denominator <= 0:
        return ZERO
    return (numerator / denominator) * ONE_HUNDRED


def _monthly_expense_by_category(user, project, period_start, period_end) -> Dict[str, List[Decimal]]:
    """Return {category_name: [m0_expense, m1_expense, ...]} over the window."""
    txn_qs = Transaction.objects.filter(
        user=user, type='expense', date__gte=period_start, date__lte=period_end,
        **({'project': project} if project else {}),
    )
    rows = (
        txn_qs.annotate(month=TruncMonth('date'))
        .values('month', 'category__name')
        .annotate(total=Sum('amount'))
        .order_by('month', 'category__name')
    )
    months: List[date] = []
    seen = {}
    for r in rows:
        m = r['month']
        if m not in seen:
            seen[m] = len(months)
            months.append(m)
    result: Dict[str, List[Decimal]] = {}
    for cat in txn_qs.values_list('category__name', flat=True).distinct():
        result[cat or 'Uncategorized'] = [ZERO] * len(months)
    for r in rows:
        cat = r['category__name'] or 'Uncategorized'
        if cat not in result:
            result[cat] = [ZERO] * len(months)
        result[cat][seen[r['month']]] = _d(r['total'])
    return result


# ---------------------------------------------------------------------------
# Metrics container
# ---------------------------------------------------------------------------

@dataclass
class InsightMetrics:
    """Aggregated snapshot used by the insight rules."""

    period_start: Optional[date] = None
    period_end: Optional[date] = None
    months_analyzed: int = 0

    total_income: Decimal = ZERO
    total_expense: Decimal = ZERO
    monthly_avg_income: Decimal = ZERO
    monthly_avg_expense: Decimal = ZERO
    net_cash_flow: Decimal = ZERO
    savings_rate: Decimal = ZERO

    monthly_income: List[Decimal] = field(default_factory=list)
    monthly_expense: List[Decimal] = field(default_factory=list)

    budgets: List[BudgetCategory] = field(default_factory=list)
    expense_by_category: List[Tuple[str, Decimal]] = field(default_factory=list)
    monthly_category_expense: Dict[str, List[Decimal]] = field(default_factory=dict)

    active_goals: int = 0
    goals_total_target: Decimal = ZERO
    goals_total_saved: Decimal = ZERO
    most_funded_goal: Optional[Goal] = None

    recurring_monthly_expense: Decimal = ZERO


# ---------------------------------------------------------------------------
# Data gathering
# ---------------------------------------------------------------------------

def gather_context(user, project=None, period_end: Optional[date] = None,
                   months: int = 6) -> InsightMetrics:
    """Build an ``InsightMetrics`` snapshot from the data sources."""
    period_end = period_end or timezone.localdate()
    period_start = period_end - timedelta(days=30 * months) + timedelta(days=1)

    txn_qs = Transaction.objects.filter(
        user=user, date__gte=period_start, date__lte=period_end,
        **({'project': project} if project else {}),
    )

    income = _d(txn_qs.filter(type='income').aggregate(s=Sum('amount'))['s'])
    expense = _d(txn_qs.filter(type='expense').aggregate(s=Sum('amount'))['s'])

    monthly = (
        txn_qs.annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(
            inc=Sum('amount', filter=Q(type='income')),
            exp=Sum('amount', filter=Q(type='expense')),
        )
        .order_by('month')
    )
    monthly_income = [_d(m['inc']) for m in monthly]
    monthly_expense = [_d(m['exp']) for m in monthly]
    months_analyzed = max(len(monthly_income), 1)

    monthly_avg_income = (income / Decimal(str(months_analyzed))) if income > 0 else ZERO
    monthly_avg_expense = (expense / Decimal(str(months_analyzed))) if expense > 0 else ZERO
    net_cash_flow = income - expense
    savings_rate = _pct(net_cash_flow, income)

    budgets = list(BudgetCategory.objects.filter(
        user=user, **({'project': project} if project else {}),
    ))

    by_cat = list(
        txn_qs.filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    expense_by_category = [(c['category__name'] or 'Uncategorized', _d(c['total'])) for c in by_cat]

    goals = Goal.objects.filter(
        user=user, **({'project': project} if project else {}),
    )
    goals_target = _d(goals.aggregate(s=Sum('target_amount'))['s'])
    goals_saved = _d(goals.aggregate(s=Sum('current_amount'))['s'])
    active_goals = goals.filter(status='active').count()
    most_funded: Optional[Goal] = None
    best_pct = ZERO
    for g in goals.filter(status='active'):
        pct = _pct(_d(g.current_amount), _d(g.target_amount))
        if pct >= best_pct:
            best_pct = pct
            most_funded = g

    recurring = RecurringRule.objects.filter(
        user=user, status='active', type='expense',
        **({'project': project} if project else {}),
    )
    recurring_monthly = ZERO
    for rule in recurring:
        recurring_monthly += _normalize_to_monthly(rule.frequency, rule.interval, rule.amount)

    return InsightMetrics(
        period_start=period_start,
        period_end=period_end,
        months_analyzed=months_analyzed,
        total_income=income,
        total_expense=expense,
        monthly_avg_income=monthly_avg_income,
        monthly_avg_expense=monthly_avg_expense,
        net_cash_flow=net_cash_flow,
        savings_rate=savings_rate,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        budgets=budgets,
        expense_by_category=expense_by_category,
        monthly_category_expense=_monthly_expense_by_category(
            user, project, period_start, period_end
        ),
        active_goals=active_goals,
        goals_total_target=goals_target,
        goals_total_saved=goals_saved,
        most_funded_goal=most_funded,
        recurring_monthly_expense=recurring_monthly,
    )


def _normalize_to_monthly(frequency, interval, amount) -> Decimal:
    """Normalize a recurring rule's amount to a per-month figure."""
    interval = max(int(interval or 1), 1)
    per_occurrence = _d(amount)
    mapping = {
        'daily': 30,
        'weekly': 4.345,
        'monthly': 1,
        'quarterly': 1 / 3,
        'yearly': 1 / 12,
        'custom': 1 / interval,
    }
    factor = mapping.get(frequency, 1 / interval)
    return per_occurrence * Decimal(str(factor)) / Decimal(str(interval))


# ---------------------------------------------------------------------------
# Rule engine
# ---------------------------------------------------------------------------

@dataclass
class RuleContext:
    user: object
    project: object
    metrics: InsightMetrics


# Each rule returns a list of insight dicts. Keys map to the Insight model.
#   kind, title, description, severity, metadata, action_url
InsightRule = Callable[[RuleContext], List[Dict[str, object]]]

INSIGHT_RULES: List[Tuple[str, InsightRule]] = []


def register_rule(name: str):
    """Decorator to add an insight rule to the registry without editing core code."""
    def decorator(fn: InsightRule) -> InsightRule:
        INSIGHT_RULES.append((name, fn))
        return fn
    return decorator


@register_rule('spending_spike')
def _rule_spending_spike(ctx: RuleContext) -> List[Dict[str, object]]:
    """A category whose MoM expense grew > threshold%."""
    hits: List[Dict[str, object]] = []
    for cat, series in ctx.metrics.monthly_category_expense.items():
        if len(series) < 2:
            continue
        prev = series[-2]
        latest = series[-1]
        if prev <= 0 or latest <= 0:
            continue
        growth = _pct(latest - prev, prev)
        if growth >= SPENDING_SPIKE_THRESHOLD:
            hits.append({
                'key': f'spending_spike:{cat}',
                'kind': 'spending',
                'severity': 'negative',
                'title': f'{cat} spending up {growth:.0f}%',
                'description': (
                    f"Your spending on {cat} rose {growth:.0f}% compared to the "
                    f"previous month (from ₹{prev:,.0f} to ₹{latest:,.0f}). "
                    f"Consider reviewing recent {cat} transactions."
                ),
                'metadata': {
                    'category': cat,
                    'percentage': float(growth),
                    'amount': float(latest),
                },
                'action_url': '/dashboard/budget',
            })
    return hits


@register_rule('category_over_budget_drift')
def _rule_category_over_budget(ctx: RuleContext) -> List[Dict[str, object]]:
    """A category near/over budget with remaining days; suggest a cap."""
    hits: List[Dict[str, object]] = []
    today = ctx.metrics.period_end or timezone.localdate()
    days_in_month = (today.replace(day=28) + timedelta(days=4)).day
    remaining_days = max(days_in_month - today.day, 1)
    for b in ctx.metrics.budgets:
        if b.budgeted <= 0:
            continue
        usage = _pct(b.spent, b.budgeted)
        if usage >= 80:
            daily_remaining = float((b.budgeted - b.spent)) / remaining_days
            hits.append({
                'key': f'over_budget:{b.name}',
                'kind': 'alert',
                'severity': 'negative',
                'title': f'{b.name} budget {usage:.0f}% used',
                'description': (
                    f"You've used {usage:.0f}% of your {b.name} budget "
                    f"(₹{b.spent:,.0f} of ₹{b.budgeted:,.0f}). About {remaining_days} "
                    f"day(s) left — keep daily spend under ₹{daily_remaining:,.0f}."
                ),
                'metadata': {
                    'category': b.name,
                    'percentage': float(usage),
                    'amount': float(b.remaining if b.remaining > 0 else 0),
                },
                'action_url': '/dashboard/budget',
            })
    return hits


@register_rule('subscription_creep')
def _rule_subscription_creep(ctx: RuleContext) -> List[Dict[str, object]]:
    """Sum of recurring expense rules as % of income; if high, suggest review."""
    income = ctx.metrics.monthly_avg_income
    if income <= 0:
        return []
    pct = _pct(ctx.metrics.recurring_monthly_expense, income)
    if pct >= SUBSCRIPTION_CREEP_THRESHOLD:
        return [{
            'key': 'subscription_creep',
            'kind': 'saving',
            'severity': 'positive',
            'title': f'Recurring expenses are {pct:.0f}% of income',
            'description': (
                f"Your active recurring expenses total ₹{ctx.metrics.recurring_monthly_expense:,.0f}/mo "
                f"— about {pct:.0f}% of your income. Review subscriptions you no "
                f"longer use to free up cash flow."
            ),
            'metadata': {
                'percentage': float(pct),
                'amount': float(ctx.metrics.recurring_monthly_expense),
            },
            'action_url': '/dashboard/recurring',
        }]
    return []


@register_rule('savings_opportunity')
def _rule_savings_opportunity(ctx: RuleContext) -> List[Dict[str, object]]:
    """Positive savings rate but no active goals -> suggest a goal/SIP."""
    if ctx.metrics.savings_rate > 0 and ctx.metrics.active_goals == 0:
        return [{
            'key': 'savings_opportunity',
            'kind': 'investment',
            'severity': 'positive',
            'title': f'You are saving {ctx.metrics.savings_rate:.0f}% — put it to work',
            'description': (
                f"Your savings rate is {ctx.metrics.savings_rate:.0f}% but you have "
                f"no active goals. Set a goal or start a SIP to give those savings a purpose."
            ),
            'metadata': {'percentage': float(ctx.metrics.savings_rate)},
            'action_url': '/dashboard/goals',
        }]
    return []


@register_rule('goal_momentum')
def _rule_goal_momentum(ctx: RuleContext) -> List[Dict[str, object]]:
    """An active goal > threshold% funded -> celebrate + suggest top-up."""
    goal = ctx.metrics.most_funded_goal
    if goal is None:
        return []
    pct = _pct(_d(goal.current_amount), _d(goal.target_amount))
    if pct >= GOAL_MOMENTUM_THRESHOLD:
        return [{
            'key': f'goal_momentum:{goal.id}',
            'kind': 'goal',
            'severity': 'positive',
            'title': f'"{goal.title}" is {pct:.0f}% funded',
            'description': (
                f"Great progress — your goal \"{goal.title}\" is {pct:.0f}% funded "
                f"(₹{goal.current_amount:,.0f} of ₹{goal.target_amount:,.0f}). A small "
                f"top-up could close it out."
            ),
            'metadata': {
                'percentage': float(pct),
                'amount': float(goal.target_amount - goal.current_amount),
            },
            'action_url': '/dashboard/goals',
        }]
    return []


def evaluate_rules(ctx: RuleContext) -> List[Dict[str, object]]:
    """Run every registered rule against the context; return triggered insights."""
    results: List[Dict[str, object]] = []
    for _name, fn in INSIGHT_RULES:
        results.extend(fn(ctx))
    return results


# ---------------------------------------------------------------------------
# Persistence + generation
# ---------------------------------------------------------------------------

def generate_for_project(user, project=None, months: int = 6,
                         notify: bool = True) -> int:
    """Generate, dedupe, and persist insights for a project.

    Returns the number of insight rows created or updated. Re-running updates
    existing undismissed rows in place (keyed by ``dedup_key``) instead of
    creating duplicates; dismissed rows are left alone.
    """
    metrics = gather_context(user, project, months=months)
    ctx = RuleContext(user=user, project=project, metrics=metrics)
    hits = evaluate_rules(ctx)

    scope_filter = {'user': user}
    if project is not None:
        scope_filter['project'] = project

    changed = 0
    existing = {
        i.dedup_key: i for i in Insight.objects.filter(
            **scope_filter, dismissed=False,
        ).exclude(dedup_key='')
    }

    seen_keys = set()
    for hit in hits:
        rule_key = hit.get('key', 'unknown')
        dedup_key = f"insight:{rule_key}:{project or 'none'}"
        seen_keys.add(dedup_key)
        values = {
            'kind': hit.get('kind', 'alert'),
            'title': hit.get('title', ''),
            'description': hit.get('description', ''),
            'severity': hit.get('severity', 'neutral'),
            'metadata': hit.get('metadata', {}),
            'action_url': hit.get('action_url', ''),
            'generated_at': timezone.now(),
        }
        if dedup_key in existing:
            insight = existing[dedup_key]
            for attr, val in values.items():
                setattr(insight, attr, val)
            insight.save(update_fields=list(values.keys()))
        else:
            Insight.objects.create(
                user=user, project=project, dedup_key=dedup_key, **values,
            )
        changed += 1

    # Any previously-active insight whose rule no longer fires gets dismissed so
    # it disappears from the feed (its dedup_key won't be re-created).
    stale = Insight.objects.filter(
        **scope_filter, dismissed=False,
    ).exclude(dedup_key__in=seen_keys).exclude(dedup_key='')
    stale.update(dismissed=True)

    if notify and changed > 0:
        _maybe_notify(user, project, changed, hits[0].get('title') if hits else None)

    return changed


def generate_after_change(user, project=None, months: int = 6) -> int:
    """Defensive event hook for create/update/delete of financial data.

    Refreshes insights synchronously. Returns the number of rows created/updated,
    or 0 if the engine raised (defensive: an insight failure must never block the
    underlying financial write).
    """
    try:
        return generate_for_project(user, project, months=months, notify=True)
    except Exception:  # pragma: no cover - defensive
        return 0


def dismiss_insight(insight: Insight) -> Insight:
    """Mark an insight dismissed so it no longer appears in the feed."""
    if not insight.dismissed:
        insight.dismissed = True
        insight.save(update_fields=['dismissed'])
    return insight


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

def _maybe_notify(user, project, count: int, sample_title: Optional[str]) -> None:
    """Fire one 'new insights' Alert per day per project via dedup_key."""
    from .notifications import notify_insight_found
    notify_insight_found(user, project, count, sample_title)
