# WealthWise AI — cURL Collection for Postman / Terminal

Use these requests against **ML-Backend** unless otherwise noted.

Base URLs used below:
- `ML_BACKEND=http://localhost:8100`
- `OLLAMA=http://localhost:11434`
- `DJANGO=http://localhost:8000/api`

> Replace `BEARER_TOKEN` with a valid Django access token for protected routes.

---

## 1. Health / Connectivity

### 1.1 ML Backend health
```bash
curl -s http://localhost:8100/health | python -m json.tool
```

### 1.2 Ollama health
```bash
curl -s http://localhost:11434/ | python -m json.tool
```

### 1.3 List Ollama models
```bash
curl -s http://localhost:11434/api/tags | python -m json.tool
```

---

## 2. Debug Test Flow

Proves the debug SSE infrastructure without touching Ollama.

### 2.1 Trigger debug test flow
```bash
curl -s -X POST http://localhost:8100/debug/test/flow \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" | python -m json.tool
```

Response:
```json
{
  "request_id": "test-1756401234567",
  "status": "ok"
}
```

Use the returned `request_id` in the SSE stream below.

### 2.2 Open SSE debug stream for a request_id
```bash
curl -N "http://localhost:8100/debug/stream?request_id=test-1756401234567"
```

You should see `event: debug` frames stream in real time.

---

## 3. Chat Stream Endpoint (`POST /chat/stream`)

This is the **main streaming chat endpoint** backed by Ollama.

### 3.1 Basic streaming chat
```bash
curl -N -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "model": "llama3.2"
  }'
```

### 3.2 With conversation_id for context continuity
```bash
curl -N -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my current balance?",
    "conversation_id": "existing-conversation-id",
    "model": "llama3.2"
  }'
```

### 3.3 Financial question
```bash
curl -N -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my recent transactions.",
    "model": "llama3.2"
  }'
```

### 3.4 Empty / edge-case message
```bash
curl -N -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "   ",
    "model": "llama3.2"
  }'
```

### 3.5 Missing message (should 400)
```bash
curl -s -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2"
  }' | python -m json.tool
```

---

## 4. Agent Chat Endpoint (`POST /chat/agent`)

Routes through specific AI agents/intents.

### 4.1 General chat (auto intent)
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to plan my retirement savings."
  }' | python -m json.tool
```

### 4.2 Insights agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate my financial insights.",
    "agent": "insights"
  }' | python -m json.tool
```

### 4.3 Report agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate a financial report.",
    "agent": "report"
  }' | python -m json.tool
```

### 4.4 Alert agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my alerts.",
    "agent": "alerts"
  }' | python -m json.tool
```

### 4.5 Goal agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me plan my financial goals.",
    "agent": "goals"
  }' | python -m json.tool
```

### 4.6 Budget agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze my budget.",
    "agent": "budget"
  }' | python -m json.tool
```

### 4.7 Search/transaction agent
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search my transactions for groceries last month.",
    "agent": "transaction_search"
  }' | python -m json.tool
```

### 4.8 Missing message (should 400)
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python -m json.tool
```

### 4.9 Missing/invalid auth (should 401)
```bash
curl -s -X POST http://localhost:8100/chat/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello"
  }' | python -m json.tool
```

---

## 5. Direct Ollama API (bypass ML backend)

Useful for isolating model behavior from the WealthWise pipeline.

### 5.1 Non-streaming chat
```bash
curl -s -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "stream": false,
    "messages": [
      {"role": "user", "content": "Explain financial diversification in simple terms."}
    ]
  }' | python -m json.tool
```

### 5.2 Streaming chat
```bash
curl -N -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "stream": true,
    "messages": [
      {"role": "user", "content": "Explain financial diversification in simple terms."}
    ]
  }'
```

### 5.3 Chat with tools
```bash
curl -s -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "stream": false,
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_transactions",
          "description": "Get the user transactions.",
          "parameters": {
            "type": "object",
            "properties": {
              "category": {"type": "string"},
              "start_date": {"type": "string"},
              "end_date": {"type": "string"}
            }
          }
        }
      }
    ],
    "messages": [
      {"role": "user", "content": "Show my transactions for August 2026."}
    ]
  }' | python -m json.tool
```

### 5.4 Custom options (temperature / max tokens)
```bash
curl -s -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "stream": false,
    "options": {
      "temperature": 0.1,
      "num_predict": 128,
      "top_p": 0.9,
      "repeat_penalty": 1.1
    },
    "messages": [
      {"role": "user", "content": "Return exactly: OK"}
    ]
  }' | python -m json.tool
```

---

## 6. Error Simulation

### 6.1 Backend down / wrong host
```bash
curl -s http://localhost:9999/health
```

### 6.2 Ollama down / wrong port
```bash
curl -s http://localhost:11435/
```

### 6.3 Invalid JSON body to ML backend
```bash
curl -s -X POST http://localhost:8100/chat/stream \
  -H "Authorization: Bearer BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d 'not-json' | python -m json.tool
```

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

---

## 8. Notes for Postman

- Import these as individual requests.
- For SSE endpoints, Postman may not display streaming chunks well; use the terminal `curl -N` outputs above.
- Set an environment variable `BEARER_TOKEN` in Postman if you reuse requests across logins.
- `/debug/stream` does not require auth because `/debug` is public in `middleware.py`.
- `OLLAMA_BYPASS=true` is the fastest way to validate tool output without Ollama running.
