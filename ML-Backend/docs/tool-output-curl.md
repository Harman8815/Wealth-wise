# WealthWise AI — Tool Output Testing Guide

Use this to debug the **exact data the AI tools receive and return**.
Everything here targets the **Django backend** first, then shows how to
trigger the same data through the **ML backend `/chat/agent` endpoint**.

> **Note:** The transaction search agent is registered as `transaction_search`.
> Use `agent: "transaction_search"` in requests. The alias `search` is also accepted.

Base URLs:
- `BACKEND=http://localhost:8000/api`
- `ML_BACKEND=http://localhost:8100`

---

## 1. Prerequisites

### 1.1 Get a bearer token

```bash
curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-user@example.com",
    "password": "your-password"
  }' | python -m json.tool
```

Copy the `access` value and use it as `BEARER_TOKEN` below.

### 1.2 Confirm the token works

```bash
curl -s http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

---

## 2. Backend API Endpoints That Tools Call

These are the real endpoints the ML backend tools hit internally.
Test these first to confirm the data layer works.

### 2.1 Transactions

```bash
curl -s -X GET "http://localhost:8000/api/transactions/?page=1&page_size=10" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "amount": "-50.00",
      "description": "Grocery Store",
      "category": "Food",
      "type": "expense",
      "date": "2026-08-25",
      "created_at": "2026-08-25T10:00:00Z"
    }
  ]
}
```

**Filter by category:**
```bash
curl -s -X GET "http://localhost:8000/api/transactions/?category=Food&page_size=10" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Filter by type and date range:**
```bash
curl -s -X GET "http://localhost:8000/api/transactions/?type=income&start_date=2026-08-01&end_date=2026-08-31&page_size=10" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

---

### 2.2 Budget Categories

```bash
curl -s -X GET "http://localhost:8000/api/budget-categories/" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Food",
      "limit": "500.00",
      "spent": "320.50",
      "remaining": "179.50",
      "period": "monthly"
    }
  ]
}
```

---

### 2.3 Goals

```bash
curl -s -X GET "http://localhost:8000/api/goals/" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "name": "Emergency Fund",
      "target_amount": "10000.00",
      "current_amount": "4500.00",
      "status": "active",
      "deadline": "2026-12-31"
    }
  ]
}
```

---

### 2.4 Alerts

```bash
curl -s -X GET "http://localhost:8000/api/alerts/" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "type": "warning",
      "category": "Budget",
      "message": "You have exceeded your Food budget.",
      "read": false,
      "created_at": "2026-08-27T14:00:00Z"
    }
  ]
}
```

**Filter by read status:**
```bash
curl -s -X GET "http://localhost:8000/api/alerts/?read=false" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Filter by category:**
```bash
curl -s -X GET "http://localhost:8000/api/alerts/?category=Budget" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

---

### 2.5 Accounts

```bash
curl -s -X GET "http://localhost:8000/api/accounts/" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "name": "Main Checking",
      "type": "checking",
      "balance": "2500.00",
      "currency": "USD"
    }
  ]
}
```

---

### 2.6 User Profile

```bash
curl -s -X GET "http://localhost:8000/api/users/me/" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

**Expected response shape:**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe"
}
```

---

## 3. ML Backend Tool Tests

These hit the **ML backend** and show exactly what each tool returns
to the AI model.

> **Tip:** Set `OLLAMA_BYPASS=true` in `.env` to skip Ollama and inspect
> the full payload the AI would have sent to the model.

### 3.1 Trigger a specific tool via `/chat/agent`

#### 3.1.1 Transactions tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions for Food category.",
    "agent": "transaction_search"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "transaction_search",
  "response": "Found 3 transactions matching your query.",
  "data": {
    "user_id": "uuid",
    "query": "Show me my transactions for Food category.",
    "filters": {
      "category": "Food"
    },
    "data": {
      "count": 3,
      "results": [
        {
          "id": 1,
          "amount": "-50.00",
          "description": "Grocery Store",
          "category": "Food",
          "type": "expense",
          "date": "2026-08-25"
        }
      ]
    }
  },
  "filters": {
    "category": "Food"
  }
}
```

#### 3.1.2 Balance tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my account balance?",
    "agent": "insights"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "insights",
  "response": "You have $2,500.00 across your accounts.",
  "data": {
    "user_id": "uuid",
    "data": {
      "count": 2,
      "results": [
        {
          "id": 1,
          "name": "Main Checking",
          "balance": "2500.00"
        }
      ]
    }
  }
}
```

#### 3.1.3 Budget tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my budget categories.",
    "agent": "budget"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "budget",
  "response": "You have 3 budget categories. Food: $179.50 remaining this month.",
  "data": {
    "user_id": "uuid",
    "data": {
      "count": 3,
      "results": [
        {
          "id": 1,
          "name": "Food",
          "limit": "500.00",
          "spent": "320.50",
          "remaining": "179.50"
        }
      ]
    }
  }
}
```

#### 3.1.4 Goals tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my financial goals?",
    "agent": "goals"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "goal",
  "response": "You have 2 active goals. Your Emergency Fund is 45% complete.",
  "data": {
    "user_id": "uuid",
    "data": {
      "count": 2,
      "results": [
        {
          "id": 1,
          "name": "Emergency Fund",
          "target_amount": "10000.00",
          "current_amount": "4500.00",
          "status": "active"
        }
      ]
    }
  }
}
```

#### 3.1.5 Alerts tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my unread alerts.",
    "agent": "alerts"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "alerts",
  "response": "You have 3 unread alerts. Budget warning: You have exceeded your Food budget.",
  "data": {
    "user_id": "uuid",
    "data": {
      "count": 5,
      "results": [
        {
          "id": 1,
          "type": "warning",
          "category": "Budget",
          "message": "You have exceeded your Food budget.",
          "read": false
        }
      ]
    }
  }
}
```

#### 3.1.6 Profile tool
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my profile information?",
    "agent": "insights"
  }' | python -m json.tool
```

**Expected response shape:**
```json
{
  "intent": "insights",
  "response": "Your name is John Doe and your email is john@example.com.",
  "data": {
    "user_id": "uuid",
    "data": {
      "id": "uuid",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

---

## 4. Example “Bad” Inputs to Debug Failure Handling

Use these to confirm the backend returns useful errors instead of
the generic `"I couldn't generate a response."` message.

### 4.1 Missing auth
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions."
  }' | python -m json.tool
```

**Expected:** HTTP 401 with `{"detail": "Missing or invalid Authorization header.", "request_id": "..."}`

### 4.2 Invalid token
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer invalid-token-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions."
  }' | python -m json.tool
```

**Expected:** HTTP 401 with `{"detail": "Invalid or expired token.", "request_id": "..."}`

### 4.3 Missing message body
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python -m json.tool
```

**Expected:** HTTP 400 with `{"detail": "Missing message."}`

### 4.4 Unknown agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "agent": "nonexistent-agent"
  }' | python -m json.tool
```

**Expected:** HTTP 400 with `{"detail": "Unknown agent: nonexistent-agent"}`

---

## 5. How to Use This for Debugging

1. **Start with Section 2** — confirm each backend endpoint returns data.
   If `/api/transactions/` returns empty, the tool will also return empty.

2. **Move to Section 3** — confirm the ML backend tool returns the expected shape.
   Compare the `data` field in the ML response with the raw backend response.

3. **Check the debug timeline** on `/debug` while running Section 3 requests.
   You should see:
   - `USER_REQUEST`
   - `BACKEND_REQUEST`
   - `DATA_RETRIEVAL` / `DATA_PROCESSING`
   - `OLLAMA_REQUEST`
   - `OLLAMA_RESPONSE`
   - `RESPONSE_PARSING`
   - `FRONTEND_RENDER`

4. **If the response is empty** — the `error` field in the debug timeline
   will show whether it failed at:
   - backend API call
   - Ollama call
   - response parsing

---

## 6. Quick Reference: Tool → Backend Endpoint Mapping

| Tool | Backend Endpoint | Key Parameters |
|------|-----------------|----------------|
| `get_transactions_tool` | `GET /api/transactions/` | `category`, `type`, `start_date`, `end_date`, `page_size` |
| `get_balance_tool` | `GET /api/accounts/` | none |
| `get_budget_tool` | `GET /api/budget-categories/` | none |
| `get_income_tool` | `GET /api/transactions/?type=income` | `start_date`, `end_date` |
| `get_goals_tool` | `GET /api/goals/` | none |
| `get_profile_tool` | `GET /api/users/me/` | none |
| `search_transactions_nl` | `GET /api/transactions/` | LLM-extracted filters |
| `get_alerts_tool` | `GET /api/alerts/` | `read`, `category`, `type_` |
| `query_transactions_dynamic` | `GET /api/transactions/` | LLM-extracted filters + amount range |

---

## 7. Ollama Bypass Mode

Set `OLLAMA_BYPASS=true` in the ML-Backend `.env` to skip the actual
Ollama HTTP call and return the full payload instead.

```bash
# .env
OLLAMA_BYPASS=true
```

When enabled, every Ollama call returns:

```json
{
  "model": "llama3.2",
  "created_at": "2026-01-01T00:00:00.000000000Z",
  "message": {
    "role": "assistant",
    "content": "[OLLAMA BYPASS] No model call was made. Inspect the payload below."
  },
  "done": true,
  "ollama_bypass": true,
  "ollama_call_skipped": true,
  "request_id": "...",
  "payload": {
    "model": "llama3.2",
    "messages": [...],
    "stream": false,
    "tools": [...],
    "options": {...}
  }
}
```

Use this to inspect the exact payload sent to Ollama without waiting for
model generation.

### 7.1 Bypass with /chat/stream
```bash
curl -N -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my balance?",
    "model": "llama3.2"
  }'
```

### 7.2 Bypass with /chat/agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions.",
    "agent": "transaction_search"
  }' | python -m json.tool
```

The `payload` field in the response contains the complete Ollama request
body, including:
- assembled system prompt
- conversation history
- tool definitions
- generation options (`temperature`, `num_predict`, `top_p`, `repeat_penalty`)
