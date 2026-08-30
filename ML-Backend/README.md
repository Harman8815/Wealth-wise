# WealthWise ML-Backend

FastAPI service for AI chat, Ollama orchestration, duplicate detection, and LLM-powered financial assistants.

It is reached from the Django backend and the Next.js frontend over HTTP. It provides:
- **Duplicate detection** — TF-IDF + cosine similarity for near-duplicate transactions
- **Chat + AI agents** — Intent-classified conversational endpoints (goal planning, budget advice, insights, database schema Q&A)
- **Report generation** — LLM-assisted financial reports with chart/alert explanations
- **Conversation memory** — SQLAlchemy-backed persistence with Ollama embeddings + Chroma vector store

## Prerequisites

- Python 3.10+
- Ollama (for LLM and embedding models)

## Run it

```bash
cd ML-Backend
python -m venv .venv
.venv\Scripts\activate
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

### Duplicate Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/duplicates/scan` | Group transactions into duplicate groups |
| `POST` | `/duplicates/score-batch` | Score one transaction against existing ones |

### Chat & AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | General chat with tool-calling LLM |
| `POST` | `/chat/stream` | SSE streaming chat |
| `POST` | `/chat/agent` | Intent-routed agent endpoint |
| `POST` | `/chat/goal-planning` | Goal planning assistant |
| `POST` | `/chat/budget-planning` | Budget planning assistant |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reports/generate` | Generate LLM-assisted financial report |
| `GET` | `/reports/summary` | Report summary |
| `POST` | `/reports/explain` | Explain a chart or alert |

### Conversations & Memory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List user conversations |
| `POST` | `/conversations` | Create conversation |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `DELETE` | `/conversations/{id}` | Delete conversation |
| `GET` | `/user/memory` | List memory entries |
| `DELETE` | `/user/memory/{id}` | Delete memory entry |

### Debug (internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/debug/events` | Recent debug events |
| `GET` | `/debug/stream` | SSE debug stream |

## Architecture

```
ML-Backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, middleware
│   ├── routers/             # API routers
│   │   ├── chat.py          # Chat + agent endpoints
│   │   ├── conversations.py # Conversation CRUD
│   │   ├── debug.py         # Debug event streaming
│   │   ├── duplicates.py    # TF-IDF duplicate scoring
│   │   ├── memory.py        # Memory CRUD
│   │   └── reports.py       # Report generation + explanation
│   ├── services/            # Business logic
│   │   ├── agents.py        # Agent orchestration
│   │   ├── alerts_agent.py  # Alert explanation
│   │   ├── assistants.py    # Goal/budget assistants
│   │   ├── calculations.py  # Financial math helpers
│   │   ├── context.py       # Context window management
│   │   ├── db_agent.py      # Database schema Q&A
│   │   ├── embeddings.py    # Ollama embedding client
│   │   ├── fallbacks.py     # Graceful degradation
│   │   ├── insights_agent.py # Insights agent
│   │   ├── intent.py        # Intent classification
│   │   ├── memory.py        # Memory/context service
│   │   ├── ollama_config.py # Model configuration
│   │   ├── pipeline.py      # Response processing pipeline
│   │   ├── reports.py       # Report generation
│   │   ├── router.py        # Intent routing
│   │   ├── sanitizer.py     # Input sanitization
│   │   ├── summarization.py # Conversation summarization
│   │   ├── tools.py         # Financial tool definitions
│   │   └── validation.py    # Request validation
│   ├── db.py                # SQLAlchemy setup + init_db()
│   ├── ollama.py            # Ollama HTTP client
│   ├── prompt.py            # System prompts
│   └── schemas/             # Pydantic models
├── tests/                   # pytest suite
└── pyproject.toml           # Project metadata + hatchling build
```

## Configuration

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./data/ml_backend.db` | SQLAlchemy database URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_CHAT_MODEL` | `llama3.2:1b` | Chat model |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |

## Tests

```bash
pytest tests
```
