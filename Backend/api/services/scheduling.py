"""
Reusable scheduling engine for WealthWise.

This module is the foundation of the recurring platform. It contains pure
date-arithmetic logic for computing the next occurrence of a schedule given a
``RecurringRule``-like description. It intentionally has no dependency on
Django models at the function level (it accepts plain values) so the same
engine can later power recurring budgets, subscriptions, bill reminders and
other scheduled events.

Frequency semantics:
- daily:      every ``interval`` days.
- weekly:     every ``interval`` weeks on the selected ``weekdays`` (or the
              start_date's weekday when none selected).
- monthly:    every ``interval`` months on ``day_of_month`` (or the last day
              of the month when ``last_day_of_month`` is set).
- quarterly:  every 3 * ``interval`` months on ``day_of_month`` / last day.
- yearly:     every ``interval`` years on the month/day of ``start_date``.
- custom:     behaves like monthly using ``interval`` months (placeholder for
              richer custom rules).
"""
from datetime import date, timedelta
from typing import List, Optional

MONTHS_PER_QUARTER = 3


def _add_months(base: date, months: int) -> date:
    """Return ``base`` shifted by ``months`` (handles year rollover)."""
    month_index = base.month - 1 + months
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    # Clamp day to the last valid day of the target month.
    if base.day > 28:
        while True:
            try:
                return date(year, month, base.day)
            except ValueError:
                day = base.day - 1
                return date(year, month, day)
    return date(year, month, base.day)


def _last_day_of_month(target: date) -> date:
    """Return the last calendar day of the month containing ``target``."""
    if target.month == 12:
        next_month = date(target.year + 1, 1, 1)
    else:
        next_month = date(target.year, target.month + 1, 1)
    return next_month - timedelta(days=1)


def next_weekday_on_or_after(start: date, weekday: int) -> date:
    """Return the first date >= ``start`` that falls on ``weekday`` (0=Mon)."""
    days_ahead = (weekday - start.weekday()) % 7
    return start + timedelta(days=days_ahead)


def next_occurrence(
    frequency: str,
    start_date: date,
    after: date,
    interval: int = 1,
    weekdays: Optional[List[int]] = None,
    day_of_month: Optional[int] = None,
    last_day_of_month: bool = False,
) -> Optional[date]:
    """Compute the next occurrence strictly after ``after``.

    Returns ``None`` when no occurrence exists after ``after`` (e.g. the rule
    has ended). ``start_date`` anchors the monthly/yearly alignment.
    """
    interval = max(1, interval or 1)
    after = max(after, start_date - timedelta(days=1))
    candidate: Optional[date] = None

    if frequency == 'daily':
        days_since = (after - start_date).days
        step = ((days_since // interval) + 1) * interval
        candidate = start_date + timedelta(days=step)

    elif frequency == 'weekly':
        selected = weekdays if weekdays else [start_date.weekday()]
        selected = sorted(set(selected))
        # Find the first selected weekday strictly after ``after``.
        cursor = after + timedelta(days=1)
        # Align to the start of the current week's pattern: scan up to 7 days.
        best = None
        for _ in range(14):
            if cursor.weekday() in selected:
                # Ensure it is on a valid interval week relative to start_date.
                weeks_since = (cursor - start_date).days // 7
                if weeks_since >= 0 and weeks_since % interval == 0:
                    best = cursor
                    break
            cursor += timedelta(days=1)
        candidate = best

    elif frequency in ('monthly', 'custom'):
        candidate = _next_month_occurrence(
            start_date, after, interval, day_of_month, last_day_of_month
        )

    elif frequency == 'quarterly':
        candidate = _next_month_occurrence(
            start_date, after, interval * MONTHS_PER_QUARTER,
            day_of_month, last_day_of_month,
        )

    elif frequency == 'yearly':
        months_step = 12 * interval
        candidate = _next_month_occurrence(
            start_date, after, months_step,
            day_of_month if day_of_month is not None else start_date.day,
            last_day_of_month,
        )

    if candidate is None or candidate < start_date:
        return None
    return candidate


def _next_month_occurrence(
    start_date: date,
    after: date,
    month_interval: int,
    day_of_month: Optional[int],
    last_day_of_month: bool,
) -> Optional[date]:
    """Return the next monthly-aligned occurrence after ``after``."""
    # Determine the target day for a given anchor month.
    def day_for(month_start: date) -> date:
        if last_day_of_month:
            return _last_day_of_month(month_start)
        target_day = day_of_month if day_of_month is not None else start_date.day
        last = _last_day_of_month(month_start)
        return date(month_start.year, month_start.month, min(target_day, last.day))

    # Number of month steps from start_date's month.
    base_index = start_date.year * 12 + (start_date.month - 1)
    after_index = after.year * 12 + (after.month - 1)
    steps_since = after_index - base_index
    if steps_since < 0:
        steps_since = 0
    next_step = ((steps_since // month_interval) + 1) * month_interval
    month_index = base_index + next_step
    year = month_index // 12
    month = month_index % 12 + 1
    month_start = date(year, month, 1)
    candidate = day_for(month_start)
    # If the computed day is not strictly after ``after``, advance one interval.
    while candidate <= after:
        next_step += month_interval
        month_index = base_index + next_step
        year = month_index // 12
        month = month_index % 12 + 1
        month_start = date(year, month, 1)
        candidate = day_for(month_start)
    return candidate


def preview_occurrences(
    frequency: str,
    start_date: date,
    count: int = 5,
    interval: int = 1,
    weekdays: Optional[List[int]] = None,
    day_of_month: Optional[int] = None,
    last_day_of_month: bool = False,
    end_date: Optional[date] = None,
) -> List[date]:
    """Return the next ``count`` occurrences starting from ``start_date``."""
    occurrences: List[date] = []
    cursor = start_date - timedelta(days=1)
    attempts = 0
    while len(occurrences) < count and attempts < count * 50 + 10:
        nxt = next_occurrence(
            frequency, start_date, cursor, interval,
            weekdays, day_of_month, last_day_of_month,
        )
        if nxt is None:
            break
        if end_date and nxt > end_date:
            break
        occurrences.append(nxt)
        cursor = nxt
        attempts += 1
    return occurrences
