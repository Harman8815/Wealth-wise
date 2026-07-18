# Dynamic AI Insights

A cross-cutting, persisted, dismissible **insight feed** surfaced on the dashboard
(`AIInsightsCard`). Insights are narrative, business-rule findings distinct from
the Financial Health Score's `HealthRecommendation` rows: spending anomalies,
category spikes, recurring/subscription drift, savings opportunities, and goal
momentum.

## Architecture

```
Dashboard (AIInsightsCard) ─GET /api/insights/─> InsightsViewSet
                                                   │ auth, project scoping,
                                                   │ persistence, dismiss
                                                   ├─ services/insights.py
                                                   │    INSIGHT_RULES registry -> Insight rows
                                                   └─ services/notifications.py
                                                        notify_insight_found(...)
```

The engine mirrors `services/financial_health.py`: a `RuleContext` + `INSIGHT_RULES`
list of pure functions, `generate_for_project()` that persists and dedupes, and
`generate_after_change()` as the defensive event hook.

## Model

`Insight` (`models_insights.py`, table `insights`):

| Field | Notes |
|-------|-------|
| `user`, `project` | Project-scoped via `project_scope_filter` (`project=None` keeps legacy visibility). |
| `kind` | `spending`, `saving`, `investment`, `alert`, `goal`, `recurring`. |
| `title`, `description` | Narrative text. |
| `severity` | `positive`, `negative`, `neutral` (maps to the card's `impact`). |
| `dedup_key` | Stable `insight:{rule_key}:{project}` key for regeneration dedup. |
| `metadata` | `{amount?, percentage?, category?}` feeding the card. |
| `action_url` | Where the card's action button routes (e.g. `/dashboard/budget`). |
| `dismissed` | Hides the row from the feed; survives regenerations. |
| `generated_at`, `created_at` | Timestamps. |

Indexed on `(user, project, dismissed, generated_at)`.

## Rules (`INSIGHT_RULES`)

1. **`spending_spike`** — a category whose MoM expense grew > 15%. `kind=spending`, `severity=negative`.
2. **`category_over_budget_drift`** — budget ≥ 80% used, with remaining days + suggested daily cap. `kind=alert`, `severity=negative`, `action=/dashboard/budget`.
3. **`subscription_creep`** — recurring expense ≥ 30% of income. `kind=saving`, `severity=positive`, `action=/dashboard/recurring`.
4. **`savings_opportunity`** — positive savings rate but no active goals. `kind=investment`, `severity=positive`, `action=/dashboard/goals`.
5. **`goal_momentum`** — an active goal ≥ 75% funded. `kind=goal`, `severity=positive`, `action=/dashboard/goals`.

Add new rules by decorating a pure function with `@register_rule('key')` — it
receives a `RuleContext` and returns a list of insight dicts.

## Endpoints

All require authentication and are scoped to the active project (`X-Project-Id`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/insights/` | List non-dismissed insights (paginated, newest first). |
| `POST` | `/api/insights/generate/` | Generate/refresh insights; returns the refreshed list. |
| `POST` | `/api/insights/{id}/dismiss/` | Dismiss a single insight. |

## Generation triggers

- **On demand**: `POST /api/insights/generate/` or `generate_for_project()`.
- **Automatically**: `generate_after_change()` is called from
  `recompute_after_change()` (in `services/financial_health.py`), which the
  existing transaction/budget/goal/recurring hooks already invoke — so insights
  refresh whenever financial data changes, with no new per-write triggers.

## Deduplication & notifications

- Insight rows dedupe by `dedup_key`: re-running a rule updates the existing
  undismissed row in place instead of creating duplicates. If a rule no longer
  fires, its previous row is dismissed (so it leaves the feed). Dismissed rows
  are left alone.
- A single `AI`-category `Alert` ("New financial insights available") is emitted
  at most once per day per project via `notify_insight_found`.

## Failure modes

- Engine errors in `generate_after_change()` are swallowed (defensive) so they
  never block the underlying financial write.
- Cold start (no history): rules that need history simply return `[]`; the panel
  shows empty, not an error.
