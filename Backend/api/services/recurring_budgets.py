"""
Recurring budget generation service.

Bridges the reusable scheduling engine with the data layer for the recurring
budgets platform. It computes the next generation date for a ``RecurringBudget``,
materialises a fresh set of ``BudgetCategory`` rows when a period begins, records
``RecurringBudgetExecution`` history, prevents duplicate generations, and catches
up on overdue periods. Notifications for budget lifecycle events are published
through the Notification Engine.

Generation strategies (see ``RecurringBudget.STRATEGY_CHOICES``):
- copy_exact         : reproduce previous allocations, keep spent as-is.
- copy_structure     : copy category skeleton, reset spent to zero.
- reset_spent        : alias of copy_structure (explicit zeroing).
- carry_forward      : seed each category's spent with leftover from prior period.
- increase_percent   : scale every allocation up by ``adjustment_percent``.
- decrease_percent   : scale every allocation down by ``adjustment_percent``.
- auto_adjust        : like copy_structure but flags for future AI rebalancing.

The engine is intentionally decoupled from the UI so the same logic can back
future planning features (seasonal budgets, shared family budgets, etc.).
"""
from datetime import date, timedelta
from typing import Dict, List, Optional

from django.db import transaction
from django.utils import timezone

from ..models import RecurringBudget, RecurringBudgetExecution, BudgetCategory, Category
from .scheduling import next_occurrence, preview_occurrences
from .notifications import notify_recurring_budget_generated, notify_recurring_budget_failed


def recompute_next_generation(rule: RecurringBudget) -> Optional[date]:
    """Recompute and persist ``next_generation_date`` for ``rule``."""
    after = rule.last_generation_date or (rule.start_date - timedelta(days=1))
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

    rule.next_generation_date = nxt
    if nxt is None:
        rule.status = 'completed'
    rule.save(update_fields=['next_generation_date', 'status', 'updated_at'])
    return nxt


def get_upcoming_preview(rule: RecurringBudget, count: int = 5) -> List[date]:
    """Preview the next generation dates for a rule (for display)."""
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


def _scale_budgeted(amount, percent: float) -> float:
    """Scale ``amount`` by ``percent`` (positive increases, negative decreases)."""
    if percent is None:
        return float(amount)
    return float(amount) * (1 + float(percent) / 100)


def _build_allocations(rule: RecurringBudget) -> List[Dict]:
    """Return the list of category allocations to materialise for this period.

    The strategy decides how the template/previous budget is transformed into the
    allocations for the new period. ``spent`` is always initialised here (the
    budget behaves exactly like a manually created budget).
    """
    template = list(rule.categories or [])

    # When copying from the previous generated budget, prefer its last snapshot.
    if rule.strategy == 'copy_exact' and rule.generation_count > 0:
        last = rule.executions.exclude(generated_budgets=[]).order_by('-scheduled_date').first()
        if last and last.generated_budgets:
            template = [
                {
                    'name': c.get('name'),
                    'budgeted': c.get('budgeted', 0),
                    'spent': c.get('spent', 0),
                    'color': c.get('color', '#3b82f6'),
                    'symbol': c.get('symbol', 'utensils'),
                    'category': c.get('category'),
                }
                for c in last.generated_budgets
            ]

    allocations: List[Dict] = []
    for item in template:
        name = item.get('name')
        if not name:
            continue
        budgeted = float(item.get('budgeted', 0) or 0)
        spent = float(item.get('spent', 0) or 0)

        if rule.strategy in ('copy_exact',):
            pass  # keep both budgeted and spent verbatim
        elif rule.strategy in ('copy_structure', 'reset_spent', 'auto_adjust'):
            spent = 0
        elif rule.strategy == 'carry_forward':
            spent = 0  # carry-forward remainder is applied relative to prior period below
        elif rule.strategy in ('increase_percent', 'decrease_percent'):
            budgeted = _scale_budgeted(budgeted, float(rule.adjustment_percent or 0))
            spent = 0

        allocations.append({
            'name': name,
            'budgeted': round(budgeted, 2),
            'spent': round(spent, 2),
            'color': item.get('color', '#3b82f6'),
            'symbol': item.get('symbol', 'utensils'),
            'category': item.get('category'),
        })

    # Carry-forward: seed spent with the leftover from the previous period.
    if rule.auto_carry_forward or rule.strategy == 'carry_forward':
        last = rule.executions.exclude(generated_budgets=[]).order_by('-scheduled_date').first()
        if last and last.generated_budgets:
            previous = {c.get('name'): c for c in last.generated_budgets}
            for alloc in allocations:
                prior = previous.get(alloc['name'])
                if prior:
                    remaining = float(prior.get('budgeted', 0)) - float(prior.get('spent', 0))
                    alloc['spent'] = round(max(0, -remaining), 2) if remaining < 0 else 0

    return allocations


@transaction.atomic
def execute_rule(rule: RecurringBudget, scheduled_date: date) -> RecurringBudgetExecution:
    """Generate the budget for ``rule`` on ``scheduled_date``.

    Returns the created ``RecurringBudgetExecution`` (status reflects outcome).
    """
    user = rule.user

    # Idempotency: never materialise the same period twice.
    existing = RecurringBudgetExecution.objects.filter(rule=rule, scheduled_date=scheduled_date).first()
    if existing:
        return existing

    execution = RecurringBudgetExecution.objects.create(
        rule=rule,
        user=user,
        project=rule.project,
        scheduled_date=scheduled_date,
        status='pending',
    )

    try:
        allocations = _build_allocations(rule)

        # Reuse the anchor budget's name prefix so generated budgets are grouped
        # and identifiable, while staying independent budget rows.
        generated_ids: List[str] = []
        seen_names: set = set()
        for alloc in allocations:
            name = alloc['name']
            # Keep generated names unique within the period.
            unique_name = name
            suffix = 1
            while unique_name in seen_names:
                suffix += 1
                unique_name = f"{name} {suffix}"
            seen_names.add(unique_name)

            category_fk = None
            category_ref = alloc.get('category')
            if category_ref:
                category_fk = Category.objects.filter(id=category_ref, user=user).first()

            budget = BudgetCategory.objects.create(
                user=user,
                project=rule.project,
                name=unique_name,
                category=category_fk,
                budgeted=alloc['budgeted'],
                spent=alloc['spent'],
                color=alloc.get('color', '#3b82f6'),
                text_color='#ffffff',
                icon=alloc.get('symbol', 'utensils'),
                symbol=alloc.get('symbol', 'utensils'),
            )
            generated_ids.append(str(budget.id))

        # Snapshot the generated allocations for the execution history.
        snapshot = [
            {
                'id': bid,
                'name': a['name'],
                'budgeted': a['budgeted'],
                'spent': a['spent'],
            }
            for bid, a in zip(generated_ids, allocations)
        ]
        execution.generated_budgets = snapshot
        execution.status = 'generated'
        execution.executed_at = timezone.now()
        execution.save(update_fields=['generated_budgets', 'status', 'executed_at'])

        rule.last_generation_date = scheduled_date
        rule.generation_count = (rule.generation_count or 0) + 1
        rule.save(update_fields=['last_generation_date', 'generation_count', 'updated_at'])

        notify_recurring_budget_generated(rule)
    except Exception as exc:  # pragma: no cover - defensive
        execution.status = 'failed'
        execution.error = str(exc)
        execution.save(update_fields=['status', 'error'])
        notify_recurring_budget_failed(rule, str(exc))

    recompute_next_generation(rule)
    return execution


def run_due_rules(as_of: Optional[date] = None) -> Dict[str, int]:
    """Generate every active recurring-budget rule whose period is due.

    Catches up on overdue periods (one generation per due date) and prevents
    duplicate generations via ``RecurringBudgetExecution`` history. Returns a
    summary of how many rules were processed and budgets generated.
    """
    as_of = as_of or timezone.localdate()
    summary: Dict[str, int] = {'rules_checked': 0, 'generations': 0, 'failed': 0}

    due_rules = RecurringBudget.objects.filter(
        status='active',
        next_generation_date__isnull=False,
        next_generation_date__lte=as_of,
    ).select_for_update(skip_locked=True)

    for rule in due_rules:
        summary['rules_checked'] += 1
        cursor = rule.next_generation_date
        safety = 0
        while cursor and cursor <= as_of and safety < 100:
            safety += 1
            already = RecurringBudgetExecution.objects.filter(
                rule=rule, scheduled_date=cursor,
            ).exists()
            if not already:
                execution = execute_rule(rule, cursor)
                summary['generations'] += 1
                if execution.status == 'failed':
                    summary['failed'] += 1
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
            rule.refresh_from_db(fields=['next_generation_date'])
        recompute_next_generation(rule)

    return summary
