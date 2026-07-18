# Financial Health Score Engine — Architecture Summary

A **project-scoped, explainable** financial-health engine. It computes one 0–100
score from 10 independently weighted dimensions and explains every number.

## Layers (separation of concerns)

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Data | `api/models_financial_health.py`, `models.py` re-export | Persist config, score snapshots, recommendations |
| Engine | `api/services/financial_health.py` | Gather metrics, score dimensions, rule engine, persistence, event hooks |
| Notifications | `api/services/notifications.py` (`notify_financial_health`) | Score-change / risk / budget / recommendations alerts |
| API | `api/views/financial_health.py`, `urls.py`, `serializers.py`, `admin.py` | REST surface, project scoping |
| Hooks | `api/views/{transactions,budget_categories,goals,recurring,recurring_budgets,data_io}.py` | Event-driven recompute on writes/imports |
| Frontend | `api/services/financial-health.ts`, `hooks/use-financial-health.ts`, `components/dashboard/financial-health-card.tsx`, `financial-health-report.tsx` | Card, report, data fetching |

## Scoring model

Final score = Σ(dimension.normalized_score × weight) ÷ Σ(weight) × 100.

Weights come from `ScoreDimensionConfig` (DB-backed, per project) and fall back
to `DEFAULT_DIMENSION_WEIGHTS`. Each dimension exposes:
`raw_metrics`, `normalized_score`, `weight`, `contribution`, `explanation`,
`recommendations` → fully **explainable**.

Dimensions: budget_management, cash_flow_stability, savings_ratio,
income_stability, expense_distribution, spending_behaviour, goal_progress,
financial_discipline, recurring_commitments, risk_indicators.

## Configurable rule engine

`RULE_REGISTRY` + `@register_rule`. Rules return triggered alerts
(`budget_health_deteriorated`, `financial_risk_increased`, `savings_improved`).
Add a rule without touching the scorer.

## Event-driven updates

`recompute_after_change(user, project)` is called from the ViewSets on:
transactions (create/update/delete), budgets (CRUD + `update_spent`),
goals (CRUD + contribute + toggle), recurring rules & budgets (CRUD + generate +
pause/resume + run_due), and import commit. Each write triggers one incremental
recompute for the affected project. Switching projects resolves the new
`active_project` so the next `/financial-health/current/` reflects it.

## Notifications (existing engine integration)

`notify_financial_health` fires on: score improved (≥5), score dropped (≤−5),
risk increased, budget deteriorating, new recommendations.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/financial-health/current/` | Latest snapshot (computes on demand if none) |
| GET | `/api/financial-health/history/` | Timeline (paginated) |
| GET | `/api/financial-health/report/` | Snapshot + recommendations + estimated uplift |
| POST | `/api/financial-health/recompute/` | Force recompute (notify on) |
| GET/PUT | `/api/financial-health/config/` | Read / update dimension weights & enabled flags |

All endpoints are scoped to `request.active_project` (X-Project-Id header).

## Frontend

- `FinancialHealthCard` — live score, grade, trend, top strengths/risks, links
  to the report; shown on the dashboard overview and the Reports page.
- `FinancialHealthReport` — full breakdown (per-dimension bars) + actionable
  recommendations with estimated score uplift; rendered under the Reports page
  "Financial Health" tab (`/dashboard/reports?tab=health`).
- Configurable weights are editable via the `config` API; recompute is one click.

## Tests

`api/tests/test_financial_health.py` (16 tests) covers engine math, clamping,
configurable/disabling weights, persistence + timeline, recommendations, rule
engine, the full API surface, and event-driven recompute. All pass; `makemigrations --check` and `manage.py check` are clean.
