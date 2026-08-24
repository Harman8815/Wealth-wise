"""
SQLAlchemy model for ML-Backend tool executions.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db import Base


class ToolExecutionStatus(str, enum.Enum):
    success = "success"
    error = "error"


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False)
    status = Column(Enum(ToolExecutionStatus), nullable=False, default=ToolExecutionStatus.success)
    input_data = Column(JSONB, nullable=True)
    output_data = Column(JSONB, nullable=True)
    error = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    executed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="tool_executions")
    message = relationship("Message", back_populates="tool_executions")


Conversation.tool_executions = relationship("ToolExecution", back_populates="conversation", cascade="all, delete-orphan")
Message.tool_executions = relationship("ToolExecution", back_populates="message", cascade="all, delete-orphan")
