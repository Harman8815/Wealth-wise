# Duplicate Transaction Detection

Detects **near-duplicate** transactions (not just exact repeats) both at
**import time** (compare incoming rows against already-saved transactions and
skip/flag) and via an on-demand **standing scan** that surfaces duplicate
groups for review.

Scoring is delegated to a stateless ML microservice (`ML-Backend/`) that uses
**TF-IDF + cosine similarity** on normalized descriptions, blended with amount
and date-proximity into a weighted confidence score. The Django backend
orchestrates, persists results, enforces auth/project scoping, and emits
notifications.

## Architecture

```
Frontend ──HTTP──> Django (/api/duplicates/…, /imports/…commit)
                       │  auth, project scoping, persistence, notifications
                       └──internal HTTP──> ML-Backend (FastAPI, stateless)
                                             TF-IDF + cosine + amount/date scoring
```

The ML service is reached only from Django over `ML_SERVICE_URL`
(default `http://localhost:8100`). If it is unavailable, import proceeds without
cross-data dedup and the standing scan returns empty results — a scoring
failure never blocks a financial write.

## Models

| Model | Purpose |
|-------|---------|
| `DuplicateGroup` | A cluster of transactions surfaced as probable duplicates (`open` / `reviewed` / `dismissed`). |
| `DuplicateMatch` | One scored pair within a group: `score`, `confidence` (`high` / `medium`), `features`, `explanation`, `resolution` (`pending` / `kept` / `deleted` / `not_duplicate`). |
| `DuplicateFeedback` | Explicit `duplicate` / `not_duplicate` label for a pair; suppresses re-flagging and feeds future tuning. |

All models are project-scoped (project=None preserves legacy pre-scoping data).

## API Endpoints

All endpoints require JWT auth and honor the `X-Project-Id` header for project
scoping.

### `GET /api/duplicates/`
List **open** `DuplicateGroup`s with their matches (paginated).

### `POST /api/duplicates/scan/`
Trigger a standing scan for the active project. Persists groups/matches and
emits an `Activity` notification. Returns `{ groups_found, groups }`.

### `POST /api/duplicates/{group_id}/matches/{match_id}/resolve/`
Resolve a single match.

**Body:**
```json
{ "resolution": "kept" }
```
`resolution` ∈ `kept` | `deleted` | `not_duplicate`.
- `kept` — keep both transactions.
- `deleted` — delete the duplicate transaction (reuses the normal Transaction
  delete path so balances + financial-health recompute still run); returns `204`.
- `not_duplicate` — keep both, write `DuplicateFeedback` so the pair is never
  re-flagged, and dismiss the group.

### `POST /api/duplicates/feedback/`
Record an explicit label for a pair.

**Body:**
```json
{ "transaction_a": "<uuid>", "transaction_b": "<uuid>", "label": "not_duplicate" }
```

## Import-time detection

`POST /imports/{job_id}/commit/` runs `detect_for_import` on valid normalized
rows before insert:
- Rows with `confidence == high` are **skipped by default**. Set
  `skip_duplicates: false` in the request to import them anyway.
- Rows with `medium` confidence are inserted but recorded as pending
  `DuplicateMatch` rows for later review.
- The response is extended with `duplicates_skipped` and `duplicates_flagged`
  (and a `warning` if the ML service was unavailable).

## Scoring

1. **Normalize** description: lowercase, strip punctuation, drop trailing
   reference numbers and bank-noise tokens.
2. **Block**: only compare pairs whose amounts are within `amount_tolerance`
   and whose dates are within `date_window_days`.
3. **Features (0–1)**: `description_sim` (TF-IDF + cosine, `difflib` fallback),
   `amount_sim`, `date_sim`.
4. **Combined score** = weighted sum normalized by total weight.
   `high` if `>= threshold_high`, else `medium` if `>= threshold_medium`, else dropped.
5. **Grouping**: union-find over pairs ≥ `threshold_medium`.
6. Pairs are only compared within the **same `type`** (income vs. expense never pair).

### Defaults

`amount_tolerance=0.01`, `date_window_days=4`, `threshold_high=0.85`,
`threshold_medium=0.65`, `weights={description:0.5, amount:0.3, date:0.2}`.

## Running the ML service

See `ML-Backend/README.md`.
