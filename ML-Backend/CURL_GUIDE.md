# ML-Backend API — Curl Test Suite

**Base URL:** `http://localhost:8100`  
**Ollama URL:** `http://localhost:11434`  
**Auth:** Bearer JWT from Django backend (`/api/auth/login/`)

---

## 1. Health Check

```bash
curl -s http://localhost:8100/health
```

**Expected output:**
```json
{"status":"ok"}
```

---

## 2. Chat — General Message (with tools)

```bash
curl -s -X POST http://localhost:8100/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What are my top spending categories this month?",
    "conversation_id": null,
    "model": null
  }'
```

**Expected output (200):**
```json
{
  "reply": "Based on your transactions...",
  "model": "llama3.2:1b",
  "conversation_id": "uuid",
  "structured": {
    "type": "text",
    "text": "Based on your transactions..."
  }
}
```

**What it does:**
- Calls `_chat_with_tools()` which may invoke `get_transactions`, `get_budget`, etc.
- LLM decides which tools to call based on the message.
- Returns the final assistant message.

---

## 3. Chat — Explicit Report Agent

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Generate my financial report",
    "agent": "report"
  }'
```

**Expected output (200):**
```json
{
  "intent": "report",
  "response": "Here is your financial report...",
  "data": {
    "summary": {
      "total_income": 50000.0,
      "total_expense": 30000.0,
      "savings_rate": 40.0
    },
    "budget_variance": {...},
    "goal_progress": [...],
    "balance": {...}
  },
  "filters": null,
  "fallback": false
}
```

**What it does:**
- Bypasses intent classifier.
- Directly routes to `build_report()` in `app/services/reports.py`.
- Fetches transactions, income, balance, budgets, goals from Django API.
- Generates narrative via Ollama.

---

## 4. Chat — Explicit Budget Agent

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Am I overspending on dining this month?",
    "agent": "budget"
  }'
```

**Expected output (200):**
```json
{
  "intent": "budget",
  "response": "Based on your budget data...",
  "data": null,
  "filters": null,
  "fallback": false
}
```

**What it does:**
- Bypasses intent classifier.
- Routes to `answer_budget_question()` in `app/services/assistants.py`.
- Fetches transactions and budgets.
- Calculates savings rate and budget variance.
- Generates answer via Ollama.

**Previous bug:** `total_expense = sum(item.get("amount", 0) ...)` would fail if `amount` was a string. Fixed with `float(item.get("amount", 0) or 0)`.

---

## 5. Chat — Explicit Insights Agent

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What financial insights can you give me?",
    "agent": "insights"
  }'
```

**Expected output (200):**
```json
{
  "intent": "insights",
  "response": "Based on your financial data...",
  "data": null,
  "filters": null,
  "fallback": false
}
```

**What it does:**
- Routes to `answer_insights_question()` in `app/services/insights_agent.py`.
- Fetches insights from Django `/api/insights/`.
- Generates LLM answer from insights data.

---

## 6. Chat — Explicit Transaction Search Agent

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Show me all Starbucks transactions over $50",
    "agent": "transaction_search"
  }'
```

**Expected output (200):**
```json
{
  "intent": "transaction_search",
  "response": "Found 15 transactions matching your query.",
  "data": {
    "count": 15,
    "results": [
      {
        "id": "uuid",
        "date": "2026-08-15",
        "description": "Starbucks Coffee",
        "category": "Food & Dining",
        "amount": "2500.00",
        "type": "expense"
      }
    ]
  },
  "filters": {
    "category": "Food & Dining",
    "amount_min": "50",
    "start_date": "2026-07-30",
    "end_date": "2026-08-29"
  },
  "fallback": false
}
```

**What it does:**
- Routes to `search_transactions_nl()` in `app/services/tools.py`.
- Extracts filters from natural language using regex + LLM fallback.
- Calls Django `/api/transactions/` with extracted filters.

---

## 7. Chat — Auto Intent Classification

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "I need a financial report for last month",
    "agent": null
  }'
```

**Expected output (200):**
```json
{
  "intent": "report",
  "response": "Here is your financial report...",
  "data": {...},
  "fallback": false
}
```

**What it does:**
- Calls `classify_intent()` which sends the message to Ollama with the intent classifier prompt.
- Routes to the classified intent.
- **Fix applied:** Intent classifier prompt now distinguishes `report` (structured sections) from `insights` (observations/trends) more clearly.

---

## 8. Chat — Goal Planning

```bash
curl -s -X POST http://localhost:8100/chat/goal-planning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "How can I reach my emergency fund goal faster?"
  }'
```

**Expected output (200):**
```json
{
  "answer": "To reach your emergency fund goal faster..."
}
```

---

## 9. Chat — Budget Planning

```bash
curl -s -X POST http://localhost:8100/chat/budget-planning \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "Am I overspending on dining this month?"
  }'
```

**Expected output (200):**
```json
{
  "answer": "Based on your budget data..."
}
```

---

## 10. Reports — Generate Report

```bash
curl -s -X POST http://localhost:8100/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

**Expected output (200):**
```json
{
  "sections": {
    "summary": {
      "total_income": 50000.0,
      "total_expense": 30000.0,
      "savings_rate": 40.0
    },
    "budget_variance": {...},
    "goal_progress": [...],
    "balance": {...}
  },
  "narrative": "Here is your financial report..."
}
```

**What it does:**
- Calls `build_report()` in `app/services/reports.py`.
- Fetches transactions, income, balance, budgets, goals.
- Generates narrative via Ollama.

---

## 11. Reports — Explain Chart or Alert

```bash
curl -s -X POST http://localhost:8100/reports/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Why did my expenses spike last month?",
    "context": "chart or alert explanation request"
  }'
```

**Expected output (200):**
```json
{
  "explanation": "Your expenses spiked last month due to..."
}
```

---

## 12. Duplicates — Scan for Duplicates

```bash
curl -s -X POST http://localhost:8100/duplicates/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "transactions": [
      {
        "id": "uuid",
        "date": "2026-08-15",
        "description": "Starbucks Coffee",
        "amount": 2500.00,
        "type": "expense"
      }
    ],
    "config": {}
  }'
```

**Expected output (200):**
```json
{
  "groups": [
    {
      "group_id": "uuid",
      "transactions": [...],
      "confidence": "high"
    }
  ]
}
```

---

## 13. Memory — Retrieve User Memory

```bash
curl -s -X GET "http://localhost:8100/user/memory?user_id=USER_UUID&query=budget" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected output (200):**
```json
{
  "memories": [
    {
      "id": "uuid",
      "content": "User mentioned budget concerns...",
      "metadata": {...}
    }
  ]
}
```

---

## 14. Conversations — List Conversations

```bash
curl -s -X GET http://localhost:8100/chats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected output (200):**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Budget Analysis",
      "message_count": 5,
      "created_at": "2026-08-29T07:00:00Z"
    }
  ]
}
```

---

## 15. Error Cases

### 15.1 Missing Authorization Header

```bash
curl -s -X POST http://localhost:8100/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**Expected output (401):**
```json
{"detail":"Missing or invalid Authorization header."}
```

### 15.2 Ollama Unavailable

If Ollama is not running, any chat endpoint returns:

```json
{
  "detail": "The AI service is temporarily unavailable. Please try again.",
  "request_id": "uuid"
}
```

**Status:** 502

### 15.3 Generic Server Error

If an unhandled exception occurs:

```json
{
  "detail": "An internal server error occurred.",
  "request_id": "uuid"
}
```

**Status:** 500

---

## 16. Quick Test Sequence

Run these in order to verify all fixes:

```bash
# 1. Health check
curl -s http://localhost:8100/health

# 2. Report agent (tests Issue 2 fix - intent routing)
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Generate my financial report", "agent": "report"}'

# 3. Budget agent (tests Issue 3 fix - type error)
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Am I overspending on dining this month?", "agent": "budget"}'

# 4. Transaction search (known working reference)
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Show me all Starbucks transactions over $50", "agent": "transaction_search"}'
```

---

## Notes

- Replace `YOUR_JWT_TOKEN` with a valid access token from Django `/api/auth/login/`.
- Replace `USER_UUID` with the actual user UUID where required.
- The ML-Backend does **not** have a `/api/generate` endpoint. All Ollama calls are internal.
- Direct Ollama testing uses `http://localhost:11434/api/chat` (not `/api/generate`).
- The benchmark scripts in `benchmark_*.py` test Ollama directly at `/api/generate` — these are standalone scripts, not part of the FastAPI app.
