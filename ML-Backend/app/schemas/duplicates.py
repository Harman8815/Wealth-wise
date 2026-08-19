"""
Pydantic request/response schemas for the duplicate-detection service.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class TransactionIn(BaseModel):
    id: str
    date: str  # ISO yyyy-mm-dd
    amount: float
    description: str = ""
    type: str = "expense"


class DuplicateConfigIn(BaseModel):
    amount_tolerance: float = 0.01
    date_window_days: int = 4
    threshold_high: float = 0.85
    threshold_medium: float = 0.65
    weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "description": 0.5,
            "amount": 0.3,
            "date": 0.2,
        }
    )


class FeatureBreakdown(BaseModel):
    description_sim: float
    amount_sim: float
    date_sim: float


class MatchOut(BaseModel):
    a_id: str
    b_id: str
    score: float
    confidence: str  # "high" | "medium"
    features: FeatureBreakdown
    explanation: str


class GroupOut(BaseModel):
    members: List[str]
    matches: List[MatchOut]


class ScanRequest(BaseModel):
    transactions: List[TransactionIn]
    config: Optional[DuplicateConfigIn] = None


class ScanResponse(BaseModel):
    groups: List[GroupOut]


class ScoreBatchRequest(BaseModel):
    candidate: TransactionIn
    existing: List[TransactionIn]
    config: Optional[DuplicateConfigIn] = None


class ScoreBatchResponse(BaseModel):
    matches: List[MatchOut]
