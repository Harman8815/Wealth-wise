# AI Agent Behavior Specification

## Overview

WealthWise AI is a personal finance assistant that answers user questions using data from the Django backend and an LLM (Ollama). This document describes the agent's behavior, configuration, and how to extend it.

## Architecture

```
User Query
    ↓
Intent Classifier (LLM) → Intent
    ↓
Router (route_intent) → Handler
    ↓
Validation Guard (validation.py)
    ↓
LLM Generation (ollama.py) with per-intent options
    ↓
Post-Processing Pipeline (pipeline.py)
    ↓
Structured Response (schemas/agent_response.py)
    ↓
Frontend
```

## Prompt Location

The system prompt is defined in `ML-Backend/app/prompt.py`:
- `PROMPT_VERSION`: Current version string
- `SYSTEM_PROMPT`: The full system prompt sent to the LLM

**Never accept prompts from the frontend.**

## Intents

| Intent | Handler | Description |
|--------|---------|-------------|
| `insights` | `answer_insights_question` | Financial insights and analysis |
| `alerts` | `answer_alerts_question` | Alerts, warnings, notifications |
| `budget` | `answer_budget_question` | Budget planning and analysis |
| `goal` | `answer_goal_question` | Goal planning and projections |
| `report` | `build_report` | Financial report generation |
| `transaction_search` | `search_transactions_nl` | Natural language transaction search |
| `transaction_query` | `query_transactions_dynamic` | Dynamic transaction queries |
| `db_context` | `answer_database_question` | Database schema questions |
| `chart_alert` | `explain_chart_or_alert` | Chart and alert explanations |
| `general_chat` | Fallback | All other queries |

## Generation Parameters

Each intent has a tuned preset in `app/services/ollama_config.py`:

- `temperature`: Controls randomness (0.1 = deterministic, 0.4 = creative)
- `num_predict`: Max tokens to generate
- `top_p`: Nucleus sampling threshold
- `repeat_penalty`: Penalty for repeating tokens

Defaults are read from environment variables:
- `OLLAMA_TEMPERATURE` (default: 0.3)
- `OLLAMA_NUM_PREDICT` (default: 256)
- `OLLAMA_TOP_P` (default: 0.9)
- `OLLAMA_REPEAT_PENALTY` (default: 1.1)

## Context Validation

Before calling the LLM, data from the backend is validated by `app/services/validation.py`. Each validator returns `(is_valid, error_key)`. If invalid, a pre-written fallback from `app/services/fallbacks.py` is returned instead of calling the LLM.

## Post-Processing Pipeline

All text responses go through `app/services/pipeline.py`:
1. Strip banned preamble/postamble phrases
2. Deduplicate repeated sentences
3. Truncate to max length at sentence boundaries
4. Sanity check minimum length

## Structured Output

The LLM can return structured JSON with the following types:
- `text`, `markdown`, `metrics`, `table`
- `transactions`, `alerts`, `insights`, `recommendations`
- `chart`, `tool_result`, `error`

Schema is defined in `app/schemas/agent_response.py` (Pydantic).

## Adding a New Intent

1. Add the intent to `app/services/intent.py` `Intent` enum
2. Add the intent classifier prompt in `INTENT_CLASSIFIER_PROMPT`
3. Create a handler function in `app/services/` (e.g., `answer_new_intent_question`)
4. Add validation function in `app/services/validation.py`
5. Add fallback messages in `app/services/fallbacks.py`
6. Add generation preset in `app/services/ollama_config.py`
7. Add routing in `app/services/router.py`
8. Add eval case in `tests/ai_eval/prompts.yaml`

## Known Limitations

- Small models (4B) may ignore format instructions or ramble
- No multi-turn conversation memory (context is rebuilt each request)
- Tool calling is limited to predefined financial tools
- JSON mode is enforced for tool calls but not for all responses

## Troubleshooting

- **LLM returns text instead of JSON**: Check prompt format rules, ensure `format: "json"` is set
- **Responses are too long**: Reduce `num_predict` in ollama_config.py
- **Responses are repetitive**: Increase `repeat_penalty` or reduce `temperature`
- **Validation fails unexpectedly**: Check backend API response format in Django serializers
