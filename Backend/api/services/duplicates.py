"""
Duplicate Transaction Detection engine service (Django side).

Mirrors the structure of ``financial_health.py``: pure functions over querysets
plus persistence and integration points. The fuzzy scoring itself lives in the
stateless ``ML-Backend`` microservice (see ``services/ml_client.py``); this
module orchestrates, persists results, enforces project scoping, and applies
user resolutions.

Key entry points:

* ``gather_candidates`` — serialize a user/project's transactions to plain dicts.
* ``scan_for_project`` — run a standing scan and persist ``DuplicateGroup`` /
  ``DuplicateMatch`` rows (+ optional notification).
* ``detect_for_import`` — score each incoming row against existing saved rows.
* ``resolve_match`` — apply ``kept`` / ``deleted`` / ``not_duplicate``.
* ``default_config`` — the engine's default detection config.

A financial write must never be blocked by the ML service: any
``MLServiceUnavailable`` is caught by callers and degrades gracefully.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Dict, List, Optional, Tuple

from django.db import transaction
from django.utils import timezone

from ..models import (
    Transaction,
    DuplicateGroup,
    DuplicateMatch,
    DuplicateFeedback,
)
from .ml_client import MLServiceUnavailable
from . import ml_client

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def default_config() -> Dict:
    """Return the default detection config (mirrors ML-Backend defaults)."""
    from ..models import default_duplicate_config
    return default_duplicate_config()


# ---------------------------------------------------------------------------
# Data gathering
# ---------------------------------------------------------------------------

def gather_candidates(user, project=None, window_days: int = 365) -> List[Dict]:
    """Serialize the user/project's transactions (last ``window_days``) to dicts."""
    since = timezone.localdate() - timedelta(days=window_days)
    qs = Transaction.objects.filter(
        user=user, date__gte=since,
        **({'project': project} if project else {}),
    ).select_related('account', 'category')
    return [
        {
            'id': str(t.id),
            'date': t.date.isoformat(),
            'amount': float(t.amount),
            'description': t.description or '',
            'type': t.type or 'expense',
        }
        for t in qs
    ]


# ---------------------------------------------------------------------------
# Standing scan
# ---------------------------------------------------------------------------

def _feedback_keys(user, project) -> set:
    """Set of (transaction_a_id, transaction_b_id) pairs labelled not_duplicate."""
    qs = DuplicateFeedback.objects.filter(
        user=user, label='not_duplicate',
        **({'project': project} if project else {}),
    )
    keys = set()
    for fb in qs.values_list('transaction_a_id', 'transaction_b_id'):
        keys.add(frozenset((str(fb[0]), str(fb[1]))))
    return keys


def _pair_key(a_id, b_id) -> frozenset:
    return frozenset((str(a_id), str(b_id)))


def scan_for_project(user, project=None, persist: bool = True,
                     notify: bool = True) -> List[DuplicateGroup]:
    """Run a standing duplicate scan and persist the resulting groups/matches."""
    candidates = gather_candidates(user, project)
    if len(candidates) < 2:
        return []

    try:
        raw_groups = ml_client.scan(candidates, default_config())
    except MLServiceUnavailable as exc:
        logger.warning("Duplicate scan skipped; ML service unavailable: %s", exc)
        return []

    suppressed = _feedback_keys(user, project)
    # Idempotency: re-scanning must not recreate groups for the same pair that
    # is still pending review. Skip pairs that already have a pending match.
    existing_pending = set(
        (str(t), str(d)) for t, d in DuplicateMatch.objects.filter(
            user=user, resolution='pending',
            **({'project': project} if project else {}),
        ).values_list('transaction_id', 'duplicate_of_id')
    )
    created: List[DuplicateGroup] = []

    for raw in raw_groups:
        members = raw.get('members', [])
        matches = []
        for m in raw.get('matches', []):
            a, b = m.get('a_id'), m.get('b_id')
            if _pair_key(a, b) in suppressed:
                continue
            if (str(a), str(b)) in existing_pending or (str(b), str(a)) in existing_pending:
                continue
            matches.append(m)
        if not matches:
            continue
        if persist:
            group = _persist_group(user, project, members, matches)
            created.append(group)
        else:
            # Build an in-memory group for callers that only want the result.
            created.append(_build_in_memory_group(user, project, members, matches))

    if persist and notify and created:
        try:
            from .notifications import notify_duplicates_found
            notify_duplicates_found(
                user, project, len(created), source='scan',
            )
        except Exception:  # pragma: no cover - notifications must not break scans
            logger.exception("Failed to notify about duplicate scan results")

    return created


def _build_in_memory_group(user, project, members, matches) -> DuplicateGroup:
    group = DuplicateGroup(user=user, project=project)
    return group


def _persist_group(user, project, members, matches) -> DuplicateGroup:
    member_ids = set(str(m) for m in members)
    with transaction.atomic():
        group = DuplicateGroup.objects.create(user=user, project=project, status='open')
        # Map member ids -> first seen Transaction for duplicate_of resolution.
        txns = {
            str(t.id): t for t in
            Transaction.objects.filter(id__in=member_ids, user=user)
        }
        for m in matches:
            a_id, b_id = str(m.get('a_id')), str(m.get('b_id'))
            txn_a = txns.get(a_id)
            txn_b = txns.get(b_id)
            if txn_a is None or txn_b is None:
                continue
            DuplicateMatch.objects.create(
                group=group, user=user, project=project,
                transaction=txn_a, duplicate_of=txn_b,
                score=m.get('score', 0),
                confidence=m.get('confidence', 'medium'),
                features=m.get('features', {}),
                explanation=m.get('explanation', ''),
                resolution='pending',
            )
        return group


# ---------------------------------------------------------------------------
# Import-time detection
# ---------------------------------------------------------------------------

def detect_for_import(user, project, normalized_rows: List[Dict]) -> List[Dict]:
    """Score each incoming (normalized) row against existing saved transactions.

    Returns a list (aligned with ``normalized_rows``) of:
        {confidence, matches: [{existing_id, score, confidence, features, explanation}]}
    Pairs already labelled ``not_duplicate`` are excluded.
    """
    # Only compare against the same type to mirror the ML service's behaviour.
    existing_by_type: Dict[str, List] = {}
    for t in gather_candidates(user, project):
        existing_by_type.setdefault(t['type'], []).append(t)

    suppressed = _feedback_keys(user, project)

    results: List[Dict] = []
    for row in normalized_rows:
        amount = row.get('amount')
        if amount is None:
            results.append({'confidence': None, 'matches': []})
            continue
        txn_type = 'income' if amount >= 0 else 'expense'
        candidate = {
            'id': row.get('row_id') or 'import',
            'date': row.get('date'),
            'amount': float(amount),
            'description': row.get('description') or row.get('merchant') or '',
            'type': txn_type,
        }
        try:
            matches = ml_client.score_batch(
                candidate, existing_by_type.get(txn_type, []), default_config(),
            )
        except MLServiceUnavailable as exc:
            logger.warning("Import dedup skipped; ML service unavailable: %s", exc)
            results.append({'confidence': None, 'matches': []})
            continue

        kept = [
            mt for mt in matches
            if _pair_key(mt.get('a_id'), mt.get('b_id')) not in suppressed
        ]
        confidence = None
        if kept:
            confidence = max(mt.get('confidence') for mt in kept)
        results.append({'confidence': confidence, 'matches': kept})
    return results


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------

@transaction.atomic
def resolve_match(match: DuplicateMatch, resolution: str) -> DuplicateMatch:
    """Apply a user resolution to a match.

    * ``kept`` – keep both; record as reviewed.
    * ``deleted`` – delete the duplicate ``transaction`` (reusing the normal
      delete path so balances + financial-health recompute still fire), then
      mark resolved.
    * ``not_duplicate`` – keep both, write ``DuplicateFeedback`` so the pair is
      never re-flagged, and dismiss the group.
    """
    valid = {c[0] for c in DuplicateMatch.RESOLUTION_CHOICES}
    if resolution not in valid:
        raise ValueError(f"Invalid resolution: {resolution}")

    match.resolution = resolution
    match.save(update_fields=['resolution'])

    group = match.group
    if resolution == 'deleted' and match.transaction_id:
        _delete_transaction(match.transaction)
        if group:
            _maybe_resolve_group(group)
    elif resolution == 'not_duplicate':
        DuplicateFeedback.objects.update_or_create(
            user=match.user, project=match.project,
            transaction_a=match.transaction, transaction_b=match.duplicate_of,
            defaults={'label': 'not_duplicate'},
        )
        # Symmetric suppression so either ordering is skipped next time.
        if match.duplicate_of_id:
            _ensure_symmetric_feedback(match)
        if group:
            group.status = 'dismissed'
            group.save(update_fields=['status'])
            group.matches.update(resolution='not_duplicate')
    elif resolution == 'kept':
        if group:
            _maybe_resolve_group(group)
    return match


def _ensure_symmetric_feedback(match: DuplicateMatch) -> None:
    DuplicateFeedback.objects.update_or_create(
        user=match.user, project=match.project,
        transaction_a=match.duplicate_of, transaction_b=match.transaction,
        defaults={'label': 'not_duplicate'},
    )


def _maybe_resolve_group(group: DuplicateGroup) -> None:
    if not group.matches.exclude(resolution='pending').exists():
        return
    unresolved = group.matches.filter(resolution='pending').exists()
    group.status = 'reviewed' if not unresolved else 'open'
    group.save(update_fields=['status'])


def _delete_transaction(txn: Transaction) -> None:
    """Delete a duplicate transaction via its normal delete path.

    Using ``txn.delete()`` triggers the model's standard cascade/cleanup. The
    financial-health recompute is triggered by the project's signal/hooks if
    present; otherwise we call it defensively.
    """
    user, project = txn.user, txn.project
    txn.delete()
    try:
        from .financial_health import recompute_after_change
        recompute_after_change(user, project)
    except Exception:  # pragma: no cover - defensive
        logger.exception("Failed to recompute after duplicate deletion")


def record_feedback(user, project, transaction_a_id, transaction_b_id, label: str) -> DuplicateFeedback:
    """Persist an explicit duplicate / not_duplicate label for a pair."""
    if label not in ('duplicate', 'not_duplicate'):
        raise ValueError(f"Invalid label: {label}")
    from ..models import Transaction
    try:
        ta = Transaction.objects.get(id=transaction_a_id, user=user)
        tb = Transaction.objects.get(id=transaction_b_id, user=user)
    except Transaction.DoesNotExist as exc:
        raise ValueError("Unknown transaction id") from exc
    fb, _ = DuplicateFeedback.objects.update_or_create(
        user=user, project=project,
        transaction_a=ta, transaction_b=tb,
        defaults={'label': label},
    )
    return fb
