"""Servicio de gestión de mensajes de tickets"""

from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.models.message import Message, MessageType, MessageChannel
from src.models.ticket import Ticket


class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def create_message(
        self,
        company_id: UUID,
        ticket_id: UUID,
        content: str,
        author_id: UUID,
        message_type: MessageType = MessageType.PUBLIC_REPLY,
        channel: MessageChannel = MessageChannel.WEB,
        is_internal: bool = False,
        is_system_generated: bool = False,
        custom_data: dict = None,
    ) -> Message:
        """Crear un nuevo mensaje en un ticket"""
        ticket = self.db.query(Ticket).filter(
            and_(Ticket.id == ticket_id, Ticket.company_id == company_id)
        ).first()

        if not ticket:
            return None

        message = Message(
            ticket_id=ticket_id,
            company_id=company_id,
            type=message_type,
            content=content,
            channel=channel,
            author_id=author_id,
            is_internal=is_internal,
            is_system_generated=is_system_generated,
            delivery_status="pending",
            delivery_attempts=0,
            custom_data=custom_data or {},
        )

        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)

        return message

    def get_message(self, company_id: UUID, message_id: UUID) -> Message:
        """Obtener un mensaje específico"""
        return self.db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.company_id == company_id
            )
        ).first()

    def list_messages(
        self,
        company_id: UUID,
        ticket_id: UUID,
        include_internal: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Message]:
        """Listar mensajes de un ticket"""
        query = self.db.query(Message).filter(
            and_(
                Message.ticket_id == ticket_id,
                Message.company_id == company_id,
            )
        )

        if not include_internal:
            query = query.filter(Message.is_internal == False)

        return query.order_by(Message.created_at.asc()).limit(limit).offset(offset).all()

    def mark_as_sent(self, company_id: UUID, message_id: UUID) -> Message:
        """Marcar un mensaje como enviado"""
        message = self.get_message(company_id, message_id)
        if message:
            message.delivery_status = "sent"
            message.last_delivery_attempt = datetime.utcnow()
            self.db.commit()
            self.db.refresh(message)

        return message

    def mark_delivery_attempt(self, company_id: UUID, message_id: UUID, failed: bool = False) -> Message:
        """Registrar un intento de entrega"""
        message = self.get_message(company_id, message_id)
        if message:
            message.delivery_attempts += 1
            message.last_delivery_attempt = datetime.utcnow()
            if failed:
                message.delivery_status = "failed"
            self.db.commit()
            self.db.refresh(message)

        return message
