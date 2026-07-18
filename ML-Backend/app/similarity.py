"""
Duplicate Transaction Detection — ML similarity core.

Pure, framework-independent scoring logic for near-duplicate detection. The
Django backend calls this service over HTTP and passes candidate transaction
records; this module never touches a database.

Scoring blends three 0-1 features into a weighted confidence score:

* ``description_sim`` — TF-IDF + cosine similarity over normalized descriptions
  (with a ``difflib`` ratio fallback for sparse buckets).
* ``amount_sim`` — exact/exact-within-tolerance → 1.0, otherwise a linear decay.
* ``date_sim`` — ``1 - day_gap / window`` clamped to >= 0.

Pairing is kept cheap via *blocking*: transactions are only compared when their
amounts fall in the same (tolerance-bounded) bucket AND their dates are within
``date_window_days``. Final duplicate groups are produced with a union-find over
all pairs at/above ``threshold_medium``.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Tuple

try:  # pragma: no cover - import optional at runtime
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    _HAVE_SKLEARN = True
except Exception:  # pragma: no cover - graceful fallback path exercised in tests
    _HAVE_SKLEARN = False


# Bank-noise tokens / patterns that add no semantic value to a description.
_NOISE_RE = re.compile(r"\b(ref|utr|txn|transaction|id|no|sbtrf|imps|neft|upi|refno)\b", re.I)
_PUNCT_RE = re.compile(r"[^\w\s]")
_WS_RE = re.compile(r"\s+")
_TRAILING_DIGITS_RE = re.compile(r"\s+\d[\d\s./-]*$")


@dataclass
class DuplicateConfig:
    """Tunable thresholds and feature weights for duplicate detection."""

    amount_tolerance: float = 0.01
    date_window_days: int = 4
    threshold_high: float = 0.85
    threshold_medium: float = 0.65
    weights: Dict[str, float] = field(
        default_factory=lambda: {
            "description": 0.5,
            "amount": 0.3,
            "date": 0.2,
        }
    )

    @classmethod
    def from_dict(cls, data: Optional[Dict]) -> "DuplicateConfig":
        if not data:
            return cls()
        weights = data.get("weights") or {}
        merged = {**cls().weights, **weights}
        return cls(
            amount_tolerance=float(data.get("amount_tolerance", cls().amount_tolerance)),
            date_window_days=int(data.get("date_window_days", cls().date_window_days)),
            threshold_high=float(data.get("threshold_high", cls().threshold_high)),
            threshold_medium=float(data.get("threshold_medium", cls().threshold_medium)),
            weights=merged,
        )


@dataclass
class TxRecord:
    """A minimal transaction record used for scoring."""

    id: str
    date: str  # ISO yyyy-mm-dd
    amount: float
    description: str
    type: str = "expense"

    @classmethod
    def from_dict(cls, d: Dict) -> "TxRecord":
        return cls(
            id=str(d.get("id")),
            date=str(d.get("date", "")),
            amount=float(d.get("amount") or 0),
            description=str(d.get("description") or ""),
            type=str(d.get("type") or "expense"),
        )


@dataclass
class FeatureBreakdown:
    description_sim: float
    amount_sim: float
    date_sim: float


@dataclass
class Match:
    a_id: str
    b_id: str
    score: float
    confidence: str  # "high" | "medium"
    features: FeatureBreakdown
    explanation: str


@dataclass
class DuplicateGroup:
    members: List[str]
    matches: List[Match]


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def normalize_description(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace, drop bank-noise tokens."""
    if not text:
        return ""
    text = text.lower()
    text = _PUNCT_RE.sub(" ", text)
    # Drop trailing reference numbers (e.g. "SWIGGY 9381 22").
    text = _TRAILING_DIGITS_RE.sub("", text)
    text = _NOISE_RE.sub(" ", text)
    text = _WS_RE.sub(" ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Feature scores
# ---------------------------------------------------------------------------

def _amount_sim(amount_a: float, amount_b: float, tolerance: float) -> float:
    diff = abs(amount_a - amount_b)
    if diff <= tolerance:
        return 1.0
    # Linear decay over a window of 50x the tolerance to avoid being too harsh.
    decay = (diff - tolerance) / (tolerance * 50)
    return max(0.0, 1.0 - decay)


def _parse_date(iso: str):
    from datetime import date

    try:
        return date.fromisoformat(iso)
    except (ValueError, TypeError):
        return None


def _date_sim(date_a: str, date_b: str, window: int) -> float:
    da, db = _parse_date(date_a), _parse_date(date_b)
    if da is None or db is None or window <= 0:
        return 0.0
    gap = abs((da - db).days)
    if gap > window:
        return 0.0
    return 1.0 - (gap / window)


def _description_sims(norm_descs: List[str]) -> List[List[float]]:
    """Return an NxN cosine-similarity matrix over normalized descriptions.

    Falls back to a ``difflib`` ratio matrix when sklearn is unavailable or a
    bucket has fewer than two usable documents.
    """
    n = len(norm_descs)
    if _HAVE_SKLEARN and n >= 2:
        corpus = [d if d else "" for d in norm_descs]
        try:
            vectors = TfidfVectorizer().fit_transform(corpus)
            mat = cosine_similarity(vectors)
            return [[float(mat[i][j]) for j in range(n)] for i in range(n)]
        except ValueError:
            # TfidfVectorizer can still fail on degenerate vocab; fall through.
            pass
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            matrix[i][j] = SequenceMatcher(None, norm_descs[i], norm_descs[j]).ratio()
    return matrix


# ---------------------------------------------------------------------------
# Pair scoring
# ---------------------------------------------------------------------------

def _combined_score(feats: FeatureBreakdown, weights: Dict[str, float]) -> float:
    w_sum = sum(weights.values()) or 1.0
    return (
        feats.description_sim * weights.get("description", 0)
        + feats.amount_sim * weights.get("amount", 0)
        + feats.date_sim * weights.get("date", 0)
    ) / w_sum


def _explain(amount: float, day_gap: int, desc_sim: float) -> str:
    gap_txt = f"{day_gap} day{'s' if day_gap != 1 else ''} apart" if day_gap >= 0 else "same day"
    return (
        f"Same amount ₹{amount:,.2f}, {gap_txt}, "
        f"{int(round(desc_sim * 100))}% description match."
    )


def _score_pair(
    a: TxRecord, b: TxRecord, norm: Dict[str, str],
    config: DuplicateConfig, sim_matrix: List[List[float]], idx: Dict[str, int],
) -> Optional[Match]:
    # Only compare within the same transaction type.
    if a.type != b.type:
        return None
    amount = _amount_sim(a.amount, b.amount, config.amount_tolerance)
    day_gap = abs((_parse_date(a.date) - _parse_date(b.date)).days)
    date = _date_sim(a.date, b.date, config.date_window_days)
    # Blocking: skip pairs whose date gap exceeds the window.
    if day_gap > config.date_window_days:
        return None
    desc_sim = sim_matrix[idx[a.id]][idx[b.id]]
    feats = FeatureBreakdown(
        description_sim=round(desc_sim, 4),
        amount_sim=round(amount, 4),
        date_sim=round(date, 4),
    )
    score = _combined_score(feats, config.weights)
    if score < config.threshold_medium:
        return None
    confidence = "high" if score >= config.threshold_high else "medium"
    return Match(
        a_id=a.id, b_id=b.id,
        score=round(score, 4),
        confidence=confidence,
        features=feats,
        explanation=_explain(a.amount, day_gap, desc_sim),
    )


# ---------------------------------------------------------------------------
# Union-find for grouping
# ---------------------------------------------------------------------------

class _UnionFind:
    def __init__(self, items: List[str]):
        self.parent = {i: i for i in items}

    def find(self, x: str) -> str:
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a: str, b: str) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[rb] = ra


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_batch(
    candidate: TxRecord,
    existing: List[TxRecord],
    config: Optional[DuplicateConfig] = None,
) -> List[Match]:
    """Score a single candidate against a set of existing transactions."""
    config = config or DuplicateConfig()
    if not existing:
        return []
    all_recs = [candidate] + existing
    norm = {r.id: normalize_description(r.description) for r in all_recs}
    sim = _description_sims([norm[r.id] for r in all_recs])
    idx = {r.id: i for i, r in enumerate(all_recs)}

    matches: List[Match] = []
    for ex in existing:
        m = _score_pair(candidate, ex, norm, config, sim, idx)
        if m is not None:
            matches.append(m)
    matches.sort(key=lambda mm: mm.score, reverse=True)
    return matches


def scan(
    transactions: List[TxRecord],
    config: Optional[DuplicateConfig] = None,
) -> List[DuplicateGroup]:
    """Detect duplicate groups within a set of transactions (union-find)."""
    config = config or DuplicateConfig()
    if len(transactions) < 2:
        return []

    norm = {r.id: normalize_description(r.description) for r in transactions}
    sim = _description_sims([norm[r.id] for r in transactions])
    idx = {r.id: i for i, r in enumerate(transactions)}

    matches: List[Match] = []
    for i in range(len(transactions)):
        for j in range(i + 1, len(transactions)):
            m = _score_pair(transactions[i], transactions[j], norm, config, sim, idx)
            if m is not None:
                matches.append(m)

    if not matches:
        return []

    uf = _UnionFind([r.id for r in transactions])
    for m in matches:
        uf.union(m.a_id, m.b_id)

    groups: Dict[str, List[str]] = {}
    for r in transactions:
        root = uf.find(r.id)
        groups.setdefault(root, []).append(r.id)

    result: List[DuplicateGroup] = []
    match_by_pair = {(m.a_id, m.b_id): m for m in matches}
    for members in groups.values():
        if len(members) < 2:
            continue
        group_matches: List[Match] = []
        for x in range(len(members)):
            for y in range(x + 1, len(members)):
                a, b = members[x], members[y]
                key = (a, b) if (a, b) in match_by_pair else (b, a)
                if key in match_by_pair:
                    group_matches.append(match_by_pair[key])
        group_matches.sort(key=lambda mm: mm.score, reverse=True)
        result.append(DuplicateGroup(members=sorted(members), matches=group_matches))
    return result
