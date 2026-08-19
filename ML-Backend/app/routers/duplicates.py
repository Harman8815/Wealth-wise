"""
Duplicate-detection API router (FastAPI).

Exposes two endpoints:

* ``POST /duplicates/scan`` — group a set of existing transactions into
  duplicate groups.
* ``POST /duplicates/score-batch`` — score one incoming transaction against a
  set of already-saved transactions (used at import time).
"""
from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException, Request, status

from ..schemas.duplicates import (
    ScanRequest, ScanResponse, ScoreBatchRequest, ScoreBatchResponse,
    MatchOut, GroupOut, FeatureBreakdown,
)
from ..similarity import (
    scan as scan_fn,
    score_batch as score_fn,
    DuplicateConfig,
    TxRecord,
)

router = APIRouter(prefix="/duplicates", tags=["duplicates"])

_MAX_TRANSACTIONS = 50_000


def _to_record(t) -> TxRecord:
    return TxRecord.from_dict(t.model_dump())


def _to_match_out(m) -> MatchOut:
    return MatchOut(
        a_id=m.a_id, b_id=m.b_id, score=m.score, confidence=m.confidence,
        features=FeatureBreakdown(
            description_sim=m.features.description_sim,
            amount_sim=m.features.amount_sim,
            date_sim=m.features.date_sim,
        ),
        explanation=m.explanation,
    )


@router.post("/scan", response_model=ScanResponse)
def scan_endpoint(request: ScanRequest, raw: Request):
    if len(request.transactions) > _MAX_TRANSACTIONS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Too many transactions; max {_MAX_TRANSACTIONS}.",
        )
    t0 = time.time()
    config = DuplicateConfig.from_dict(request.config.model_dump() if request.config else None)
    recs = [_to_record(t) for t in request.transactions]
    groups = scan_fn(recs, config)
    groups_out = [
        GroupOut(
            members=g.members,
            matches=[_to_match_out(m) for m in g.matches],
        )
        for g in groups
    ]
    elapsed = time.time() - t0
    if elapsed > 1.0:
        raw.app.logger.info("scan processed %d txns in %.2fs", len(recs), elapsed)
    return ScanResponse(groups=groups_out)


@router.post("/score-batch", response_model=ScoreBatchResponse)
def score_batch_endpoint(request: ScoreBatchRequest):
    config = DuplicateConfig.from_dict(request.config.model_dump() if request.config else None)
    candidate = _to_record(request.candidate)
    existing = [_to_record(t) for t in request.existing]
    matches = score_fn(candidate, existing, config)
    return ScoreBatchResponse(matches=[_to_match_out(m) for m in matches])
