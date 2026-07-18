# Subscription Detection

Automatically discovers **recurring subscriptions** hidden in a user's transaction
history using **pattern mining** — grouping expenses by a normalized merchant,
detecting a stable amount that repeats on a regular cadence. This is distinct from
the user-configured `RecurringRule` records (those are explicit schedules the user
created); this engine *mines* implicit subscriptions from past spend so the user
can review, confirm, ignore, or promote them into real recurring rules.

## Architecture

```
Transaction history ──pattern mining──> services/subscriptions.py
                                            │ group by merchant, infer cadence,
                                            │ confidence, monthly cost
                                            ├─ persist Subscription rows (deduped)
                                            ├─ notify_subscriptions_found (Bills alert)
                                            └─ user actions: confirm / ignore / convert
                                                                    │
                                                                    ▼
                                                       RecurringRule (real schedule)
```

The engine mirrors `services.insights` / `services.duplicates`: pure functions over
querysets, a `detect_for_project()` that persists and dedupes, and
`detect_after_change()` as the defensive event hook. It does **not** call an
external ML service, so it needs no network and never blocks a financial write.

## Detection heuristic

For each candidate (expense) transaction group keyed by normalized merchant:

1. Require at least `MIN_OCCURRENCES` (3) transactions spaced over time.
2. Check the amount is *stable* (coefficient of variation under
   `AMOUNT_CV_THRESHOLD`, or within an absolute tolerance) — small per-cycle
   variance (taxes, rounding) is normal.
3. Cluster the inter-arrival gaps into weekly (~7d), bi-weekly (~14d), monthly
   (~30d), quarterly (~91d), yearly (~365d) buckets to infer `cadence`.
4. Assign `confidence` from occurrence count + cadence clarity; compute
   `avg_amount` and `monthly_cost` (cadence-normalized to a per-month figure).

Merchant normalization lowercases, strips punctuation/bank noise, drops reference
numbers and common business/domain suffixes (`NETFLIX.COM` → `netflix`) so the same
merchant with different reference ids collapses to one key.

## Models

| Model | Purpose |
|-------|---------|
| `Subscription` | A detected recurring charge: `merchant`, `display_name`, `status` (`detected` / `confirmed` / `ignored` / `converted`), `cadence`, `confidence`, `avg_amount`, `monthly_cost`, `occurrences`, `last_seen`, `category`, `dedup_key`, `converted_rule`. |
| `SubscriptionFeedback` | Explicit `ignored` / `confirmed` label for a merchant; `ignored` suppresses re-detection (mirrors `DuplicateFeedback`). |

All models are project-scoped (project=None preserves legacy pre-scoping data).
Indexed on `(user, project, status, detected_at)` and `dedup_key`.

## Endpoints

All require JWT auth and honor the `X-Project-Id` header for project scoping.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/subscriptions/` | List detected (non-ignored, non-converted) subscriptions (paginated). |
| `POST` | `/api/subscriptions/scan/` | Re-run pattern mining; returns the detected list. |
| `POST` | `/api/subscriptions/{id}/confirm/` | Mark a subscription confirmed. |
| `POST` | `/api/subscriptions/{id}/ignore/` | Ignore a subscription; suppress its merchant from future scans. |
| `POST` | `/api/subscriptions/{id}/convert/` | Promote into a `RecurringRule` (optionally `category_id` / `account_id` in body). |

## Generation triggers

- **On demand**: `POST /api/subscriptions/scan/` or `detect_for_project()`.
- **Automatically**: `detect_after_change()` is called from
  `recompute_after_change()` (in `services/financial_health.py`), which the existing
  transaction/budget/goal/recurring hooks already invoke — so subscriptions refresh
  whenever financial data changes, with no new per-write triggers.

## Deduplication & notifications

- Subscription rows dedupe by `dedup_key` (`sub:{merchant}:{project}`): re-running
  the detector updates the existing *unconfirmed* row in place instead of creating
  duplicates. Once `confirm`ed, `ignore`d, or `convert`ed, the row is left alone
  and skipped by the list endpoint.
- A single `Bills`-category `Alert` ("N subscriptions detected") is emitted at most
  once per day per project via `notify_subscriptions_found`.

## Converting to a recurring rule

`convert_subscription()` promotes a detected subscription into a real
`RecurringRule` carrying the mined cadence/amount. `biweekly` maps to a `weekly`
rule with `interval=2`; the new rule links back via `converted_rule` so it is not
double-counted, and a financial-health recompute fires (defensive).

## Failure modes

- Engine errors in `detect_after_change()` are swallowed (defensive) so they never
  block the underlying financial write.
- Cold start (too few transactions / no stable series): the detector returns `[]`;
  the panel shows empty, not an error.
