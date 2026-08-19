"""
Context budget configuration for ML-Backend.

Defines token limits per context component and provides a simple token
counter for rough budget enforcement.  Exact token counts vary by model;
these are conservative estimates for local models like qwen2.5:14b.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ContextBudget:
    system_prompt: int = 512
    summary: int = 512
    recent_messages: int = 4096
    memory: int = 1024
    financial_data: int = 1024
    question: int = 512

    @property
    def total(self) -> int:
        return (
            self.system_prompt
            + self.summary
            + self.recent_messages
            + self.memory
            + self.financial_data
            + self.question
        )


def get_context_budget() -> ContextBudget:
    overrides = {
        k: int(os.getenv(f"CONTEXT_BUDGET_{k.upper()}", getattr(ContextBudget(), k)))
        for k in ContextBudget().__dict__
        if not k.startswith("_")
    }
    return ContextBudget(**overrides)


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, len(text) // 4)
