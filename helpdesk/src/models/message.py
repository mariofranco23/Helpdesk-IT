from sqlalchemy import Column, String, DateTime, Boolean, JSON, Enum as SQLEnum, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import Base


class MessageType(str, enum.Enum):
    PUBLIC_REPLY = "public_reply"      # Respuesta visible al cliente
    INTERNAL_NOTE = "internal_note"    # Nota interna (no visible externamente)
    TIME_ENTRY = "time_entry"          # Registro de horas
    STATUS_CHANGE = "status_change"    # Cambio de estado (automático)
    ASSIGNMENT = "assignment"          # Cambio de asignación (automático)
    APPROVAL = "approval"              # Aprobación/rechazo de costo


class MessageChannel(str, enum.Enum):
    WEB = "web"              # Portal web
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    PHONE = "phone"
    INTERNAL = "internal"    # Sistema (cambios automáticos)


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    # Contenido
    type = Column(SQLEnum(MessageType), default=MessageType.PUBLIC_REPLY, nullable=False)
    content = Column(Text)
    channel = Column(SQLEnum(MessageChannel), default=MessageChannel.WEB, nullable=False)

    # Autor y destinatarios
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipients = Column(JSON, default=[])  # Lista de user_ids

    # Visibilidad
    is_internal = Column(Boolean, default=False)  # Si es True, no enviar a cliente
    is_system_generated = Column(Boolean, default=False)  # Cambios automáticos

    # Custom data del mensaje
    custom_data = Column(JSON, default={})  # Datos adicionales según tipo

    # Entrega y confirmación
    delivery_status = Column(String(20), default="pending")  # pending, sent, failed, bounced
    delivery_attempts = Column(Integer, default=0)
    last_delivery_attempt = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Message(ticket_id={self.ticket_id}, type={self.type}, author={self.author_id})>"
