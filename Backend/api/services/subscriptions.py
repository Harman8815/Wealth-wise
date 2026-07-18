"""
Subscription Detection engine (Django side).

Mines the user's *transaction history* to surface recurring charges (subscriptions)
using **pattern mining** — grouping expenses by a normalized merchant, detecting a
stable amount that repeats on a regular cadence. This is distinct from the
user-configured ``RecurringRule`` records (those are explicit schedules the user
set up); this engine *discovers* the implicit subscriptions hiding in past spend.

The detector is intentionally self-contained and pure over querysets (no external
ML service call), so it can be tested without mocks and never blocks a financial
write. It mirrors ``services.insights`` / ``services.duplicates``:

* ``normalize_merchant`` / ``group_candidates`` — serialize + cluster transactions.
* ``detect_for_project`` — run the mining, persist ``Subscription`` rows (deduped by
  a stable ``dedup_key`` so re-scans update in place), and emit a notification.
* ``detect_after_change`` — defensive event hook for the financial-health recompute.
* ``ignore_subscription`` / ``confirm_subscription`` / ``convert_subscription`` —
  user actions, including promoting a detected subscription into a ``RecurringRule``.

## Detection heuristic

For each candidate (expense) transaction group keyed by normalized merchant:

1. Require at least ``MIN_OCCURRENCES`` (3) transactions spaced over time.
2. Check the amount is *stable* (coefficient of variation under
   ``AMOUNT_CV_THRESHOLD``); small per-cycle variance is normal (taxes, rounding).
3. Cluster the inter-arrival gaps into weekly (~7d), bi-weekly (~14d),
   monthly (~30d), quarterly (~91d), yearly (~365d) buckets to infer ``cadence``.
4. Assign ``confidence`` from occurrence count + cadence clarity; compute
   ``avg_amount`` and ``monthly_cost`` (cadence-normalized).
"""
from __future__ import annotations

import logging
import re
from datetime import timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ..models import Transaction, Subscription, SubscriptionFeedback, Category, RecurringRule

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MIN_OCCURRENCES = 3                      # minimum repeats to consider a series
MAX_WINDOW_DAYS = 365 * 2               # only look back this far by default
AMOUNT_CV_THRESHOLD = Decimal('0.15')   # stable-amount tolerance (coefficient of variation)
AMOUNT_ABS_TOLERANCE = Decimal('1.00')  # absolute amount tolerance for "near-identical"
GAP_BUCKETS = {                         # cadence label -> (nominal gap days, allowed jitter)
    'weekly': (7, 3),
    'biweekly': (14, 4),
    'monthly': (30, 7),
    'quarterly': (91, 12),
    'yearly': (365, 25),
}


def default_config() -> Dict:
    """Return the detector's default config (so callers can tune thresholds)."""
    return {
        'min_occurrences': MIN_OCCURRENCES,
        'max_window_days': MAX_WINDOW_DAYS,
        'amount_cv_threshold': float(AMOUNT_CV_THRESHOLD),
        'amount_abs_tolerance': float(AMOUNT_ABS_TOLERANCE),
    }


# ---------------------------------------------------------------------------
# Merchant normalization
# ---------------------------------------------------------------------------

_NOISE_TOKENS = {
    'inc', 'llc', 'ltd', 'limited', 'co', 'corp', 'corporation', 'pvt', 'private',
    'gmbh', 'plc', 'sa', 'ag', 'llp', 'pte', 'group', 'the', 'and', 'of', 'services',
    'subscription', 'payment', 'bill', 'monthly', 'annual', 'renewal', 'auto',
}

# Common top-level / domain tokens that appear after a dot (netflix.com, pay.uke).
_DOMAIN_TOKENS = {'com', 'net', 'org', 'io', 'in', 'us', 'uk', 'de', 'fr', 'co', 'app'}

_TOKEN_RE = re.compile(r"[^a-z0-9 ]+")


def normalize_merchant(description: str) -> str:
    """Reduce a transaction description to a stable merchant key.

    Lowercases, strips punctuation/bank noise, drops reference numbers and common
    business/domain suffixes, and keeps the most significant tokens. Two
    transactions from the same merchant with different trailing reference ids or
    domain suffixes (``NETFLIX.COM``, ``Spotify.com``) collapse to one key.
    """
    if not description:
        return ''
    text = description.lower()
    text = _TOKEN_RE.sub(' ', text)
    tokens = [t for t in text.split() if t]
    kept = []
    for t in tokens:
        if t in _NOISE_TOKENS:
            continue
        # Drop pure reference-number tokens (e.g. "txn1234", "ref8821").
        if len(t) >= 4 and t[-1].isdigit() and sum(c.isdigit() for c in t) >= 3:
            continue
        # Drop standalone long digit runs.
        if t.isdigit() and len(t) >= 4:
            continue
        # Drop trailing domain tokens (".com" -> "com" after punctuation strip).
        if t in _DOMAIN_TOKENS:
            continue
        kept.append(t)
    if not kept:
        # Fall back to raw tokens if everything was noise.
        kept = [t for t in tokens if not t.isdigit()]
    return ' '.join(kept)[:255]


# ---------------------------------------------------------------------------
# Data gathering
# ---------------------------------------------------------------------------

def gather_candidates(user, project=None, window_days: int = MAX_WINDOW_DAYS) -> List[Dict]:
    """Serialize the user/project's expense transactions (last ``window_days``)."""
    since = timezone.localdate() - timedelta(days=window_days)
    qs = Transaction.objects.filter(
        user=user, type='expense', date__gte=since,
        **({'project': project} if project else {}),
    ).select_related('account', 'category').order_by('date')
    return [
        {
            'id': str(t.id),
            'date': t.date,
            'amount': t.amount,
            'description': t.description or '',
            'merchant': normalize_merchant(t.description or ''),
            'category_id': str(t.category_id) if t.category_id else None,
            'category_name': t.category.name if t.category else None,
        }
        for t in qs
    ]


def group_candidates(candidates: List[Dict]) -> Dict[str, List[Dict]]:
    """Group candidate transactions by normalized merchant key."""
    groups: Dict[str, List[Dict]] = {}
    for c in candidates:
        key = c['merchant']
        if not key:
            continue
        groups.setdefault(key, []).append(c)
    return groups


# ---------------------------------------------------------------------------
# Pattern mining
# ---------------------------------------------------------------------------

def _mean(values: List[Decimal]) -> Decimal:
    if not values:
        return Decimal('0')
    return sum(values, Decimal('0')) / Decimal(str(len(values)))


def _coeff_of_variation(values: List[Decimal]) -> Decimal:
    """Standard-deviation / mean, as a Decimal ratio (0 when constant)."""
    if len(values) < 2:
        return Decimal('0')
    mean = _mean(values)
    if mean == 0:
        return Decimal('0')
    var = sum(((v - mean) ** 2 for v in values), Decimal('0')) / Decimal(str(len(values) - 1))
    try:
        std = var.sqrt()
    except (ValueError, TypeError):  # pragma: no cover - non-negative by construction
        std = Decimal('0')
    return std / mean


def _infer_cadence(gaps: List[int]) -> Optional[str]:
    """Infer the most common cadence from the sorted list of inter-arrival gaps."""
    if not gaps:
        return None
    best_label: Optional[str] = None
    best_count = 0
    for label, (nominal, jitter) in GAP_BUCKETS.items():
        count = sum(1 for g in gaps if abs(g - nominal) <= jitter)
        if count > best_count:
            best_count = count
            best_label = label
    # Require a clear majority of gaps to match a bucket (else 'unknown').
    if best_label and best_count >= max(1, len(gaps) // 2):
        return best_label
    return 'unknown'


def _monthly_factor(cadence: str) -> Decimal:
    mapping = {
        'weekly': Decimal('30') / Decimal('7'),
        'biweekly': Decimal('30') / Decimal('14'),
        'monthly': Decimal('1'),
        'quarterly': Decimal('1') / Decimal('3'),
        'yearly': Decimal('1') / Decimal('12'),
    }
    return mapping.get(cadence, Decimal('1'))


def _confidence(occurrences: int, cadence: str) -> str:
    if cadence == 'unknown':
        return 'low'
    if occurrences >= 6 or (occurrences >= 4 and cadence in ('monthly', 'weekly')):
        return 'high'
    if occurrences >= MIN_OCCURRENCES + 1:
        return 'medium'
    return 'low'


def mine_merchant(merchant: str, txns: List[Dict], config: Optional[Dict] = None) -> Optional[Dict]:
    """Attempt to detect a subscription series within one merchant group.

    Returns a detected-subscription dict, or ``None`` if the group does not look
    like a recurring charge.
    """
    cfg = config or default_config()
    min_occ = int(cfg.get('min_occurrences', MIN_OCCURRENCES))

    if len(txns) < min_occ:
        return None

    txns = sorted(txns, key=lambda t: t['date'])
    amounts = [Decimal(str(t['amount'])) for t in txns]
    mean_amount = _mean(amounts)
    cv = _coeff_of_variation(amounts)

    # Amount must be stable (relative variation or absolute tolerance).
    cv_threshold = Decimal(str(cfg.get('amount_cv_threshold', AMOUNT_CV_THRESHOLD)))
    abs_tol = Decimal(str(cfg.get('amount_abs_tolerance', AMOUNT_ABS_TOLERANCE)))
    amount_stable = (cv <= cv_threshold) or all(
        abs(a - mean_amount) <= abs_tol for a in amounts
    )
    if not amount_stable or mean_amount <= 0:
        return None

    # Compute inter-arrival gaps and infer cadence.
    gaps: List[int] = []
    for i in range(1, len(txns)):
        delta = (txns[i]['date'] - txns[i - 1]['date']).days
        if delta > 0:
            gaps.append(delta)
    cadence = _infer_cadence(gaps)
    if cadence == 'unknown':
        return None

    confidence = _confidence(len(txns), cadence)
    monthly_cost = mean_amount * _monthly_factor(cadence)

    last = txns[-1]['date']
    category_id = next((t['category_id'] for t in reversed(txns) if t['category_id']), None)
    category_name = next((t['category_name'] for t in reversed(txns) if t['category_name']), None)

    return {
        'merchant': merchant,
        'display_name': category_name or txns[-1]['description'][:255] or merchant.title(),
        'cadence': cadence,
        'confidence': confidence,
        'avg_amount': mean_amount,
        'monthly_cost': monthly_cost,
        'occurrences': len(txns),
        'last_seen': last,
        'category_id': category_id,
        'category_name': category_name,
        'metadata': {
            'occurrences': len(txns),
            'gaps': gaps,
            'amount_cv': float(cv),
            'first_seen': txns[0]['date'].isoformat(),
            'last_seen': last.isoformat(),
        },
    }


def detect_series(candidates: List[Dict], config: Optional[Dict] = None) -> List[Dict]:
    """Run pattern mining over all candidate transactions; return detected series."""
    groups = group_candidates(candidates)
    detected: List[Dict] = []
    for merchant, txns in groups.items():
        hit = mine_merchant(merchant, txns, config)
        if hit is not None:
            detected.append(hit)
    # Highest monthly cost first (most impactful subscriptions surface first).
    detected.sort(key=lambda d: d['monthly_cost'], reverse=True)
    return detected


# ---------------------------------------------------------------------------
# Persistence + generation
# ---------------------------------------------------------------------------

def _feedback_merchants(user, project) -> set:
    """Set of merchant keys the user has explicitly ignored."""
    qs = SubscriptionFeedback.objects.filter(
        user=user, label='ignored',
        **({'project': project} if project else {}),
    )
    return set(qs.values_list('merchant', flat=True))


def _dedup_key(merchant: str, project) -> str:
    return f"sub:{merchant}:{project or 'none'}"


def detect_for_project(user, project=None, persist: bool = True,
                       notify: bool = True, config: Optional[Dict] = None) -> List[Subscription]:
    """Mine subscriptions for a project and persist/update ``Subscription`` rows.

    Re-runs update existing *unconfirmed / unignored* rows in place (keyed by
    ``dedup_key``) instead of creating duplicates. Ignored merchants are skipped.
    Returns the list of non-ignored detected subscriptions.
    """
    candidates = gather_candidates(user, project)
    detected = detect_series(candidates, config)
    ignored = _feedback_merchants(user, project)

    scope_filter = {'user': user}
    if project is not None:
        scope_filter['project'] = project

    existing = {
        s.dedup_key: s for s in Subscription.objects.filter(
            **scope_filter,
        ).exclude(status__in=['ignored', 'converted']).exclude(dedup_key='')
    }

    result: List[Subscription] = []
    seen_keys = set()
    for hit in detected:
        merchant = hit['merchant']
        if merchant in ignored:
            continue
        key = _dedup_key(merchant, project)
        seen_keys.add(key)
        values = {
            'merchant': hit['merchant'],
            'display_name': hit['display_name'],
            'cadence': hit['cadence'],
            'confidence': hit['confidence'],
            'avg_amount': hit['avg_amount'],
            'monthly_cost': hit['monthly_cost'],
            'occurrences': hit['occurrences'],
            'last_seen': hit['last_seen'],
            'metadata': hit['metadata'],
            'detected_at': timezone.now(),
        }
        if key in existing:
            sub = existing[key]
            for attr, val in values.items():
                setattr(sub, attr, val)
            sub.save(update_fields=list(values.keys()))
        elif persist:
            sub = Subscription.objects.create(
                user=user, project=project, dedup_key=key, status='detected', **values,
            )
        else:
            sub = Subscription(
                user=user, project=project, dedup_key=key, status='detected', **values,
            )
        result.append(sub)

    # Any previously-detected (unconfirmed) subscription whose merchant no longer
    # has a matching series is dropped back to 'detected'=False visibility: we mark
    # it ignored-of-data by leaving it but it won't be re-touched. Keep it simple:
    # leave stale rows; they resurface only if the series reappears.

    if notify and result:
        _maybe_notify(user, project, result, detected)

    return result


def detect_after_change(user, project=None, config: Optional[Dict] = None) -> List[Subscription]:
    """Defensive event hook for create/update/delete of financial data.

    Refreshes detected subscriptions synchronously. Returns the detected list, or
    ``[]`` if the engine raised (an ML/detection failure must never block the
    underlying financial write).
    """
    try:
        return detect_for_project(user, project, notify=True, config=config)
    except Exception:  # pragma: no cover - defensive
        logger.exception("Subscription detection failed after change")
        return []


# ---------------------------------------------------------------------------
# User actions
# ---------------------------------------------------------------------------

@transaction.atomic
def ignore_subscription(subscription: Subscription) -> Subscription:
    """Mark a detected subscription ignored and suppress its merchant forever."""
    subscription.status = 'ignored'
    subscription.save(update_fields=['status', 'updated_at'])
    SubscriptionFeedback.objects.update_or_create(
        user=subscription.user, project=subscription.project,
        merchant=subscription.merchant, label='ignored',
        defaults={'subscription': subscription},
    )
    return subscription


def confirm_subscription(subscription: Subscription) -> Subscription:
    """Mark a detected subscription as confirmed by the user."""
    subscription.status = 'confirmed'
    subscription.save(update_fields=['status', 'updated_at'])
    SubscriptionFeedback.objects.update_or_create(
        user=subscription.user, project=subscription.project,
        merchant=subscription.merchant, label='confirmed',
        defaults={'subscription': subscription},
    )
    return subscription


@transaction.atomic
def convert_subscription(subscription: Subscription, category=None, account=None) -> RecurringRule:
    """Promote a detected subscription into a real ``RecurringRule``.

    The new rule carries the mined cadence/amount and links back to the
    subscription via ``converted_rule`` so it is not double-counted.
    """
    if subscription.status == 'converted' and subscription.converted_rule_id:
        return subscription.converted_rule

    user = subscription.user
    project = subscription.project

    category_obj = category or subscription.category
    if category_obj is None and subscription.display_name:
        category_obj, _ = Category.objects.get_or_create(
            user=user, name=subscription.display_name, type='expense',
            project=project,
            defaults={
                'color': '#3b82f6', 'text_color': '#ffffff',
                'icon': 'credit-card', 'symbol': 'credit-card', 'is_default': False,
            },
        )

    frequency = {
        'weekly': 'weekly', 'biweekly': 'weekly', 'monthly': 'monthly',
        'quarterly': 'quarterly', 'yearly': 'yearly',
    }.get(subscription.cadence, 'monthly')
    interval = 2 if subscription.cadence == 'biweekly' else 1
    start_date = subscription.last_seen or timezone.localdate()

    rule = RecurringRule.objects.create(
        user=user, project=project,
        name=subscription.display_name or subscription.merchant.title(),
        amount=subscription.avg_amount,
        type='expense',
        category=category_obj,
        account=account,
        status='active',
        frequency=frequency,
        interval=interval,
        day_of_month=start_date.day,
        start_date=start_date,
        never_ends=True,
    )
    from .recurring import recompute_next_execution
    recompute_next_execution(rule)

    subscription.status = 'converted'
    subscription.converted_rule = rule
    subscription.save(update_fields=['status', 'converted_rule', 'updated_at'])

    try:
        from .financial_health import recompute_after_change
        recompute_after_change(user, project)
    except Exception:  # pragma: no cover - defensive
        logger.exception("Failed to recompute after subscription conversion")
    return rule


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

def _maybe_notify(user, project, detected: List[Subscription], raw: List[Dict]) -> None:
    """Fire one 'new subscriptions' Alert per day per project via dedup_key."""
    from .notifications import notify_subscriptions_found
    count = len(detected)
    sample = detected[0].display_name if detected else None
    notify_subscriptions_found(user, project, count, sample)
