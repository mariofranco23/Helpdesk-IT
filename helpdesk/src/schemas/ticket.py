from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from src.models.ticket import TicketStatus, TicketType, Priority


class TicketCreate(BaseModel):
    """Crear nuevo ticket (desde portal web - 3 pasos)"""
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., min_length=3)
    subcategory: Optional[str] = None
    sector: Optional[str] = None
    branch: Optional[str] = None
    equipment: Optional[str] = None
    type: TicketType = Field(default=TicketType.REQUEST)

    # Contacto del solicitante
    phone: Optional[str] = None
    email: Optional[str] = None


class TicketUpdate(BaseModel):
    """Actualizar ticket (consola de casos)"""
    title: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[Priority] = None
    assigned_to: Optional[UUID] = None
    category: Optional[str] = None


class TicketResponse(BaseModel):
    """Respuesta de ticket (listar, detalle)"""
    id: UUID
    public_id: str
    title: str
    description: Optional[str]
    type: TicketType
    status: TicketStatus
    priority: Priority
    requester_id: UUID
    assigned_to: Optional[UUID]
    category: Optional[str]
    created_at: datetime
    updated_at: datetime
    first_response_at: Optional[datetime]
    resolved_at: Optional[datetime]
    has_cost: int
    estimated_cost: Optional[int]


class TicketListResponse(BaseModel):
    """Respuesta para listar tickets (tabla consola)"""
    id: UUID
    public_id: str
    title: str
    status: TicketStatus
    priority: Priority
    category: Optional[str]
    assigned_to: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    reopens_count: int


class TicketDetailResponse(BaseModel):
    """Respuesta detallada de ticket"""
    id: UUID
    public_id: str
    title: str
    description: Optional[str]
    type: TicketType
    status: TicketStatus
    priority: Priority
    impact: Optional[str]
    urgency: Optional[str]
    requester_id: UUID
    assigned_to: Optional[UUID]
    participants: List[UUID]
    category: Optional[str]
    subcategory: Optional[str]
    sector: Optional[str]
    branch: Optional[str]
    equipment: Optional[str]
    has_cost: int
    estimated_cost: Optional[int]
    approved_cost: Optional[int]
    approval_status: Optional[str]
    reopens_count: int
    tags: List[str]
    created_at: datetime
    first_response_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    updated_at: datetime
