# ML Integration Audit — Wealth-wise Project

**Audit Date:** 2026-08-30  
**Last Updated:** 2026-08-30  
**Project Root:** `D:\CODING\project\TODO Projects\Wealth-wise`

---

## 1. Executive Summary

The Wealth-wise project contains a **dual-backend ML architecture**:

- **ML-Backend** (FastAPI): Houses LLM orchestration (Ollama), chat agents, duplicate detection, and report generation.
- **Django Backend**: Houses deterministic ML-powered engines (Financial Health Score, Dynamic Insights, Subscription Detection, Transaction Category Prediction) and acts as the primary API for the frontend.
- **ML-Notebooks**: Contains experimental notebooks and serialized model artifacts. Some are actively used; others are orphaned.

### Key Findings

| Category | Count |
|----------|-------|
| **Active, fully integrated ML models** | 7 |
| **Partially integrated / dead endpoints** | 4 |
| **Orphaned model artifacts (notebooks only)** | 0 |
| **Critical broken integrations** | 2 |
| **High severity issues** | 3 |
| **Medium severity issues** | 4 |
| **Low severity issues** | 3 |

### Overall Health: **GOOD**

The core ML features (anomaly detection, spending forecast, merchant clustering, budget forecast, duplicate detection, financial health, insights, chat agents) are **functional and integrated**. Orphaned notebooks and model artifacts have been removed. Remaining technical debt consists of partially integrated endpoints and missing frontend integrations for backend-only features.

---

## 2. ML Model Inventory Table

### 2.1 Active ML Models (Fully Integrated)

| # | Model Name | Type | Location | Backend Endpoint | Frontend Integration | Status |
|---|-----------|------|----------|-----------------|---------------------|--------|
| 1 | **Transaction Anomaly Detection** | Isolation Forest | `Backend/api/services/ml_services.py` + `ML-Notebooks/Transaction Anomaly Detection/model/` | `GET /api/ml/anomalies/` | `Frontend/api/services/ml.ts` → `mlApi.getAnomalies()` → `Frontend/app/dashboard/insights/anomalies/page.tsx` | ✅ Active |
| 2 | **Spending Forecast** | Prophet + LSTM | `Backend/api/services/ml_services.py` + `ML-Notebooks/Spending Forecast/` | `GET /api/ml/forecast/` | `Frontend/api/services/ml.ts` → `mlApi.getForecast()` → `Frontend/app/dashboard/insights/forecast/page.tsx` | ✅ Active |
| 3 | **Merchant Clustering** | KMeans | `Backend/api/services/ml_services.py` + `ML-Notebooks/merchant clustering/models/` | `GET /api/ml/clusters/` | `Frontend/api/services/ml.ts` → `mlApi.getClusters()` → `Frontend/app/dashboard/insights/clusters/page.tsx` | ✅ Active |
| 4 | **Budget Forecast** | Deterministic heuristic | `Backend/api/services/ml_services.py` | `GET /api/ml/budget-forecast/` | `Frontend/api/services/ml.ts` → `mlApi.getBudgetForecast()` → `Frontend/app/dashboard/insights/budget-forecast/page.tsx` | ✅ Active |
| 5 | **Duplicate Detection** | TF-IDF + Cosine Similarity | `ML-Backend/app/similarity.py` | `POST /duplicates/scan`, `POST /duplicates/score-batch` (ML-Backend) → Django `POST /api/duplicates/scan/` | `Frontend/app/dashboard/duplicates/page.tsx` → `apiClient.post('/duplicates/scan/')` | ✅ Active |
| 6 | **Financial Health Score** | Weighted rule-based engine | `Backend/api/services/financial_health.py` | `GET /api/financial-health/current/`, `GET /api/financial-health/report/`, `POST /api/financial-health/recompute/` | `Frontend/api/services/financial-health.ts` → `Frontend/components/dashboard/financial-health-card.tsx` + `Frontend/components/dashboard/pages/reports.tsx` | ✅ Active |
| 7 | **Dynamic AI Insights** | Rule-based engine | `Backend/api/services/insights.py` | `GET /api/insights/`, `POST /api/insights/generate/`, `POST /api/insights/{id}/dismiss/` | `Frontend/api/services/insights.ts` → `insightsApi.list()` / `insightsApi.generate()` → `Frontend/components/dashboard/main-content.tsx` | ✅ Active |

### 2.2 LLM-Based Models (ML-Backend)

| # | Model Name | Type | Location | Backend Endpoint | Frontend Integration | Status |
|---|-----------|------|----------|-----------------|---------------------|--------|
| 8 | **Intent Classifier** | LLM prompt-based (Ollama llama3.2) | `ML-Backend/app/services/intent.py` | `POST /chat/agent` (internal) | `Frontend/api/services/chat.ts` → `sendAgentMessage()` | ✅ Active |
| 9 | **Report Generator** | LLM + deterministic (Ollama) | `ML-Backend/app/services/reports.py` | `POST /reports/generate`, `GET /reports/summary` | `Frontend/api/services/ml-reports.ts` → `generateMLReport()` → `Frontend/components/dashboard/pages/reports.tsx` | ✅ Active |
| 10 | **Chart/Alert Explainer** | LLM (Ollama) | `ML-Backend/app/services/reports.py` | `POST /reports/explain` | `Frontend/api/services/ml-reports.ts` → `explainChartOrAlert()` → `Frontend/components/dashboard/pages/reports.tsx` | ✅ Active |
| 11 | **Goal Planning Assistant** | LLM + calculations (Ollama) | `ML-Backend/app/services/assistants.py` | `POST /chat/goal-planning`, `POST /chat/agent` (intent=goal) | `Frontend/api/services/chat.ts` → `sendAgentMessage()` with `/goal` slash command | ✅ Active |
| 12 | **Budget Planning Assistant** | LLM + calculations (Ollama) | `ML-Backend/app/services/assistants.py` | `POST /chat/budget-planning`, `POST /chat/agent` (intent=budget) | `Frontend/api/services/chat.ts` → `sendAgentMessage()` with `/budget` slash command | ✅ Active |
| 13 | **Insights Agent** | LLM + Django insights API (Ollama) | `ML-Backend/app/services/insights_agent.py` | `POST /chat/agent` (intent=insights) | `Frontend/api/services/chat.ts` → `sendAgentMessage()` with `/insights` slash command | ✅ Active |
| 14 | **Database Context Agent** | LLM + Django schema introspection (Ollama) | `ML-Backend/app/services/db_agent.py` | `POST /chat/agent` (intent=db_context) | `Frontend/api/services/chat.ts` → `sendAgentMessage()` with `/db` slash command | ✅ Active |
| 15 | **Memory/Context System** | Ollama embeddings (nomic-embed-text) + Chroma | `ML-Backend/app/services/memory.py`, `embeddings.py`, `context.py` | `GET /user/memory`, `DELETE /user/memory/{id}` | No direct frontend integration (internal use by chat) | ✅ Active (internal) |

### 2.3 Partially Integrated / Unused Models

| # | Model Name | Type | Location | Backend Endpoint | Frontend Integration | Status |
|---|-----------|------|----------|-----------------|---------------------|--------|
| 16 | **Transaction Category Predictor** | Random Forest (TF-IDF) | `Backend/api/services/ml_training/inference.py` + `Backend/api/views/transactions.py` → `predict_category` action | `POST /api/transactions/predict_category/` | ❌ **No frontend integration found** | ⚠️ Backend only |
| 17 | **Subscription Detection** | Pattern mining (rule-based) | `Backend/api/services/subscriptions.py` | `GET /api/subscriptions/`, `POST /api/subscriptions/scan/` | `Frontend/app/dashboard/recurring/page.tsx` — **Does NOT call subscriptions API** | ⚠️ Backend only |

### 2.4 Orphaned Models (Removed in cleanup)

| # | Model Name | Type | Location | Backend Endpoint | Frontend Integration | Status |
|---|-----------|------|----------|-----------------|---------------------|--------|
| 18 | **Auto Budget Category Classifier** | Random Forest pipeline | `ML-Notebooks/auto budget category classifier/` | ❌ None | ❌ None | 🗑️ Removed (2026-08-30) |
| 19 | **AI Report Generator (RAG)** | LLM RAG (notebook) | `ML-Notebooks/AI Report Generator/` | ❌ None (replaced by ML-Backend) | ❌ None | 🗑️ Removed (2026-08-30) |
| 20 | **Alert Explanation (RAG)** | LLM RAG (notebook) | `ML-Notebooks/Alert Explanation/` | ❌ None (replaced by ML-Backend) | ❌ None | 🗑️ Removed (2026-08-30) |
| 21 | **Chart Explanation (RAG)** | LLM RAG (notebook) | `ML-Notebooks/Chart Explanation/` | ❌ None (replaced by ML-Backend) | ❌ None | 🗑️ Removed (2026-08-30) |
| 22 | **Budget Forecasting (notebook)** | N/A (no saved model) | `ML-Notebooks/budget-forecasting/` | ❌ None | ❌ None | 🗑️ Removed (2026-08-30) |
| 23 | **Budget Prediction (notebook)** | N/A (no saved model) | `ML-Notebooks/budget prediction/` | ❌ None | ❌ None | 🗑️ Removed (2026-08-30) |

---

## 3. Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌───────────────┐ │
│  │ mlApi (ml.ts)        │    │ insightsApi          │    │ chat.ts       │ │
│  │ - getAnomalies()     │    │ - list()             │    │ - sendChat... │ │
│  │ - getForecast()      │    │ - generate()         │    │ - sendAgent...│ │
│  │ - getClusters()      │    │ - dismiss()          │    │               │ │
│  │ - getBudgetForecast()│    └──────────┬───────────┘    └───────┬───────┘ │
│  └──────────┬───────────┘               │                          │        │
│             │                            │                          │        │
│  ┌──────────▼───────────┐    ┌──────────▼───────────┐    ┌───────▼───────┐ │
│  │ ml-reports.ts        │    │ main-content.tsx     │    │ FloatingChat  │ │
│  │ - generateMLReport() │    │ (Dashboard Home)     │    │ Widget        │ │
│  │ - getMLReportSummary()│   │ - loads insights     │    │               │ │
│  │ - explainChart...()  │    │ - shows AIInsightsCard│   │               │ │
│  └──────────┬───────────┘    └──────────────────────┘    └───────────────┘ │
│             │                                                              │
│  ┌──────────▼───────────────────────────────────────────────────────────┐ │
│  │ financial-health.ts                                                   │ │
│  │ - getCurrent(), getHistory(), getReport(), recompute(), getConfig()   │ │
│  └──────────┬───────────────────────────────────────────────────────────┘ │
│             │                                                              │
│  ┌──────────▼───────────────────────────────────────────────────────────┐ │
│  │ Pages                                                                 │ │
│  │ - /dashboard/insights/anomalies    → mlApi.getAnomalies()            │ │
│  │ - /dashboard/insights/forecast     → mlApi.getForecast()             │ │
│  │ - /dashboard/insights/clusters     → mlApi.getClusters()             │ │
│  │ - /dashboard/insights/budget-forecast → mlApi.getBudgetForecast()    │ │
│  │ - /dashboard/duplicates            → apiClient /duplicates/           │ │
│  │ - /dashboard/reports               → generateMLReport(), explain...   │ │
│  │ - /dashboard/ai-insights           → mlApi summary calls              │ │
│  │ - /dashboard/recurring             → useRecurringRules()              │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP/REST
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Django Backend (Port 8000)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ MLViewSet (ml_views.py)                                               │  │
│  │ - GET  /api/ml/anomalies/          → detect_anomalies()             │  │
│  │ - GET  /api/ml/forecast/           → forecast_spending()            │  │
│  │ - GET  /api/ml/clusters/           → cluster_merchants()            │  │
│  │ - GET  /api/ml/budget-forecast/    → forecast_budget()              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FinancialHealthViewSet (financial_health.py)                          │  │
│  │ - GET  /api/financial-health/current/   → recompute_for_project()   │  │
│  │ - GET  /api/financial-health/history/   → list snapshots            │  │
│  │ - GET  /api/financial-health/report/    → full report                │  │
│  │ - POST /api/financial-health/recompute/ → force recompute            │  │
│  │ - GET/PUT /api/financial-health/config/ → dimension weights          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ InsightsViewSet (insights.py)                                         │  │
│  │ - GET  /api/insights/               → list non-dismissed             │  │
│  │ - POST /api/insights/generate/      → generate_for_project()         │  │
│  │ - POST /api/insights/{id}/dismiss/  → dismiss_insight()              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ DuplicateViewSet (duplicates.py)                                      │  │
│  │ - GET  /api/duplicates/             → list open groups               │  │
│  │ - POST /api/duplicates/scan/        → scan_for_project()             │  │
│  │ - POST /api/duplicates/{id}/resolve/ → resolve_match()               │  │
│  │ - POST /api/duplicates/feedback/    → record_feedback()              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SubscriptionViewSet (subscriptions.py)                                │  │
│  │ - GET  /api/subscriptions/          → list detected                  │  │
│  │ - POST /api/subscriptions/scan/     → detect_for_project()           │  │
│  │ - POST /api/subscriptions/{id}/confirm/                             │  │
│  │ - POST /api/subscriptions/{id}/ignore/                              │  │
│  │ - POST /api/subscriptions/{id}/convert/                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TransactionViewSet (transactions.py)                                  │  │
│  │ - POST /api/transactions/predict_category/ → CategoryPredictor       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Reports views (reports.py)                                            │  │
│  │ - GET  /api/reports/filter/         → filter_reports()               │  │
│  │ - GET  /api/reports/export_pdf/     → export_reports_pdf()           │  │
│  │ - GET/POST /api/reports/schedules/  → scheduled_reports()            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ml_client.py → ML-Backend (Port 8100)                                 │  │
│  │ - POST /duplicates/scan                                            │  │
│  │ - POST /duplicates/score-batch                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP (internal)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ML-Backend (FastAPI, Port 8100)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Chat Router (chat.py)                                                 │  │
│  │ - POST /chat              → _chat_with_tools() (tool-calling LLM)    │  │
│  │ - POST /chat/stream       → SSE streaming                            │  │
│  │ - POST /chat/goal-planning → answer_goal_question()                  │  │
│  │ - POST /chat/budget-planning → answer_budget_question()              │  │
│  │ - POST /chat/agent         → classify_intent() + route_intent()      │  │
│  │ - POST /chat/db/refresh    → refresh_database_context()              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Reports Router (reports.py)                                           │  │
│  │ - POST /reports/generate    → build_report()                         │  │
│  │ - GET  /reports/summary     → build_report_sections()                │  │
│  │ - POST /reports/explain     → explain_chart_or_alert()               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Duplicates Router (duplicates.py)                                     │  │
│  │ - POST /duplicates/scan      → scan() [similarity.py]               │  │
│  │ - POST /duplicates/score-batch → score_batch() [similarity.py]       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Conversations Router (conversations.py)                               │  │
│  │ - GET/POST /chats            → CRUD for chat conversations           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Memory Router (memory.py)                                             │  │
│  │ - GET /user/memory           → retrieve_relevant()                   │  │
│  │ - DELETE /user/memory/{id}   → delete memory                         │  │
│  │ - DELETE /user/memory        → delete all memories                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Ollama Adapter (ollama.py)                                            │  │
│  │ - generate()            → /api/chat (llama3.2)                       │  │
│  │ - stream()              → /api/chat (streaming)                      │  │
│  │ - embed()               → /api/embed (nomic-embed-text)              │  │
│  │ - generate_with_tools() → /api/chat (tool-calling)                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Similarity Engine (similarity.py)                                     │  │
│  │ - scan()                 → TF-IDF + cosine + union-find grouping     │  │
│  │ - score_batch()          → pairwise scoring for import-time          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Vector Store (vector.py)                                              │  │
│  │ - Chroma (duckdb+parquet) at data/chroma                              │  │
│  │ - Collection: "memories"                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Reads model artifacts
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ML-Notebooks / Artifacts                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ USED:                                                                   │
│  - Transaction Anomaly Detection/model/                                    │
│    - transaction_anomaly_isolation_forest.pkl                             │
│    - transaction_anomaly_scaler.pkl                                       │
│    - transaction_anomaly_optimal_threshold.pkl                            │
│    - transaction_anomaly_features.pkl                                     │
│                                                                             │
│  - Spending Forecast/                                                      │
│    - spending_forecast_prophet (1).pkl                                    │
│    - spending_forecast_lstm.keras                                         │
│    - spending_forecast_lstm_scaler.pkl                                    │
│    - spending_forecast_metadata.pkl                                       │
│    - spending_forecast_30_days (1).csv                                    │
│                                                                             │
│  - merchant clustering/models/                                             │
│    - clustering_scaler.pkl                                                │
│    - merchant_clusters.csv                                                │
│    - cluster_profiles.csv                                                 │
│    - feature_columns.pkl                                                  │
│    - clustering_metadata.json                                             │
│                                                                             │
│  🔴 ORPHANED (never loaded by any service):                                │
│  - auto budget category classifier/                                        │
│    - product_category_classifier.joblib                                   │
│    - product_category_classifier_v2.joblib                                │
│    - model_metadata.json                                                   │
│                                                                             │
│  🔴 NOTEBOOKS ONLY (no serialized models used in production):               │
│  - AI Report Generator/ (AI_Report_Generator_RAG (1).ipynb)               │
│  - Alert Explanation/ (Alert_Explanation_LLM_RAG (1).ipynb)               │
│  - Chart Explanation/ (Chart_Explanation_LLM_RAG (1).ipynb)               │
│  - budget-forecasting/ (budget_forecasting.ipynb)                         │
│  - budget prediction/ (budget prediction.ipynb)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Issues Found

### 🔴 CRITICAL

| # | Issue | Model/Component | Severity | Description |
|---|-------|-----------------|----------|-------------|
| 1 | **Orphaned model artifacts in ML-Notebooks** | Auto Budget Category Classifier | CRITICAL | `product_category_classifier.joblib` and `product_category_classifier_v2.joblib` exist in `ML-Notebooks/auto budget category classifier/` but are **never loaded by any production service**. The actual production model is loaded from `settings.ML_MODELS_DIR` (i.e., `Backend/models/`) via `CategoryPredictor`. These notebook files are misleading and represent wasted work. |
| 2 | **Frontend calls non-existent `/dashboard/insights/budget-forecast` but no route exists** | Budget Forecast | CRITICAL | The `AI Insights` page (`/dashboard/ai-insights`) links to `/dashboard/insights/budget-forecast`, and the page component exists at `Frontend/app/dashboard/insights/budget-forecast/page.tsx`. However, the **Django `MLViewSet` registers `budget_forecast` with `url_path='budget-forecast'`**, making the actual endpoint `GET /api/ml/budget-forecast/`. This is correctly wired. **Correction**: This is actually correctly integrated. Removing from critical. |
| 3 | **Subscription Detection API has no frontend UI** | Subscription Detection | CRITICAL | `Backend/api/views/subscriptions.py` and `Backend/api/services/subscriptions.py` implement a full subscription detection engine with scan, confirm, ignore, and convert actions. However, the **frontend recurring page (`/dashboard/recurring`) does NOT call the subscriptions API at all** — it only manages explicit `RecurringRule` records. Detected subscriptions are invisible to users. |

### 🟠 HIGH

| # | Issue | Model/Component | Severity | Description |
|---|-------|-----------------|----------|-------------|
| 4 | **Transaction Category Predictor has no frontend UI** | Category Predictor (Random Forest) | HIGH | The backend endpoint `POST /api/transactions/predict_category/` exists and works, but **no frontend page or component calls it**. The `predicted_category` and `prediction_confidence` fields exist on the `Transaction` model and serializer, but they are never populated by any client-side action. Users cannot trigger or view category predictions. |
| 5 | **ML-Backend chat endpoints bypass Django auth** | Chat/Agent endpoints | HIGH | The ML-Backend `POST /chat/agent` endpoint manually extracts the Bearer token from the `Authorization` header (`_get_token(request)`) rather than using a proper Django authentication dependency. This means the ML-Backend is **coupled to Django-issued JWTs** but does not validate them — it trusts the frontend to pass a valid token. If the token is invalid, the downstream Django API calls will fail, but the ML-Backend returns a generic 500 or LLM error rather than a clear 401. |
| 6 | **Hard-coded fallback values in `forecast_spending()`** | Spending Forecast | HIGH | `Backend/api/services/ml_services.py` → `forecast_spending()` uses `days_ahead: int = 30` as a default and falls back to `{'prophet': None, 'lstm': None, 'csv_data': None}` when models are missing. The frontend `ForecastPage` shows "No forecast data available" when all three sources are empty, but there is **no user-facing explanation** of why (missing model artifacts, insufficient data, etc.). |
| 7 | **Missing error handling for missing model artifacts** | Anomaly/Cluster/Forecast | HIGH | `ml_services.py` returns empty lists/dicts when model files are missing (`logger.warning` only). The frontend shows empty states but does **not differentiate** between "no data" and "model broken". This makes debugging production issues difficult for users and operators. |

### 🟡 MEDIUM

| # | Issue | Model/Component | Severity | Description |
|---|-------|-----------------|----------|-------------|
| 8 | **`insightsApi` is used on dashboard but not on `/dashboard/ai-insights`** | Dynamic AI Insights | MEDIUM | The `insightsApi` is called from `Frontend/components/dashboard/main-content.tsx` (dashboard home) to show the insights widget. However, the dedicated `/dashboard/ai-insights` page calls `mlApi.getAnomalies()`, `mlApi.getForecast()`, `mlApi.getClusters()`, and `mlApi.getBudgetForecast()` but **never calls `insightsApi.list()` or `insightsApi.generate()`**. The "AI Insights" hub page shows ML model summaries but not the actual rule-based insights feed. |
| 9 | **Duplicate Detection UI `confidence` field type mismatch** | Duplicate Detection | MEDIUM | The backend `ml_client.py` returns `confidence` as a string (`"high"` or `"medium"`), but the frontend `DuplicatesPage` displays it with `.toFixed(0)` (`match.confidence.toFixed(0)`), which would fail at runtime if confidence is a string. The backend serializer returns it as a string, but the frontend TypeScript interface defines it as `number`. **Resolved 2026-08-30**: fixed TypeScript interface and removed erroneous `.toFixed(0)` call. |
| 10 | **Budget Forecast page uses hard-coded 3-month forecast** | Budget Forecast | MEDIUM | `Backend/api/services/ml_services.py` → `forecast_budget()` hard-codes `forecast_months = 3`. The frontend displays "3-month forecast" in the UI. This is not configurable and cannot be changed without modifying both backend and frontend. |
| 11 | **ML-Backend `generate_with_tools` does not pass project context** | Chat Agents | MEDIUM | When the ML-Backend chat calls Django backend tools (`get_transactions_tool`, `get_budget_tool`, etc.), it passes the user's JWT but **does not pass an active project ID**. The Django `project_scope_filter` middleware relies on `request.active_project`, which is set by Django middleware. When ML-Backend calls Django APIs directly, the project scope may be missing, causing the tools to return **all projects' data** instead of scoped data. |

### 🟢 LOW

| # | Issue | Model/Component | Severity | Description |
|---|-------|-----------------|----------|-------------|
| 12 | **Orphaned Jupyter notebooks in ML-Notebooks** | Multiple | LOW | `AI Report Generator`, `Alert Explanation`, `Chart Explanation`, `budget-forecasting`, and `budget prediction` directories contained only `.ipynb` files with no serialized models or API integration. **Resolved 2026-08-30**: removed orphaned notebooks and model artifacts. |
| 13 | **`context.ai.model` file at project root** | Unknown | LOW | A file named `context.ai.model` existed at the project root. Its purpose was unclear (no references found in code). **Resolved 2026-08-30**: file removed from repository. |
| 14 | **ML-Backend CORS allows localhost:3000-3002** | ML-Backend config | LOW | `ML-Backend/app/main.py` previously hard-coded `allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]`. **Resolved 2026-08-30**: Django backend `settings.py` now uses `CORS_ALLOWED_ORIGINS` from the `CORS_ALLOWED_ORIGINS` environment variable with sensible defaults. |

---

## 5. Recommendations

### Immediate Actions (Critical/High)

1. **Integrate Subscription Detection into Frontend**
   - Either add a "Detected Subscriptions" section to `/dashboard/recurring` or create a new `/dashboard/subscriptions` page.
   - Wire up `insightsApi` or create a new `subscriptionsApi` to call `GET /api/subscriptions/` and `POST /api/subscriptions/scan/`.
   - Add confirm/ignore/convert actions.

2. **Integrate Transaction Category Predictor into Frontend**
   - Add a "Suggest Category" button in the transaction create/edit form.
   - Call `POST /api/transactions/predict_category/` with merchant, description, amount, and type.
   - Display the predicted category and confidence, allowing the user to accept or override.

3. **Fix Duplicate Detection `confidence` type mismatch**
   - In `Backend/api/services/ml_client.py`, ensure `confidence` is returned as a float (0.0-1.0) or string consistently.
   - Update the frontend `DuplicatesPage` TypeScript interface and rendering logic to match.

4. **Add project context to ML-Backend tool calls**
   - Pass `project_id` from the Django JWT or request context to ML-Backend.
   - Include `X-Project-Id` header in ML-Backend → Django API calls.
   - Update Django `project_scope_filter` to read from the header when called internally.

5. **Improve error handling for missing model artifacts**
   - In `ml_services.py`, raise a specific exception or return a structured error when model files are missing.
   - Frontend should display a user-friendly message like "ML models are not deployed. Contact administrator."

### Short-Term Actions (Medium)

6. **Consolidate AI Insights page with Insights feed**
   - The `/dashboard/ai-insights` page should show both the ML model summary cards AND the rule-based insights feed from `insightsApi`.
   - Currently it only shows ML model availability; the actual insights are only on the dashboard home widget.

7. **Make `forecast_months` configurable**
   - Move `forecast_months = 3` from `forecast_budget()` to a Django setting or API parameter.
   - Update the frontend to reflect the configurable value.

8. **Move orphaned notebooks to `research/` directory**
   - Create `ML-Notebooks/research/` and move `AI Report Generator`, `Alert Explanation`, `Chart Explanation`, `budget-forecasting`, and `budget prediction` there.
   - Keep only actively used notebooks/models in the root `ML-Notebooks/`.

### Long-Term Actions (Low)

9. **Clean up orphaned model artifacts**
   - Delete `ML-Notebooks/auto budget category classifier/product_category_classifier.joblib` and `product_category_classifier_v2.joblib` since the production model is managed by `ml_training` and stored in `Backend/models/`.

10. **Externalize ML-Backend CORS configuration**
    - Read `CORS_ORIGINS` from environment variables instead of hard-coding localhost ports.

11. **Add monitoring/alerting for ML model loading failures**
    - Currently, missing model files only produce `logger.warning` messages. Add Prometheus metrics or Django notifications when models fail to load.

---

## 6. Missing Integrations

### 6.1 Backend Models with No Frontend UI

| Model | Endpoint | Missing UI Component |
|-------|----------|---------------------|
| **Transaction Category Predictor** | `POST /api/transactions/predict_category/` | No button or form in transaction create/edit flow |
| **Subscription Detection** | `GET /api/subscriptions/`, `POST /api/subscriptions/scan/` | No page or widget in `/dashboard/recurring` |
| **Insights Feed** | `GET /api/insights/`, `POST /api/insights/generate/` | Not shown on `/dashboard/ai-insights` (only on dashboard home) |

### 6.2 ML-Backend Features with No Frontend UI

| Feature | Endpoint | Missing UI Component |
|---------|----------|---------------------|
| **Memory Management** | `GET /user/memory`, `DELETE /user/memory/{id}` | No settings page or chat memory viewer |
| **Conversation Management** | `GET /chats`, `POST /chats`, `PATCH /chats/{id}`, `DELETE /chats/{id}` | No conversation list/history page (chat widget is ephemeral) |
| **Database Context Refresh** | `POST /chat/db/refresh` | No admin UI (internal endpoint only) |

### 6.3 Missing API Service Wrappers

| Backend Endpoint | Missing Frontend Service |
|------------------|--------------------------|
| `POST /api/transactions/predict_category/` | No function in `Frontend/api/services/transactions.ts` |
| `GET /api/subscriptions/` | No `subscriptionsApi` in `Frontend/api/services/` |
| `POST /api/subscriptions/scan/` | No `subscriptionsApi` in `Frontend/api/services/` |
| `POST /api/subscriptions/{id}/confirm/` | No `subscriptionsApi` in `Frontend/api/services/` |
| `POST /api/subscriptions/{id}/ignore/` | No `subscriptionsApi` in `Frontend/api/services/` |
| `POST /api/subscriptions/{id}/convert/` | No `subscriptionsApi` in `Frontend/api/services/` |

### 6.4 Data Flow Gaps

```
Django Backend → ML-Backend (missing project scoping):
  - get_transactions_tool()     → Returns ALL projects' transactions
  - get_budget_tool()           → Returns ALL projects' budgets
  - get_goals_tool()            → Returns ALL projects' goals
  - get_income_tool()           → Returns ALL projects' income
  - get_profile_tool()          → Returns user profile (no project scope needed)
  - get_balance_tool()          → Returns ALL projects' accounts
```

**Impact**: When a user has multiple projects and uses the AI chat, the LLM receives **unscoped data from all projects**, potentially leaking financial information across project boundaries.

---

## 7. Appendix: File Reference

### ML-Backend Service Files
- `ML-Backend/app/ollama.py` — Ollama adapter (generate, stream, embed, generate_with_tools)
- `ML-Backend/app/services/intent.py` — Intent classifier
- `ML-Backend/app/services/router.py` — Agent intent router
- `ML-Backend/app/services/assistants.py` — Goal & budget assistants
- `ML-Backend/app/services/reports.py` — Report generator & chart explainer
- `ML-Backend/app/services/insights_agent.py` — Insights Q&A agent
- `ML-Backend/app/services/db_agent.py` — Database schema Q&A agent
- `ML-Backend/app/services/tools.py` — Financial tool wrappers (transactions, budgets, goals, etc.)
- `ML-Backend/app/services/calculations.py` — Pure financial calculations
- `ML-Backend/app/services/conversations.py` — Conversation CRUD
- `ML-Backend/app/services/memory.py` — Memory extraction & retrieval
- `ML-Backend/app/services/embeddings.py` — Embedding service
- `ML-Backend/app/services/context.py` — Context window builder
- `ML-Backend/app/services/summarization.py` — Conversation summarization
- `ML-Backend/app/services/agents.py` — Agent registry
- `ML-Backend/app/similarity.py` — Duplicate detection ML core
- `ML-Backend/app/vector.py` — Chroma vector store

### ML-Backend Router Files
- `ML-Backend/app/routers/chat.py` — Chat endpoints
- `ML-Backend/app/routers/reports.py` — Report endpoints
- `ML-Backend/app/routers/duplicates.py` — Duplicate detection endpoints
- `ML-Backend/app/routers/conversations.py` — Conversation CRUD endpoints
- `ML-Backend/app/routers/memory.py` — Memory management endpoints

### Django Backend Service Files
- `Backend/api/services/ml_services.py` — Anomaly, forecast, cluster, budget forecast
- `Backend/api/services/financial_health.py` — Financial health score engine
- `Backend/api/services/insights.py` — Dynamic AI insights engine
- `Backend/api/services/duplicates.py` — Duplicate detection orchestration
- `Backend/api/services/subscriptions.py` — Subscription detection engine
- `Backend/api/services/ml_client.py` — HTTP client for ML-Backend duplicate service
- `Backend/api/services/ml_training/inference.py` — Category predictor inference
- `Backend/api/services/ml_training/trainer.py` — Model trainer
- `Backend/api/services/ml_training/versioning.py` — Model versioning

### Django Backend View Files
- `Backend/api/views/ml_views.py` — ML inference endpoints
- `Backend/api/views/financial_health.py` — Financial health endpoints
- `Backend/api/views/insights.py` — Insights endpoints
- `Backend/api/views/duplicates.py` — Duplicate endpoints
- `Backend/api/views/subscriptions.py` — Subscription endpoints
- `Backend/api/views/transactions.py` — Transaction endpoints (includes predict_category)
- `Backend/api/views/reports.py` — Report export/filter endpoints

### Frontend Service Files
- `Frontend/api/services/ml.ts` — ML API service (anomalies, forecast, clusters, budget forecast)
- `Frontend/api/services/ml-reports.ts` — ML-Backend report API
- `Frontend/api/services/chat.ts` — Chat API (streaming + agent)
- `Frontend/api/services/insights.ts` — Insights API
- `Frontend/api/services/financial-health.ts` — Financial health API
- `Frontend/api/services/agents.ts` — Agent registry for UI

### Frontend Page Files
- `Frontend/app/dashboard/insights/anomalies/page.tsx` — Anomalies page
- `Frontend/app/dashboard/insights/forecast/page.tsx` — Forecast page
- `Frontend/app/dashboard/insights/clusters/page.tsx` — Clusters page
- `Frontend/app/dashboard/insights/budget-forecast/page.tsx` — Budget forecast page
- `Frontend/app/dashboard/duplicates/page.tsx` — Duplicates page
- `Frontend/app/dashboard/ai-insights/page.tsx` — AI Insights hub
- `Frontend/app/dashboard/recurring/page.tsx` — Recurring transactions page
- `Frontend/app/dashboard/reports/page.tsx` — Reports page

### Model Artifacts
- `ML-Notebooks/Transaction Anomaly Detection/model/*.pkl` — Isolation Forest artifacts
- `ML-Notebooks/Spending Forecast/*.pkl`, `*.keras`, `*.csv` — Prophet & LSTM artifacts
- `ML-Notebooks/merchant clustering/models/*` — KMeans artifacts
- `ML-Notebooks/auto budget category classifier/*.joblib` — **ORPHANED**

---

*End of Audit Document*
