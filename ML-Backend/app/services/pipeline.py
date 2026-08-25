"""
Post-processing pipeline for ML-Backend AI responses.

Chains sanitization, deduplication, truncation, and sanity checking
into a single callable pipeline.
"""
from __future__ import annotations

from typing import Optional

from app.services.sanitizer import deduplicate_sentences, strip_preamble, truncate


def process_response(
    text: str,
    *,
    max_chars: int = 500,
    min_chars: int = 10,
    fallback: str = "I couldn't generate a response. Please try again.",
) -> str:
    """Run the full post-processing pipeline on a raw model response."""
    cleaned = strip_preamble(text)
    cleaned = deduplicate_sentences(cleaned)
    cleaned = truncate(cleaned, max_chars=max_chars)
    if len(cleaned.strip()) < min_chars:
        return fallback
    return cleaned.strip()
