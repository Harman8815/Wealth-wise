"""
Financial Health Score Engine.

A project-scoped, explainable scoring service. It computes a single 0-100 score
from a set of independently weighted *dimensions*. Each dimension exposes its
raw metrics, a normalized 0-100 sub-score, its configured weight, the resulting
contribution to the final score, a human explanation, and recommended
improvements.

Design goals (per the task spec):

* **Modular weighted scoring** - weights are configurable (DB-backed
  ``ScoreDimensionConfig``) and fall back to ``DEFAULT_DIMENSION_WEIGHTS``.
* **Explainable** - every number is traceable through the ``dimensions`` breakdown.
* **Configurable rule engine** - conditions live in a registry
  (``RULE_REGISTRY``) and can be extended without touching the scorer.
* **Independent of the UI** - pure functions over querysets; the API layer only
  calls ``compute_score`` / ``recompute_for_project``.
* **Event-driven & incremental** - ``recompute_for_project`` is the single
  integration point called when financial data changes; callers may request a
  narrow analysis window to refresh only the affected metrics.

The engine is the single integration point for Budgets, Transactions, Goals,
Accounts, Recurring rules and the Notification engine.
"""
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Callable, Dict, List, Optional, Tuple

from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date, timedelta

from ..models import (
    Transaction,
    BudgetCategory,
    Goal,
    Account,
    RecurringRule,
    ScoreDimensionConfig,
    FinancialHealthScore,
    HealthRecommendation,
    DIMENSION_KEYS,
    DIMENSION_LABELS,
    DEFAULT_DIMENSION_WEIGHTS,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ZERO = Decimal('0')
ONE_HUNDRED = Decimal('100')


def _d(value) -> Decimal:
    """Coerce a value (Decimal/int/float/None) to a Decimal."""
    if value is None:
        return ZERO
    try:
        return Decimal(str(value))
    except (TypeError, ValueError):
        return ZERO


def _clamp(value: Decimal, low: Decimal = ZERO, high: Decimal = ONE_HUNDRED) -> Decimal:
    return max(low, min(high, value))


def _pct(numerator: Decimal, denominator: Decimal) -> Decimal:
    if denominator <= 0:
        return ZERO
    return (numerator / denominator) * ONE_HUNDRED


# ---------------------------------------------------------------------------
# Metrics container
# ---------------------------------------------------------------------------

@dataclass
class FinancialMetrics:
    """Raw, derived numbers used by the dimension scorers.

    Populated once per ``compute_score`` call from the data sources so every
    dimension works off the same consistent snapshot.
    """

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
    monthly_net: List[Decimal] = field(default_factory=list)

    total_budgeted: Decimal = ZERO
    total_spent: Decimal = ZERO
    budget_categories: int = 0
    budget_overspent_categories: int = 0
    budget_overall_usage: Decimal = ZERO

    expense_by_category: List[Tuple[str, Decimal]] = field(default_factory=list)
    largest_category_share: Decimal = ZERO

    goals_total_target: Decimal = ZERO
    goals_total_saved: Decimal = ZERO
    goals_overall_pct: Decimal = ZERO
    active_goals: int = 0
    completed_goals: int = 0

    total_balance: Decimal = ZERO
    active_accounts: int = 0
    low_balance_accounts: int = 0

    recurring_monthly_commitment: Decimal = ZERO
    missed_recurring: int = 0

    large_transaction_count: int = 0
    negative_months: int = 0


# ---------------------------------------------------------------------------
# Data gathering
# ---------------------------------------------------------------------------

def gather_metrics(user, project=None, period_end: Optional[date] = None,
                   months: int = 6) -> FinancialMetrics:
    """Build a ``FinancialMetrics`` snapshot from the data sources."""
    period_end = period_end or timezone.localdate()
    period_start = period_end - timedelta(days=30 * months) + timedelta(days=1)

    txn_qs = Transaction.objects.filter(
        user=user, date__gte=period_start, date__lte=period_end,
        **({'project': project} if project else {}),
    )

    income = _d(txn_qs.filter(type='income').aggregate(s=Sum('amount'))['s'])
    expense = _d(txn_qs.filter(type='expense').aggregate(s=Sum('amount'))['s'])

    monthly = (
        txn_qs.annotate(month=_date_trunc('date'))
        .values('month')
        .annotate(
            inc=Sum('amount', filter=Q(type='income')),
            exp=Sum('amount', filter=Q(type='expense')),
        )
        .order_by('month')
    )
    monthly_income = [_d(m['inc']) for m in monthly]
    monthly_expense = [_d(m['exp']) for m in monthly]
    monthly_net = [monthly_income[i] - monthly_expense[i] for i in range(len(monthly_income))]
    months_analyzed = max(len(monthly_income), 1)

    monthly_avg_income = (income / Decimal(str(months_analyzed))) if income > 0 else ZERO
    monthly_avg_expense = (expense / Decimal(str(months_analyzed))) if expense > 0 else ZERO
    net_cash_flow = income - expense
    savings_rate = _pct(net_cash_flow, income)

    budgets = BudgetCategory.objects.filter(
        user=user, **({'project': project} if project else {}),
    )
    total_budgeted = _d(budgets.aggregate(s=Sum('budgeted'))['s'])
    total_spent = _d(budgets.aggregate(s=Sum('spent'))['s'])
    overspent = sum(1 for b in budgets if b.budgeted > 0 and b.spent > b.budgeted)
    budget_usage = _pct(total_spent, total_budgeted)

    by_cat = list(
        txn_qs.filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    expense_by_category = [(c['category__name'] or 'Uncategorized', _d(c['total'])) for c in by_cat]
    largest_share = ZERO
    if expense > 0 and expense_by_category:
        largest_share = _pct(expense_by_category[0][1], expense)

    goals = Goal.objects.filter(
        user=user, **({'project': project} if project else {}),
    )
    goals_target = _d(goals.aggregate(s=Sum('target_amount'))['s'])
    goals_saved = _d(goals.aggregate(s=Sum('current_amount'))['s'])
    goals_pct = _pct(goals_saved, goals_target)
    active_goals = goals.filter(status='active').count()
    completed_goals = goals.filter(status='completed').count()

    accounts = Account.objects.filter(
        user=user, **({'project': project} if project else {}),
    )
    total_balance = _d(accounts.aggregate(s=Sum('balance'))['s'])
    active_accounts = accounts.filter(is_active=True).count()
    low_balance = accounts.filter(is_active=True, balance__lt=Decimal('5000')).count()

    recurring = RecurringRule.objects.filter(
        user=user, status='active', type='expense',
        **({'project': project} if project else {}),
    )
    monthly_commitment = ZERO
    for rule in recurring:
        monthly_commitment += _normalize_to_monthly(rule.frequency, rule.interval, rule.amount)
    missed = recurring.filter(
        last_execution_date__isnull=False,
        next_execution_date__lt=period_end - timedelta(days=7),
    ).count()

    large_txns = txn_qs.filter(type='expense', amount__gte=Decimal('15000')).count()
    negative_months = sum(1 for n in monthly_net if n < 0)

    return FinancialMetrics(
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
        monthly_net=monthly_net,
        total_budgeted=total_budgeted,
        total_spent=total_spent,
        budget_categories=budgets.count(),
        budget_overspent_categories=overspent,
        budget_overall_usage=budget_usage,
        expense_by_category=expense_by_category,
        largest_category_share=largest_share,
        goals_total_target=goals_target,
        goals_total_saved=goals_saved,
        goals_overall_pct=goals_pct,
        active_goals=active_goals,
        completed_goals=completed_goals,
        total_balance=total_balance,
        active_accounts=active_accounts,
        low_balance_accounts=low_balance,
        recurring_monthly_commitment=monthly_commitment,
        missed_recurring=missed,
        large_transaction_count=large_txns,
        negative_months=negative_months,
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


def _date_trunc(field_name: str):
    """Return a TruncMonth expression (lazy import to avoid heavy load)."""
    from django.db.models.functions import TruncMonth
    return TruncMonth(field_name)


# ---------------------------------------------------------------------------
# Dimension scorers
# ---------------------------------------------------------------------------

@dataclass
class DimensionResult:
    key: str
    label: str
    raw_metrics: Dict[str, object]
    normalized_score: Decimal
    weight: Decimal
    contribution: Decimal
    explanation: str
    recommendations: List[Dict[str, object]]

    def __dict_for_storage__(self) -> Dict[str, object]:
        return {
            'key': self.key,
            'label': self.label,
            'raw_metrics': self.raw_metrics,
            'normalized_score': float(self.normalized_score),
            'weight': float(self.weight),
            'contribution': float(self.contribution),
            'explanation': self.explanation,
            'recommendations': self.recommendations,
        }


def _std_dev(values: List[Decimal]) -> Decimal:
    if len(values) < 2:
        return ZERO
    mean = sum(values) / Decimal(str(len(values)))
    variance = sum(((v - mean) ** 2 for v in values)) / Decimal(str(len(values) - 1))
    return variance.sqrt()


def _score_budget_management(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'total_budgeted': float(m.total_budgeted),
        'total_spent': float(m.total_spent),
        'overspent_categories': m.budget_overspent_categories,
        'budget_categories': m.budget_categories,
        'overall_usage_pct': float(m.budget_overall_usage),
    }
    recommendations = []
    if m.budget_categories == 0:
        score = Decimal('40')
        explanation = "No budgets are set up yet. Creating category budgets is the fastest way to gain control."
        recommendations.append({
            'title': 'Set up category budgets',
            'detail': 'Allocate a monthly budget to your top spending categories.',
            'estimated_improvement': 15,
            'priority': 'high',
        })
    else:
        overspent_penalty = Decimal(str(m.budget_overspent_categories)) * Decimal('8')
        usage_penalty = max(ZERO, m.budget_overall_usage - Decimal('80')) * Decimal('0.5')
        share_penalty = max(ZERO, m.largest_category_share - Decimal('50')) * Decimal('0.3')
        score = _clamp(ONE_HUNDRED - overspent_penalty - usage_penalty - share_penalty)
        if m.budget_overspent_categories > 0:
            recommendations.append({
                'title': f"Trim {m.budget_overspent_categories} over-budget "
                         f"{'category' if m.budget_overspent_categories == 1 else 'categories'}",
                'detail': 'Spending exceeds the allocated budget in these categories.',
                'estimated_improvement': float(min(Decimal('10'), Decimal(str(m.budget_overspent_categories)) * 3)),
                'priority': 'high',
            })
        explanation = (
            f"{m.budget_categories} budget categories tracked; "
            f"{m.budget_overspent_categories} overspent, overall usage "
            f"{m.budget_overall_usage:.0f}%."
        )
    return DimensionResult(
        'budget_management', DIMENSION_LABELS['budget_management'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['budget_management'],
        score * DEFAULT_DIMENSION_WEIGHTS['budget_management'],
        explanation, recommendations,
    )


def _score_cash_flow_stability(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'net_cash_flow': float(m.net_cash_flow),
        'negative_months': m.negative_months,
        'months_analyzed': m.months_analyzed,
        'monthly_net_stdev': float(_std_dev(m.monthly_net)),
    }
    recommendations = []
    if m.months_analyzed < 2 or m.total_income <= 0:
        score = Decimal('50')
        explanation = "Not enough income history to assess cash-flow stability."
    else:
        positive_ratio = Decimal(str((m.months_analyzed - m.negative_months) / max(m.months_analyzed, 1)))
        stability = max(ZERO, ONE_HUNDRED - _std_dev(m.monthly_net))
        score = _clamp(positive_ratio * Decimal('60') + stability * Decimal('0.4'))
        if m.negative_months > 0:
            recommendations.append({
                'title': 'Avoid months with negative cash flow',
                'detail': f'{m.negative_months} of the last {m.months_analyzed} months ended in the red.',
                'estimated_improvement': float(min(Decimal('12'), Decimal(str(m.negative_months)) * 4)),
                'priority': 'high',
            })
        explanation = (
            f"Net cash flow {m.net_cash_flow:.0f} over the window; "
            f"{m.negative_months} negative month(s) of {m.months_analyzed}."
        )
    return DimensionResult(
        'cash_flow_stability', DIMENSION_LABELS['cash_flow_stability'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['cash_flow_stability'],
        score * DEFAULT_DIMENSION_WEIGHTS['cash_flow_stability'],
        explanation, recommendations,
    )


def _score_savings_ratio(m: FinancialMetrics) -> DimensionResult:
    raw = {'savings_rate_pct': float(m.savings_rate), 'net_cash_flow': float(m.net_cash_flow)}
    recommendations = []
    rate = m.savings_rate
    if rate <= 0:
        score = ZERO
        explanation = "Expenses exceed income; you are not currently saving."
        recommendations.append({
            'title': 'Move to a positive savings rate',
            'detail': 'Reduce discretionary spending until income exceeds expenses.',
            'estimated_improvement': 20,
            'priority': 'high',
        })
    else:
        score = _clamp(rate * Decimal('5'))
        if rate < 20:
            recommendations.append({
                'title': 'Increase your savings rate',
                'detail': f'Current savings rate is {rate:.0f}%. Aim for at least 20%.',
                'estimated_improvement': float(min(Decimal('15'), Decimal('20') - rate / 2)),
                'priority': 'medium',
            })
        explanation = f"Savings rate is {rate:.0f}% of income."
    return DimensionResult(
        'savings_ratio', DIMENSION_LABELS['savings_ratio'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['savings_ratio'],
        score * DEFAULT_DIMENSION_WEIGHTS['savings_ratio'],
        explanation, recommendations,
    )


def _score_income_stability(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'monthly_avg_income': float(m.monthly_avg_income),
        'income_stdev': float(_std_dev(m.monthly_income)),
        'months_analyzed': m.months_analyzed,
    }
    recommendations = []
    if m.months_analyzed < 2 or m.monthly_avg_income <= 0:
        score = Decimal('50')
        explanation = "Not enough income history to assess stability."
    else:
        mean = m.monthly_avg_income
        cv = (_std_dev(m.monthly_income) / mean) if mean > 0 else ONE_HUNDRED
        score = _clamp(ONE_HUNDRED - cv * ONE_HUNDRED)
        if cv > Decimal('0.5'):
            recommendations.append({
                'title': 'Stabilize your income',
                'detail': 'Income varies significantly month to month; build a buffer for lean months.',
                'estimated_improvement': 8,
                'priority': 'low',
            })
        explanation = f"Income varies by ~{cv * 100:.0f}% month to month."
    return DimensionResult(
        'income_stability', DIMENSION_LABELS['income_stability'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['income_stability'],
        score * DEFAULT_DIMENSION_WEIGHTS['income_stability'],
        explanation, recommendations,
    )


def _score_expense_distribution(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'largest_category_share_pct': float(m.largest_category_share),
        'top_categories': [c[0] for c in m.expense_by_category[:3]],
    }
    recommendations = []
    share = m.largest_category_share
    score = _clamp(ONE_HUNDRED - max(ZERO, share - Decimal('30')) * Decimal('2'))
    if share > 50:
        recommendations.append({
            'title': 'Diversify your spending',
            'detail': f'Your top category is {share:.0f}% of all spending; spread it out.',
            'estimated_improvement': 6,
            'priority': 'low',
        })
    explanation = (
        f"Largest category is {share:.0f}% of spending."
        if m.expense_by_category else "No expense data to analyze."
    )
    return DimensionResult(
        'expense_distribution', DIMENSION_LABELS['expense_distribution'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['expense_distribution'],
        score * DEFAULT_DIMENSION_WEIGHTS['expense_distribution'],
        explanation, recommendations,
    )


def _score_spending_behaviour(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'large_transaction_count': m.large_transaction_count,
        'avg_monthly_expense': float(m.monthly_avg_expense),
        'recurring_commitment': float(m.recurring_monthly_commitment),
    }
    recommendations = []
    commitment_ratio = _pct(m.recurring_monthly_commitment, m.monthly_avg_income) if m.monthly_avg_income > 0 else ZERO
    score = _clamp(ONE_HUNDRED - commitment_ratio * Decimal('0.5') - Decimal(str(m.large_transaction_count)) * 2)
    if commitment_ratio > 60:
        recommendations.append({
            'title': 'Reduce fixed commitments',
            'detail': f'{commitment_ratio:.0f}% of income is locked into recurring expenses.',
            'estimated_improvement': 7,
            'priority': 'medium',
        })
    explanation = (
        f"{m.large_transaction_count} large transactions; recurring commitments are "
        f"{commitment_ratio:.0f}% of income."
    )
    return DimensionResult(
        'spending_behaviour', DIMENSION_LABELS['spending_behaviour'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['spending_behaviour'],
        score * DEFAULT_DIMENSION_WEIGHTS['spending_behaviour'],
        explanation, recommendations,
    )


def _score_goal_progress(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'goals_overall_pct': float(m.goals_overall_pct),
        'active_goals': m.active_goals,
        'completed_goals': m.completed_goals,
    }
    recommendations = []
    if m.active_goals == 0 and m.completed_goals == 0:
        score = Decimal('40')
        explanation = "No financial goals set yet."
        recommendations.append({
            'title': 'Create a savings goal',
            'detail': 'Goals give your saving a purpose and improve discipline scores.',
            'estimated_improvement': 8,
            'priority': 'medium',
        })
    else:
        score = _clamp(m.goals_overall_pct)
        if m.goals_overall_pct < 50 and m.active_goals > 0:
            recommendations.append({
                'title': 'Accelerate goal contributions',
                'detail': f'Goals are {m.goals_overall_pct:.0f}% funded on average.',
                'estimated_improvement': 6,
                'priority': 'low',
            })
        explanation = (
            f"Goals are {m.goals_overall_pct:.0f}% funded "
            f"({m.active_goals} active, {m.completed_goals} completed)."
        )
    return DimensionResult(
        'goal_progress', DIMENSION_LABELS['goal_progress'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['goal_progress'],
        score * DEFAULT_DIMENSION_WEIGHTS['goal_progress'],
        explanation, recommendations,
    )


def _score_financial_discipline(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'low_balance_accounts': m.low_balance_accounts,
        'active_accounts': m.active_accounts,
        'budget_categories': m.budget_categories,
    }
    recommendations = []
    signals = 0
    total = 0
    if m.active_accounts > 0:
        total += 1
        if m.low_balance_accounts > 0:
            signals += 1
    if m.budget_categories > 0:
        total += 1
    else:
        signals += 1
    if m.total_balance <= 0:
        signals += 1
        total += 1
    score = _clamp(ONE_HUNDRED - Decimal(str(signals)) * Decimal('25'))
    if m.low_balance_accounts > 0:
        recommendations.append({
            'title': 'Maintain a cash buffer',
            'detail': f'{m.low_balance_accounts} account(s) are below the safety threshold.',
            'estimated_improvement': 4,
            'priority': 'low',
        })
    explanation = f"{signals} discipline risk signal(s) detected across {max(total, 1)} checks."
    return DimensionResult(
        'financial_discipline', DIMENSION_LABELS['financial_discipline'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['financial_discipline'],
        score * DEFAULT_DIMENSION_WEIGHTS['financial_discipline'],
        explanation, recommendations,
    )


def _score_recurring_commitments(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'missed_recurring': m.missed_recurring,
        'monthly_commitment': float(m.recurring_monthly_commitment),
    }
    recommendations = []
    score = _clamp(ONE_HUNDRED - Decimal(str(m.missed_recurring)) * Decimal('15'))
    if m.missed_recurring > 0:
        recommendations.append({
            'title': 'Catch up missed recurring payments',
            'detail': f'{m.missed_recurring} recurring obligation(s) appear overdue.',
            'estimated_improvement': float(min(Decimal('10'), Decimal(str(m.missed_recurring)) * 5)),
            'priority': 'high',
        })
    explanation = (
        f"{m.missed_recurring} missed recurring payment(s)."
        if m.recurring_monthly_commitment > 0
        else "No recurring commitments tracked."
    )
    return DimensionResult(
        'recurring_commitments', DIMENSION_LABELS['recurring_commitments'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['recurring_commitments'],
        score * DEFAULT_DIMENSION_WEIGHTS['recurring_commitments'],
        explanation, recommendations,
    )


def _score_risk_indicators(m: FinancialMetrics) -> DimensionResult:
    raw = {
        'negative_months': m.negative_months,
        'large_transaction_count': m.large_transaction_count,
        'savings_rate_pct': float(m.savings_rate),
    }
    recommendations = []
    risk = 0
    if m.savings_rate < 0:
        risk += 1
    if m.negative_months >= 2:
        risk += 1
    if m.large_transaction_count >= 3:
        risk += 1
    score = _clamp(ONE_HUNDRED - Decimal(str(risk)) * Decimal('30'))
    if risk > 0:
        recommendations.append({
            'title': 'Reduce financial risk exposure',
            'detail': 'Multiple risk indicators active (negative savings, volatile months, large spends).',
            'estimated_improvement': float(min(Decimal('10'), Decimal(str(risk)) * 4)),
            'priority': 'medium',
        })
    explanation = f"{risk} active risk indicator(s)."
    return DimensionResult(
        'risk_indicators', DIMENSION_LABELS['risk_indicators'], raw, score,
        DEFAULT_DIMENSION_WEIGHTS['risk_indicators'],
        score * DEFAULT_DIMENSION_WEIGHTS['risk_indicators'],
        explanation, recommendations,
    )


DIMENSION_SCORERS = {
    'budget_management': _score_budget_management,
    'cash_flow_stability': _score_cash_flow_stability,
    'savings_ratio': _score_savings_ratio,
    'income_stability': _score_income_stability,
    'expense_distribution': _score_expense_distribution,
    'spending_behaviour': _score_spending_behaviour,
    'goal_progress': _score_goal_progress,
    'financial_discipline': _score_financial_discipline,
    'recurring_commitments': _score_recurring_commitments,
    'risk_indicators': _score_risk_indicators,
}


# ---------------------------------------------------------------------------
# Configurable rule engine
# ---------------------------------------------------------------------------

@dataclass
class RuleContext:
    user: object
    project: object
    metrics: FinancialMetrics
    dimensions: Dict[str, DimensionResult]


RuleFn = Callable[[RuleContext], List[Dict[str, object]]]
RULE_REGISTRY: List[Tuple[str, RuleFn]] = []


def register_rule(name: str):
    """Decorator to add a rule to the engine without editing core code."""
    def decorator(fn: RuleFn) -> RuleFn:
        RULE_REGISTRY.append((name, fn))
        return fn
    return decorator


@register_rule('budget_health_deteriorated')
def _rule_budget_health(ctx: RuleContext) -> List[Dict[str, object]]:
    if ctx.metrics.budget_overspent_categories > 0:
        return [{
            'key': 'budget_health_deteriorated',
            'severity': 'risk',
            'title': 'Budget health deteriorating',
            'message': f"{ctx.metrics.budget_overspent_categories} budget "
                       f"{'category is' if ctx.metrics.budget_overspent_categories == 1 else 'categories are'} over budget.",
        }]
    return []


@register_rule('financial_risk_increased')
def _rule_risk_increased(ctx: RuleContext) -> List[Dict[str, object]]:
    if ctx.metrics.negative_months >= 2 or ctx.metrics.savings_rate < 0:
        return [{
            'key': 'financial_risk_increased',
            'severity': 'risk',
            'title': 'Financial risk increased',
            'message': 'Cash flow has been negative in multiple recent months.',
        }]
    return []


@register_rule('savings_improved')
def _rule_savings_improved(ctx: RuleContext) -> List[Dict[str, object]]:
    if ctx.metrics.savings_rate >= 20:
        return [{
            'key': 'savings_improved',
            'severity': 'positive',
            'title': 'Healthy savings habit',
            'message': f"Your savings rate is {ctx.metrics.savings_rate:.0f}%, above the 20% target.",
        }]
    return []


def evaluate_rules(ctx: RuleContext) -> List[Dict[str, object]]:
    """Run every registered rule against the context; return triggered alerts."""
    results: List[Dict[str, object]] = []
    for _name, fn in RULE_REGISTRY:
        results.extend(fn(ctx))
    return results


# ---------------------------------------------------------------------------
# Score computation
# ---------------------------------------------------------------------------

def resolve_weights(user, project=None) -> Dict[str, Decimal]:
    """Return effective weights, merging DB config over built-in defaults."""
    weights = {k: DEFAULT_DIMENSION_WEIGHTS[k] for k in DIMENSION_KEYS}
    configs = ScoreDimensionConfig.objects.filter(
        user=user, **({'project': project} if project else {}),
    )
    for cfg in configs:
        if cfg.dimension in weights:
            weights[cfg.dimension] = cfg.weight if cfg.enabled else ZERO
    return weights


@dataclass
class ScoreResult:
    score: Decimal
    grade: str
    grade_label: str
    dimensions: List[DimensionResult]
    strengths: List[Dict[str, object]]
    risks: List[Dict[str, object]]
    recommendations: List[Dict[str, object]]
    metrics: FinancialMetrics
    previous_score: Optional[Decimal]


def compute_score(user, project=None, period_end: Optional[date] = None,
                  months: int = 6, previous_score: Optional[Decimal] = None) -> ScoreResult:
    """Compute a full, explainable score from current data (read-only)."""
    metrics = gather_metrics(user, project, period_end, months)
    weights = resolve_weights(user, project)

    dimensions: List[DimensionResult] = []
    for key in DIMENSION_KEYS:
        scorer = DIMENSION_SCORERS[key]
        result = scorer(metrics)
        result.weight = weights[key]
        result.contribution = result.normalized_score * weights[key]
        dimensions.append(result)

    total_weight = sum((d.weight for d in dimensions), ZERO) or ONE_HUNDRED
    final_score = _clamp(
        sum((d.contribution for d in dimensions), ZERO) / total_weight * ONE_HUNDRED
    )

    from ..models import grade_for_score
    grade_letter, grade_label = grade_for_score(final_score)

    ranked = sorted(dimensions, key=lambda d: d.normalized_score, reverse=True)
    strengths = [
        {'dimension': d.key, 'label': d.label, 'score': float(d.normalized_score),
         'explanation': d.explanation}
        for d in ranked[:3] if d.normalized_score >= 60
    ]
    risks = [
        {'dimension': d.key, 'label': d.label, 'score': float(d.normalized_score),
         'explanation': d.explanation}
        for d in sorted(dimensions, key=lambda d: d.normalized_score)[:3] if d.normalized_score < 60
    ]

    ctx = RuleContext(user=user, project=project, metrics=metrics,
                      dimensions={d.key: d for d in dimensions})
    rule_hits = evaluate_rules(ctx)

    recommendations: List[Dict[str, object]] = []
    for d in dimensions:
        for rec in d.recommendations:
            recommendations.append({'dimension': d.key, **rec})
    for hit in rule_hits:
        if hit.get('severity') == 'risk':
            recommendations.append({
                'dimension': 'risk_indicators',
                'title': hit['title'],
                'detail': hit.get('message', ''),
                'estimated_improvement': 5,
                'priority': 'high',
            })

    return ScoreResult(
        score=final_score,
        grade=grade_letter,
        grade_label=grade_label,
        dimensions=dimensions,
        strengths=strengths,
        risks=risks,
        recommendations=recommendations,
        metrics=metrics,
        previous_score=previous_score,
    )


# ---------------------------------------------------------------------------
# Persistence + event-driven recompute
# ---------------------------------------------------------------------------

def persist_score(user, project, result: ScoreResult) -> FinancialHealthScore:
    """Store a score snapshot and its recommendations. Returns the snapshot."""
    snapshot = FinancialHealthScore.objects.create(
        user=user,
        project=project,
        score=result.score,
        grade=result.grade,
        grade_label=result.grade_label,
        previous_score=result.previous_score,
        dimensions=[d.__dict_for_storage__() for d in result.dimensions],
        strengths=result.strengths,
        risks=result.risks,
        period_start=result.metrics.period_start,
        period_end=result.metrics.period_end,
        computed_at=timezone.now(),
    )
    HealthRecommendation.objects.filter(
        user=user, **({'project': project} if project else {}),
        resolved=False, score_snapshot__isnull=True,
    ).update(resolved=True)

    for rec in result.recommendations:
        HealthRecommendation.objects.create(
            user=user,
            project=project,
            score_snapshot=snapshot,
            dimension=rec.get('dimension', 'risk_indicators'),
            title=rec.get('title', ''),
            detail=rec.get('detail', ''),
            estimated_improvement=_d(rec.get('estimated_improvement', 0)),
            priority=rec.get('priority', 'medium'),
        )
    return snapshot


def recompute_for_project(user, project=None, months: int = 6,
                          notify: bool = True) -> FinancialHealthScore:
    """Recompute, persist, and (optionally) notify about a project's score.

    Single entry point the event hooks call when financial data changes.
    """
    previous = FinancialHealthScore.objects.filter(
        user=user, **({'project': project} if project else {}),
    ).order_by('-computed_at').first()
    previous_score = previous.score if previous else None

    result = compute_score(user, project, months=months, previous_score=previous_score)
    snapshot = persist_score(user, project, result)

    if notify:
        _maybe_notify(user, project, snapshot, result, previous_score)
    return snapshot


def recompute_after_change(user, project=None, months: int = 6) -> Optional[FinancialHealthScore]:
    """Lightweight event hook for create/update/delete of financial data.

    Recomputes the score synchronously for the affected project. Returns the
    new snapshot, or ``None`` if the engine raised (defensive: a scoring failure
    must never block the underlying write operation). Also refreshes the dynamic
    AI insights feed via the same defensive pattern.
    """
    try:
        snapshot = recompute_for_project(user, project, months=months, notify=True)
    except Exception:  # pragma: no cover - defensive
        snapshot = None
    # Refresh insights independently so a health-score failure never blocks it
    # (and vice versa). Imported lazily to avoid a circular import.
    try:
        from .insights import generate_after_change
        generate_after_change(user, project, months=months)
    except Exception:  # pragma: no cover - defensive
        pass
    return snapshot


def _maybe_notify(user, project, snapshot, result: ScoreResult, previous_score):
    """Fire notifications for significant changes / new recommendations."""
    from .notifications import notify_financial_health

    if previous_score is not None:
        delta = snapshot.score - previous_score
        if delta >= Decimal('5'):
            notify_financial_health(user, project, 'improved', snapshot, delta)
        elif delta <= Decimal('-5'):
            notify_financial_health(user, project, 'dropped', snapshot, -delta)

    rule_keys = {r.get('key') for r in evaluate_rules(
        RuleContext(user=user, project=project, metrics=result.metrics,
                    dimensions={d.key: d for d in result.dimensions}))}
    if 'financial_risk_increased' in rule_keys:
        notify_financial_health(user, project, 'risk', snapshot, None)
    if 'budget_health_deteriorated' in rule_keys:
        notify_financial_health(user, project, 'budget', snapshot, None)

    if result.recommendations:
        notify_financial_health(user, project, 'recommendations', snapshot, None)
