"""
Pydantic schemas for validating structured AI agent responses.

These models define the allowed output formats from Ollama and are used
to validate responses before they reach the frontend.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel


class Metric(BaseModel):
    label: str
    value: Any
    format: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ChartSpec(BaseModel):
    type: Literal["line", "bar", "pie", "donut"]
    data: List[Dict[str, Any]]
    x_key: Optional[str] = None
    y_key: Optional[str] = None
    label_key: Optional[str] = None
    value_key: Optional[str] = None
    title: Optional[str] = None


class ToolResult(BaseModel):
    tool: str
    status: str
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: Optional[float] = None


class StructuredResponse(BaseModel):
    type: Literal[
        "text",
        "markdown",
        "metrics",
        "table",
        "transactions",
        "alerts",
        "insights",
        "recommendations",
        "chart",
        "tool_result",
        "error",
    ]
    text: Optional[str] = None
    markdown: Optional[str] = None
    metrics: Optional[List[Metric]] = None
    table: Optional[Dict[str, Any]] = None
    transactions: Optional[Dict[str, Any]] = None
    alerts: Optional[List[Dict[str, Any]]] = None
    insights: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    chart: Optional[ChartSpec] = None
    tool_result: Optional[ToolResult] = None
    error: Optional[Dict[str, Any]] = None
    raw: Optional[Dict[str, Any]] = None
