from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from src.models.message import MessageType, MessageChannel


class MessageCreate(BaseModel):
    """Crear nuevo mensaje en ticket"""
    content: str = Field(..., min_length=1, max_length=10000)
    type: MessageType = Field(default=MessageType.PUBLIC_REPLY)
    channel: MessageChannel = Field(default=MessageChannel.WEB)
    is_internal: bool = Field(default=False)
    custom_data: Optional[Dict[str, Any]] = None


class MessageResponse(BaseModel):
    """Respuesta de mensaje"""
    id: UUID
    ticket_id: UUID
    type: MessageType
    content: Optional[str]
    channel: MessageChannel
    author_id: UUID
    is_internal: bool
    is_system_generated: bool
    delivery_status: str
    delivery_attempts: int
    created_at: datetime
    updated_at: datetime


class MessageListResponse(BaseModel):
    """Lista de mensajes del ticket"""
    id: UUID
    type: MessageType
    content: Optional[str]
    author_id: UUID
    is_internal: bool
    is_system_generated: bool
    created_at: datetime
