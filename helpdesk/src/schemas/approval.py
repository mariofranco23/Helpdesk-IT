from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class CostApprovalCreate(BaseModel):
    """Solicitar aprobación de costo"""
    amount: int = Field(..., gt=0)
    concept: str = Field(..., min_length=5, max_length=255)
    currency: str = Field(default="ARS", min_length=3, max_length=3)
    description: Optional[str] = None


class CostApprovalApprove(BaseModel):
    """Aprobar un costo"""
    approved_by: UUID = Field(...)


class CostApprovalReject(BaseModel):
    """Rechazar un costo"""
    rejected_by: UUID = Field(...)
    rejection_reason: str = Field(..., min_length=5, max_length=1000)


class CostApprovalResponse(BaseModel):
    """Respuesta de aprobación de costo"""
    id: UUID
    ticket_id: UUID
    amount: int
    currency: str
    concept: str
    status: str
    requested_by: UUID
    requested_at: datetime
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime


class TimeEntryCreate(BaseModel):
    """Registrar tiempo trabajado"""
    duration_minutes: int = Field(..., gt=0, le=480)
    work_type: Optional[str] = None
    description: Optional[str] = None


class TimeEntryResponse(BaseModel):
    """Respuesta de registro de tiempo"""
    id: UUID
    ticket_id: UUID
    agent_id: UUID
    duration_minutes: int
    work_type: Optional[str]
    description: Optional[str]
    work_date: datetime
    billing_status: str
    created_at: datetime
    updated_at: datetime
