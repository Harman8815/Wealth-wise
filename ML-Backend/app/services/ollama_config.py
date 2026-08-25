"""
Generation parameter presets for ML-Backend Ollama calls.

Each intent has different requirements:
- insights/alerts: need more tokens for detailed analysis
- general_chat: shorter responses
- reports: longest responses
- db_context: technical but concise
"""
from __future__ import annotations

import os
from typing import Any, Dict

DEFAULT_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.3"))
DEFAULT_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "256"))
DEFAULT_TOP_P = float(os.getenv("OLLAMA_TOP_P", "0.9"))
DEFAULT_REPEAT_PENALTY = float(os.getenv("OLLAMA_REPEAT_PENALTY", "1.1"))

PRESETS: Dict[str, Dict[str, Any]] = {
    "insights": {
        "temperature": 0.2,
        "num_predict": 512,
        "top_p": 0.85,
        "repeat_penalty": 1.15,
    },
    "alerts": {
        "temperature": 0.2,
        "num_predict": 256,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "budget": {
        "temperature": 0.25,
        "num_predict": 512,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "goal": {
        "temperature": 0.25,
        "num_predict": 512,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "report": {
        "temperature": 0.3,
        "num_predict": 1024,
        "top_p": 0.9,
        "repeat_penalty": 1.05,
    },
    "general_chat": {
        "temperature": 0.4,
        "num_predict": 128,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "db_context": {
        "temperature": 0.2,
        "num_predict": 256,
        "top_p": 0.85,
        "repeat_penalty": 1.1,
    },
    "transaction_search": {
        "temperature": 0.2,
        "num_predict": 128,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "transaction_query": {
        "temperature": 0.2,
        "num_predict": 128,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "chart_alert": {
        "temperature": 0.25,
        "num_predict": 256,
        "top_p": 0.9,
        "repeat_penalty": 1.1,
    },
    "intent_classification": {
        "temperature": 0.1,
        "num_predict": 32,
        "top_p": 0.8,
        "repeat_penalty": 1.0,
    },
}


def get_options(intent: str) -> Dict[str, Any]:
    preset = PRESETS.get(intent, {})
    return {
        "temperature": preset.get("temperature", DEFAULT_TEMPERATURE),
        "num_predict": preset.get("num_predict", DEFAULT_NUM_PREDICT),
        "top_p": preset.get("top_p", DEFAULT_TOP_P),
        "repeat_penalty": preset.get("repeat_penalty", DEFAULT_REPEAT_PENALTY),
    }


def get_options_for_call(intent: str) -> Dict[str, Any]:
    return get_options(intent)
