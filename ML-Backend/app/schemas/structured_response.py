"""
Structured AI response schema for ML-Backend.

Defines the response format returned by Ollama and validated before
being sent to the frontend.  Keeps data/content decisions on the
backend and leaves presentation to Next.js.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Metric(BaseModel):
    label: str
    value: Any
    format: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TableColumn(BaseModel):
    key: str
    label: str
    format: Optional[str] = None
    align: Optional[str] = None


class StructuredTable(BaseModel):
    columns: List[TableColumn]
    rows: List[Dict[str, Any]]
    caption: Optional[str] = None
    empty_message: Optional[str] = None


class ChartSpec(BaseModel):
    type: str = Field(..., pattern="^(line|bar|pie|donut)$")
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
    type: str = Field(
        ...,
        pattern="^(text|markdown|metrics|table|transactions|alerts|insights|recommendations|chart|tool_result|error)$",
    )
    text: Optional[str] = None
    markdown: Optional[str] = None
    metrics: Optional[List[Metric]] = None
    table: Optional[StructuredTable] = None
    transactions: Optional[StructuredTable] = None
    alerts: Optional[List[Dict[str, Any]]] = None
    insights: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    chart: Optional[ChartSpec] = None
    tool_result: Optional[ToolResult] = None
    error: Optional[Dict[str, Any]] = None
    raw: Optional[Dict[str, Any]] = None
