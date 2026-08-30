# ML-Backend — Tool Output Debugging Guide

Use this to inspect the exact data the AI tools receive from Django and the
payloads the AI sends to Ollama.

## Prerequisites

```bash
# 1. Get a bearer token
curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"your-user@example.com","password":"your-password"}' | python -m json.tool

# 2. Confirm the token works
curl -s http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

---

## Backend Endpoints That Tools Call

All endpoints require `Authorization: Bearer <token>`.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/users/me/` | Current user profile |
| `GET /api/accounts/` | List accounts |
| `GET /api/accounts/summary/` | `{ total_balance, account_count, by_type }` |
| `GET /api/transactions/` | List transactions (filters: `category`, `type`, `status`, `date`) |
| `GET /api/transactions/summary/` | `{ income, expense, net, transaction_count }` |
| `GET /api/budget-categories/` | List budget categories |
| `GET /api/goals/` | List goals |
| `GET /api/alerts/` | List alerts (filters: `read`, `category`) |

### Example: Transactions
```bash
curl -s -X GET "http://localhost:8000/api/transactions/?page=1&page_size=10" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

### Example: Alerts
```bash
curl -s -X GET "http://localhost:8000/api/alerts/?read=false" \
  -H "Authorization: Bearer BEARER_TOKEN" | python -m json.tool
```

---

## ML Backend Tool Tests

### Trigger a specific tool via `/chat/agent`

```bash
# Transaction search
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions for Food category.",
    "agent": "transaction_search"
  }' | python -m json.tool
```

```bash
# Budget analysis
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my account balance?",
    "agent": "budget"
  }' | python -m json.tool
```

```bash
# Goals
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my financial goals?",
    "agent": "goal"
  }' | python -m json.tool
```

```bash
# Insights
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate my financial insights.",
    "agent": "insights"
  }' | python -m json.tool
```

### Response shape

```json
{
  "intent": "transaction_search",
  "response": "Found 3 transactions matching your query.",
  "data": {
    "user_id": "uuid",
    "query": "Show me my transactions for Food category.",
    "filters": { "category": "Food" },
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
  }
}
```

---

## Ollama Bypass Mode

Set `OLLAMA_BYPASS=true` in `.env` to skip Ollama generation and inspect the
full payload the AI would have sent to the model.

```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my transactions.",
    "agent": "transaction_search"
  }' | python -m json.tool
```

Response includes a `payload` field with the complete Ollama request body:
- assembled system prompt
- conversation history
- tool definitions
- generation options (`temperature`, `num_predict`, `top_p`, `repeat_penalty`)
