# Agent Test Reference

Base endpoint: `POST /chat/agent`

Common headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Common body fields:
- `agent`: agent key or alias
- `message`: user message

---

## 1. `transaction_search` (`/search`, alias: `search`)

Handler: `search_transactions_nl(token, user_id, message)`

Request body:
```json
{
  "agent": "search",
  "message": "Show me all Starbucks transactions over $50 in the last 30 days"
}
```

Expected response keys: `intent`, `response`, `data`, `filters`

---

## 2. `report` (`/report`)

Handler: `build_report(token, user_id)`

Request body:
```json
{
  "agent": "report",
  "message": "Generate my monthly financial report"
}
```

Expected response keys: `intent`, `response`, `data`

---

## 3. `chart_alert` (`/explain`)

Handler: `explain_chart_or_alert({"message": message, "context": "chart or alert explanation request"})`

Request body:
```json
{
  "agent": "chart_alert",
  "message": "Explain the spending trend chart for this month"
}
```

Expected response keys: `intent`, `response`

---

## 4. `alert` (`/alert`)

Handler: `answer_alerts_question(token, user_id, message)`

Request body:
```json
{
  "agent": "alert",
  "message": "Why did I get an overspending alert?"
}
```

Expected response keys: `intent`, `response`

---

## 5. `goal` (`/goal`)

Handler: `answer_goal_question(token, user_id, message)`

Request body:
```json
{
  "agent": "goal",
  "message": "How much do I need to save monthly to reach my vacation goal?"
}
```

Expected response keys: `intent`, `response`

---

## 6. `budget` (`/budget`)

Handler: `answer_budget_question(token, user_id, message)`

Request body:
```json
{
  "agent": "budget",
  "message": "Am I overspending on dining this month?"
}
```

Expected response keys: `intent`, `response`

---

## 7. `insights` (`/insights`)

Handler: `answer_insights_question(token, user_id, message)`

Request body:
```json
{
  "agent": "insights",
  "message": "What are my top spending categories this quarter?"
}
```

Expected response keys: `intent`, `response`

---

## 8. `general_chat` (`/chat`, alias: `chat`)

Handler: fallback

Request body:
```json
{
  "agent": "chat",
  "message": "Hello, how are you?"
}
```

Expected response keys: `intent`, `response`, `fallback`

---

## 9. `db_context` (`/db`, alias: `db`)

Handler: `answer_database_question(message)`

Request body:
```json
{
  "agent": "db",
  "message": "What tables are in the database?"
}
```

Expected response keys: `intent`, `response`

---

## Subagents

Subagents are the actual implementation functions called by the router. You can test them indirectly through the agents above, or directly by calling the handler functions from a Python shell or test script.

| Subagent | File | Function |
|----------|------|----------|
| Budget analysis | `app/services/assistants.py` | `answer_budget_question(token, user_id, question)` |
| Goal planning | `app/services/assistants.py` | `answer_goal_question(token, user_id, question)` |
| Insights | `app/services/insights_agent.py` | `answer_insights_question(token, user_id, question)` |
| Report | `app/services/reports.py` | `build_report(token, user_id)` |
| Transaction search | `app/services/tools.py` | `search_transactions_nl(token, user_id, query)` |
| Database schema | `app/services/db_agent.py` | `answer_database_question(question)` |

To test a subagent directly:
```python
from app.services.assistants import answer_budget_question
answer = await answer_budget_question(token="<token>", user_id="<user_id>", question="Am I overspending on groceries?")
print(answer)
```
