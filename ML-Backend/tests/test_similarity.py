"""
Unit tests for the duplicate-detection similarity core.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.similarity import (
    normalize_description,
    DuplicateConfig,
    TxRecord,
    scan,
    score_batch,
)


def _t(tid, date, amount, desc, ttype="expense"):
    return TxRecord(id=tid, date=date, amount=amount, description=desc, type=ttype)


def test_normalize_strips_noise():
    out = normalize_description("SWIGGY ORDER 1234 (Ref No. 9981)")
    assert "1234" not in out
    assert "ref" not in out
    assert "swiggy" in out
    assert "order" in out


def test_exact_duplicate_is_high():
    txns = [
        _t("a", "2024-01-05", 2500.0, "Swiggy order 1234"),
        _t("b", "2024-01-06", 2500.0, "SWIGGY ORDER 1234"),
    ]
    groups = scan(txns)
    assert len(groups) == 1
    assert set(groups[0].members) == {"a", "b"}
    assert groups[0].matches[0].confidence == "high"


def test_near_duplicate_is_medium():
    txns = [
        _t("a", "2024-01-05", 2500.0, "Burger King connaught place"),
        _t("b", "2024-01-09", 2498.0, "Burger King cp"),
    ]
    groups = scan(txns)
    assert len(groups) == 1
    assert groups[0].matches[0].confidence in ("high", "medium")


def test_unrelated_is_dropped():
    txns = [
        _t("a", "2024-01-05", 2500.0, "Swiggy order 1234"),
        _t("b", "2024-03-20", 999.0, "Electricity bill payment"),
    ]
    assert scan(txns) == []


def test_opposite_type_not_matched():
    txns = [
        _t("a", "2024-01-05", 2500.0, "Refund swiggy 1234", ttype="income"),
        _t("b", "2024-01-06", 2500.0, "Refund swiggy 1234", ttype="expense"),
    ]
    assert scan(txns) == []


def test_score_batch_returns_sorted_matches():
    candidate = _t("new", "2024-02-01", 1200.0, "Zomato 9981")
    existing = [
        _t("x", "2024-02-02", 1200.0, "ZOMATO 9981"),
        _t("y", "2024-06-01", 5.0, "Coffee"),
    ]
    matches = score_batch(candidate, existing)
    assert len(matches) == 1
    assert matches[0].b_id == "x"
    assert matches[0].confidence == "high"


def test_score_batch_empty_existing():
    candidate = _t("new", "2024-02-01", 1200.0, "Zomato 9981")
    assert score_batch(candidate, []) == []


def test_blocking_date_window():
    txns = [
        _t("a", "2024-01-05", 2500.0, "Swiggy order 1234"),
        _t("b", "2024-01-30", 2500.0, "Swiggy order 1234"),
    ]
    # 25 days apart > default 4-day window => not a duplicate.
    assert scan(txns) == []


def test_config_from_dict_defaults():
    cfg = DuplicateConfig.from_dict(None)
    assert cfg.amount_tolerance == 0.01
    assert cfg.threshold_high == 0.85
    cfg2 = DuplicateConfig.from_dict({"amount_tolerance": 5.0, "weights": {"description": 0.7}})
    assert cfg2.amount_tolerance == 5.0
    assert cfg2.weights["description"] == 0.7
    assert cfg2.weights["amount"] == 0.3
