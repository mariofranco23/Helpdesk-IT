from sqlalchemy import Column, String, DateTime, Integer, JSON, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CostApproval(Base):
    __tablename__ = "cost_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    # Costo solicitado
    amount = Column(Integer, nullable=False)  # En centavos
    currency = Column(String(3), default="ARS")
    concept = Column(String(255), nullable=False)  # Motivo del costo (repuestos, horas extra, etc)
    description = Column(Text)

    # Solicitud
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Agente IT
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Aprobación
    status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Admin empresa o solicitante
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)

    # Custom data
    custom_data = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CostApproval(ticket_id={self.ticket_id}, amount={self.amount}, status={self.status})>"


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    # Agente que registra
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Tiempo trabajado
    duration_minutes = Column(Integer, nullable=False)  # Duración en minutos
    work_type = Column(String(100))  # Tipo de trabajo (diagnóstico, reparación, consultoría, etc)
    description = Column(Text)

    # Fecha del trabajo
    work_date = Column(DateTime, nullable=False)

    # Billing
    billing_status = Column(String(20), default="pending")  # pending, invoiced, paid

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TimeEntry(ticket_id={self.ticket_id}, duration={self.duration_minutes}min)>"
