# Agent Reference

## Registered Agents

| Agent key | Slash command | Intent | Handler | Description |
|-----------|---------------|--------|---------|-------------|
| `report` | `/report` | `report` | `route_intent` | Generate a comprehensive financial report with income, expenses, savings rate, and goal progress. |
| `chart_alert` | `/explain` | `chart_alert` | `route_intent` | Explain charts, alerts, or financial visualizations in plain language. |
| `alert` | `/alert` | `chart_alert` | `route_intent` | Explain financial alerts in plain language. |
| `goal` | `/goal` | `goal` | `route_intent` | Get help with financial goal planning, tracking progress, and projections. |
| `budget` | `/budget` | `budget` | `route_intent` | Get budget analysis, variance reports, and actionable budget recommendations. |
| `transaction_search` | `/search` | `transaction_search` | `route_intent` | Search transactions using natural language queries. |
| `insights` | `/insights` | `insights` | `answer_insights_question` | Get AI-generated financial insights and analysis based on your spending patterns. |
| `general_chat` | `/chat` | `general_chat` | `fallback` | General financial assistant chat without specialized tools. |
| `db_context` | `/db` | `db_context` | `answer_database_question` | Inspect the database schema, tables, columns, and relationships. |

## Friendly Aliases

The `/chat/agent` endpoint accepts these short aliases and maps them to the real agent keys:

- `search` → `transaction_search`
- `insights` → `insights`
- `report` → `report`
- `alert` → `alert`
- `chart_alert` → `chart_alert`
- `goal` → `goal`
- `budget` → `budget`
- `chat` → `general_chat`
- `db` → `db_context`

## How Agents Are Selected

When calling `POST /chat/agent`:

1. Send `"agent": "<agent_key_or_alias>"` in the JSON body.
2. Send `"message": "<user message>"`.
3. The backend resolves the agent via `get_agent()`.
4. If the message starts with the agent's slash command, the slash command prefix is stripped before routing.
5. The `intent` field from the registry is used for routing.
6. If no `agent` field is provided, intent is auto-classified from the message.

## Example API Call

```bash
curl -X POST http://localhost:8100/chat/agent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "search",
    "message": "Show me all transactions over $100 last month"
  }'
```

## Testing Checklist

Use this checklist to verify each agent works end-to-end.

### 1. `transaction_search` (`/search`, alias: `search`)
- [ ] Agent resolves without `Unknown agent` error.
- [ ] Natural language query returns transaction results.
- [ ] Slash command `/search` prefix is stripped correctly.

### 2. `report` (`/report`)
- [ ] Returns a financial report structure.
- [ ] Handles missing data gracefully.

### 3. `chart_alert` (`/explain`)
- [ ] Accepts questions about charts/alerts.
- [ ] Returns plain-language explanation.

### 4. `alert` (`/alert`)
- [ ] Accepts questions about alerts.
- [ ] Returns alert explanation.

### 5. `goal` (`/goal`)
- [ ] Accepts goal-related questions.
- [ ] Returns planning/projection info.

### 6. `budget` (`/budget`)
- [ ] Accepts budget questions.
- [ ] Returns analysis and recommendations.

### 7. `insights` (`/insights`)
- [ ] Returns AI-generated insights.
- [ ] Uses `answer_insights_question` handler directly.

### 8. `general_chat` (`/chat`, alias: `chat`)
- [ ] Falls back for general queries.
- [ ] Returns a conversational response.

### 9. `db_context` (`/db`, alias: `db`)
- [ ] Accepts database schema questions.
- [ ] Returns schema/table/column info.

## Subagent Testing

Subagents are additional specialized handlers that can be invoked through the main agents or directly via the routing layer. To test subagents:

1. Check `app/services/router.py` for how intents are dispatched to handlers.
2. Check `app/services/assistants.py` for `answer_budget_question` and `answer_goal_question`.
3. Check `app/services/insights_agent.py` for `answer_insights_question`.
4. Check `app/services/reports.py` for `build_report`.
5. Check `app/services/tools.py` for `search_transactions_nl`.
6. Check `app/services/db_agent.py` for `answer_database_question`.

Each subagent can be tested by sending a request with the corresponding `agent` field and verifying the response matches the expected structure for that domain.
