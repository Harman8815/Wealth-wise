"""
Post-processing and normalization for ML-Backend AI responses.

Cleans raw model output before it reaches the frontend:
- Strips banned preamble/postamble phrases
- Truncates to max length at sentence boundaries
- Deduplicates repeated sentences
- Validates minimum length
"""
from __future__ import annotations

import re
from typing import Dict, List


BANNED_PATTERNS: List[tuple[re.Pattern, str]] = [
    (re.compile(r"^(Sure[!\s]?|Of course[!\s]?)", re.IGNORECASE), ""),
    (re.compile(r"^(Here'?s what I found[:\s]?)", re.IGNORECASE), ""),
    (re.compile(r"^(Based on the data[,\s]?)", re.IGNORECASE), ""),
    (re.compile(r"^Let me (tell|show) you", re.IGNORECASE), ""),
    (re.compile(r"^(As an AI|As a financial assistant)[\s\S]*$", re.IGNORECASE), ""),
    (re.compile(r"(I'd be happy to help|Feel free to ask|Please provide)[\s\S]*$", re.IGNORECASE), ""),
    (re.compile(r"^(I don't see any data provided)[\s\S]*$", re.IGNORECASE), ""),
    (re.compile(r"^[\s\n]+", re.IGNORECASE), ""),
    (re.compile(r"[\s\n]+$", re.IGNORECASE), ""),
]


def strip_preamble(text: str) -> str:
    cleaned = text
    for pattern, replacement in BANNED_PATTERNS:
        cleaned = pattern.sub(replacement, cleaned).strip()
    return cleaned.strip()


def truncate(text: str, max_chars: int = 500) -> str:
    if len(text) <= max_chars:
        return text
    for delimiter in [". ", "! ", "? ", "\n"]:
        idx = text.rfind(delimiter, 0, max_chars)
        if idx != -1:
            return text[: idx + 1].strip()
    return text[:max_chars].strip() + "..."


def deduplicate_sentences(text: str) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    seen = set()
    unique = []
    for sentence in sentences:
        normalized = sentence.lower().strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique.append(sentence)
    return " ".join(unique)


def sanity_check(text: str, fallback: str = "I couldn't generate a response. Please try again.") -> str:
    cleaned = strip_preamble(text).strip()
    if len(cleaned) < 10:
        return fallback
    return cleaned


def post_process(
    text: str,
    *,
    max_chars: int = 500,
    fallback: str = "I couldn't generate a response. Please try again.",
) -> str:
    cleaned = strip_preamble(text)
    cleaned = deduplicate_sentences(cleaned)
    cleaned = truncate(cleaned, max_chars=max_chars)
    cleaned = sanity_check(cleaned, fallback=fallback)
    return cleaned
