from sqlalchemy import Column, String, DateTime, Integer, JSON, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import Base


class TicketStatus(str, enum.Enum):
    NEW = "new"
    OPEN = "open"
    IN_PROCESS = "in_process"
    WAITING_CLIENT = "waiting_client"
    WAITING_APPROVAL = "waiting_approval"
    WAITING_THIRD_PARTY = "waiting_third_party"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TicketType(str, enum.Enum):
    INCIDENT = "incident"
    REQUEST = "request"
    DEMAND = "demand"


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    # Información básica
    public_id = Column(String(20), unique=True, nullable=False, index=True)  # ID legible para usuario (ej: TICK-001)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(SQLEnum(TicketType), default=TicketType.REQUEST, nullable=False)

    # Solicitante y participantes
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Responsable
    participants = Column(JSON, default=[])  # Lista de user_ids autorizados

    # Categorización
    category = Column(String(100))
    subcategory = Column(String(100))
    sector = Column(String(100))  # Sector del cliente

    # Estado y flujo
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.NEW, nullable=False, index=True)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False)
    impact = Column(String(50))  # Bajo, Medio, Alto, Crítico
    urgency = Column(String(50))  # Bajo, Medio, Alto, Crítico

    # Relacionados a activos
    equipment = Column(String(255))  # Equipo/activo asociado
    branch = Column(String(255))  # Sucursal

    # Información comercial
    has_cost = Column(Integer, default=0)  # 0 = no, 1 = sí, requiere aprobación
    estimated_cost = Column(Integer)  # En centavos
    approved_cost = Column(Integer)  # Costo aprobado
    approval_status = Column(String(20))  # pending, approved, rejected

    # SLA y tiempos
    sla_id = Column(String(50))  # Referencia a política SLA aplicada
    first_response_due = Column(DateTime)
    resolution_due = Column(DateTime)
    reopens_count = Column(Integer, default=0)

    # Tags y metadata
    tags = Column(JSON, default=[])
    custom_data = Column(JSON, default={})

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    first_response_at = Column(DateTime)
    resolved_at = Column(DateTime)
    closed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Ticket(id={self.id}, public_id={self.public_id}, status={self.status})>"
