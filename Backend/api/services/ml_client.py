"""
Thin HTTP client for the stateless Duplicate Detection ML microservice.

The Django backend calls this service internally to score candidate
transactions. The service is compute-only and never touches the DB, so this
client is intentionally simple: post the candidate records, parse the response.

On any transport/HTTP error it raises :class:`MLServiceUnavailable` so callers
can degrade gracefully (a scoring failure must never block a financial write).
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_SCAN_TIMEOUT = 5
_BATCH_TIMEOUT = 2


class MLServiceUnavailable(Exception):
    """Raised when the ML scoring service is unreachable or returns an error."""


def _url(path: str) -> str:
    base = getattr(settings, 'ML_SERVICE_URL', 'http://localhost:8100').rstrip('/')
    return f"{base}{path}"


def _txn_to_payload(txn) -> Dict:
    """Coerce a Transaction (or dict) into the ML service's record shape."""
    if isinstance(txn, dict):
        return {
            'id': str(txn.get('id') or txn.get('transaction_id') or ''),
            'date': txn.get('date'),
            'amount': float(txn.get('amount') or 0),
            'description': txn.get('description') or '',
            'type': txn.get('type') or 'expense',
        }
    return {
        'id': str(txn.id),
        'date': txn.date.isoformat() if getattr(txn, 'date', None) else None,
        'amount': float(txn.amount) if txn.amount is not None else 0.0,
        'description': txn.description or '',
        'type': txn.type or 'expense',
    }


def scan(transactions: List, config: Optional[Dict] = None) -> List[Dict]:
    """Return duplicate groups for the given transactions.

    ``transactions`` is a list of Transaction objects or dict-like records.
    """
    payload = {
        'transactions': [_txn_to_payload(t) for t in transactions],
        'config': config or {},
    }
    try:
        resp = requests.post(_url('/duplicates/scan'), json=payload, timeout=_SCAN_TIMEOUT)
    except requests.RequestException as exc:
        logger.warning("ML duplicate service unreachable for scan: %s", exc)
        raise MLServiceUnavailable(str(exc)) from exc
    if resp.status_code != 200:
        logger.warning("ML duplicate service scan returned %s", resp.status_code)
        raise MLServiceUnavailable(f"scan returned {resp.status_code}")
    return resp.json().get('groups', [])


def score_batch(candidate, existing: List, config: Optional[Dict] = None) -> List[Dict]:
    """Score one candidate transaction against a set of existing ones."""
    payload = {
        'candidate': _txn_to_payload(candidate),
        'existing': [_txn_to_payload(t) for t in existing],
        'config': config or {},
    }
    try:
        resp = requests.post(_url('/duplicates/score-batch'), json=payload, timeout=_BATCH_TIMEOUT)
    except requests.RequestException as exc:
        logger.warning("ML duplicate service unreachable for score-batch: %s", exc)
        raise MLServiceUnavailable(str(exc)) from exc
    if resp.status_code != 200:
        logger.warning("ML duplicate service score-batch returned %s", resp.status_code)
        raise MLServiceUnavailable(f"score-batch returned {resp.status_code}")
    return resp.json().get('matches', [])
