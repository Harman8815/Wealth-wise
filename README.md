# WealthWise

> Personal finance management platform — track accounts, transactions, budgets,
> and goals; surface intelligent insights, detect subscriptions, and monitor your
> financial health.

WealthWise is a full-stack personal finance application:

- **Frontend** — Next.js 15 (React 19, TypeScript, Tailwind CSS, shadcn/ui)
- **Backend** — Django 5 + Django REST Framework (JWT auth, SQLite/PostgreSQL)
- **ML-Backend** — stateless FastAPI service for ML-powered duplicate detection

---

## Monorepo Layout

| Module | What it is | Docs |
|--------|------------|------|
| [`Backend/`](./Backend) | Django REST API (auth, transactions, budgets, goals, recurring, financial-health, insights, subscriptions, duplicate detection) | [`Backend/README.md`](./Backend/README.md) · [`Backend/docs/`](./Backend/docs) |
| [`Frontend/`](./Frontend) | Next.js dashboard web app | [`Frontend/docs/README.md`](./Frontend/docs/README.md) |
| [`ML-Backend/`](./ML-Backend) | FastAPI service for ML duplicate scoring | [`ML-Backend/README.md`](./ML-Backend/README.md) |

## Feature Highlights

- 🔐 JWT authentication with refresh tokens
- 👥 Multi-project workspaces with role-based access (owner/admin/editor/viewer)
- 💳 Accounts, transactions, categories, and budgets
- 🔁 Recurring transactions & recurring budgets (auto-generated)
- 🎯 Savings goals with progress tracking
- 🧮 Explainable Financial Health Score (weighted dimensions)
- 💡 Dynamic AI insights feed (dismissible)
- 🔍 ML-powered duplicate transaction detection (import + standing scan)
- 🔎 Subscription detection — pattern-mining that discovers subscriptions from history and lets you confirm/ignore/convert them
- 📊 Reports (PDF/CSV) and scheduled reports

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama (for AI features)

### Option 1: VS Code Tasks (Recommended)

If you open this project in VS Code, you can launch the entire stack with one command:

- Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on macOS)
- Select **Start All Servers**

This opens three dedicated terminal panels:
- **Backend (Django)** — http://localhost:8000
- **ML-Backend (FastAPI)** — http://localhost:8100
- **Frontend (Next.js)** — http://localhost:3000

Each server runs in its own terminal and can be stopped/restarted independently with `Ctrl+C`.

### Option 2: Manual Start

### Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # http://127.0.0.1:8000
```

### Frontend

```bash
cd Frontend
npm install
npm run dev                     # http://localhost:3000
```

### ML-Backend (optional, for duplicate detection)

```bash
cd ML-Backend
pip install -r requirements.txt
uvicorn app.main:app --port 8100
```

See each module's README for detailed setup, architecture, API reference, and
development guidelines.

## Documentation Index

- **System overview:** [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)
- **AI/ML roadmap:** [`Feature.md`](./Feature.md)
- **Financial Health Score engine:** [`FinancialHealthScore_ENGINE.md`](./FinancialHealthScore_ENGINE.md)
- **Backend API docs:** [`Backend/docs/`](./Backend/docs)
- **Frontend docs:** [`Frontend/docs/`](./Frontend/docs)

## License

MIT
