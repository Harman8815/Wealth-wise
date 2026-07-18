# WealthWise Duplicate Detection — ML Microservice

A **stateless, compute-only** FastAPI service that detects near-duplicate
transactions using **TF-IDF + cosine similarity** on normalized descriptions,
blended with amount and date-proximity features into a weighted confidence
score.

It is reached only from the Django backend (never directly by browsers or the
frontend) over HTTP. It owns **no database, no authentication, no project
scoping** — all of that lives in Django, which passes candidate records in the
request body.

## Run it

```bash
cd ML-Backend
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8100
```

Health check:

```bash
curl http://localhost:8100/health
```

The Django backend expects this service at `ML_SERVICE_URL`
(default `http://localhost:8100`).

## Endpoints

### `POST /duplicates/scan`

Group a set of transactions into duplicate groups.

```json
{
  "transactions": [
    {"id": "t1", "date": "2024-01-05", "amount": 2500.0, "description": "Swiggy order 1234", "type": "expense"},
    {"id": "t2", "date": "2024-01-06", "amount": 2500.0, "description": "SWIGGY ORDER 1234", "type": "expense"}
  ],
  "config": {
    "amount_tolerance": 0.01,
    "date_window_days": 4,
    "threshold_high": 0.85,
    "threshold_medium": 0.65,
    "weights": {"description": 0.5, "amount": 0.3, "date": 0.2}
  }
}
```

Response:

```json
{
  "groups": [
    {
      "members": ["t1", "t2"],
      "matches": [
        {
          "a_id": "t1", "b_id": "t2", "score": 0.92, "confidence": "high",
          "features": {"description_sim": 0.95, "amount_sim": 1.0, "date_sim": 0.75},
          "explanation": "Same amount ₹2,500.00, 1 day apart, 95% description match."
        }
      ]
    }
  ]
}
```

### `POST /duplicates/score-batch`

Score one incoming transaction against a set of already-saved ones (import time).

```json
{
  "candidate": {"id": "new", "date": "2024-02-01", "amount": 1200.0, "description": "Zomato 9981", "type": "expense"},
  "existing": [ {"id": "t9", "date": "2024-02-02", "amount": 1200.0, "description": "ZOMATO 9981", "type": "expense"} ],
  "config": { }
}
```

Response:

```json
{ "matches": [ { "a_id": "new", "b_id": "t9", "score": 0.9, "confidence": "high", ... } ] }
```

## Scoring

1. **Normalize** description: lowercase, strip punctuation, drop trailing
   reference numbers and bank-noise tokens.
2. **Block**: only compare pairs whose amounts fall within `amount_tolerance`
   and whose dates are within `date_window_days` (keeps cost ~O(n) per bucket).
3. **Features (0–1)**:
   - `description_sim` — TF-IDF + cosine; falls back to `difflib` ratio for
     sparse buckets.
   - `amount_sim` — `1.0` within tolerance, linear decay otherwise.
   - `date_sim` — `1 - day_gap / window`, clamped ≥ 0.
4. **Combined score** — weighted sum normalized by total weight.
   `confidence = high` if `score >= threshold_high`, else `medium` if
   `>= threshold_medium`, else dropped.
5. **Grouping** — union-find over pairs ≥ `threshold_medium`.

Transactions are only compared within the **same `type`** (income vs. expense
are never paired).

## Tests

```bash
pip install -r requirements.txt
pytest tests
```
