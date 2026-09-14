"""Servicio de gestión de tickets"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from src.models.ticket import Ticket, TicketStatus, TicketType, Priority
from src.models.message import Message, MessageType
from src.schemas.ticket import TicketCreate, TicketUpdate


class TicketService:
    """Servicio de lógica de tickets con aislamiento multi-tenant"""

    def __init__(self, db: Session):
        self.db = db

    def create_ticket(
        self,
        company_id: UUID,
        requester_id: UUID,
        data: TicketCreate
    ) -> Ticket:
        """Crea nuevo ticket

        - Valida que requester pertenece a company
        - Genera public_id único
        - Crea mensaje inicial (descripción)
        """
        # Generar public_id (ej: TICK-001)
        last_ticket = (
            self.db.query(Ticket)
            .filter(Ticket.company_id == company_id)
            .order_by(Ticket.created_at.desc())
            .first()
        )
        ticket_number = 1 if not last_ticket else int(last_ticket.public_id.split("-")[1]) + 1
        public_id = f"TICK-{ticket_number:06d}"

        # Crear ticket
        ticket = Ticket(
            company_id=company_id,
            public_id=public_id,
            title=data.title,
            description=data.description,
            type=data.type,
            requester_id=requester_id,
            category=data.category,
            subcategory=data.subcategory,
            sector=data.sector,
            branch=data.branch,
            equipment=data.equipment,
            status=TicketStatus.NEW,
            priority=Priority.MEDIUM,
        )

        self.db.add(ticket)
        self.db.flush()  # Para obtener ticket.id

        # Crear mensaje inicial (descripción como primer mensaje)
        initial_message = Message(
            ticket_id=ticket.id,
            company_id=company_id,
            type=MessageType.PUBLIC_REPLY,
            content=data.description,
            author_id=requester_id,
            is_internal=False,
        )
        self.db.add(initial_message)
        self.db.commit()

        return ticket

    def get_ticket(self, company_id: UUID, ticket_id: UUID) -> Optional[Ticket]:
        """Obtiene ticket validando que pertenece a la empresa"""
        return (
            self.db.query(Ticket)
            .filter(
                Ticket.id == ticket_id,
                Ticket.company_id == company_id
            )
            .first()
        )

    def list_tickets(
        self,
        company_id: UUID,
        status: Optional[TicketStatus] = None,
        assigned_to: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Ticket]:
        """Lista tickets de la empresa con filtros"""
        query = self.db.query(Ticket).filter(Ticket.company_id == company_id)

        if status:
            query = query.filter(Ticket.status == status)

        if assigned_to:
            query = query.filter(Ticket.assigned_to == assigned_to)

        return query.order_by(Ticket.created_at.desc()).offset(offset).limit(limit).all()

    def update_ticket(
        self,
        company_id: UUID,
        ticket_id: UUID,
        data: TicketUpdate,
        agent_id: UUID
    ) -> Optional[Ticket]:
        """Actualiza ticket y registra cambios como mensajes del sistema"""
        ticket = self.get_ticket(company_id, ticket_id)
        if not ticket:
            return None

        # Registrar cambios
        changes = []

        if data.status and data.status != ticket.status:
            changes.append(f"Estado: {ticket.status.value} → {data.status.value}")
            ticket.status = data.status

        if data.priority and data.priority != ticket.priority:
            changes.append(f"Prioridad: {ticket.priority.value} → {data.priority.value}")
            ticket.priority = data.priority

        if data.assigned_to and data.assigned_to != ticket.assigned_to:
            changes.append(f"Asignado a: {data.assigned_to}")
            ticket.assigned_to = data.assigned_to

        if data.title and data.title != ticket.title:
            ticket.title = data.title

        # Crear mensaje de cambios del sistema
        if changes:
            status_message = Message(
                ticket_id=ticket.id,
                company_id=company_id,
                type=MessageType.STATUS_CHANGE,
                content="\n".join(changes),
                author_id=agent_id,
                is_internal=False,
                is_system_generated=True,
            )
            self.db.add(status_message)

        ticket.updated_at = datetime.utcnow()
        self.db.commit()

        return ticket

    def assign_ticket(
        self,
        company_id: UUID,
        ticket_id: UUID,
        agent_id: UUID,
        assigned_by: UUID
    ) -> Optional[Ticket]:
        """Asigna ticket a un agente"""
        ticket = self.get_ticket(company_id, ticket_id)
        if not ticket:
            return None

        ticket.assigned_to = agent_id
        ticket.status = TicketStatus.OPEN

        # Registrar asignación
        assignment_message = Message(
            ticket_id=ticket.id,
            company_id=company_id,
            type=MessageType.ASSIGNMENT,
            content=f"Asignado a agente {agent_id}",
            author_id=assigned_by,
            is_internal=True,
            is_system_generated=True,
        )
        self.db.add(assignment_message)
        self.db.commit()

        return ticket

    def close_ticket(
        self,
        company_id: UUID,
        ticket_id: UUID,
        resolution_summary: str,
        closed_by: UUID
    ) -> Optional[Ticket]:
        """Cierra ticket con resumen de resolución"""
        ticket = self.get_ticket(company_id, ticket_id)
        if not ticket:
            return None

        ticket.status = TicketStatus.CLOSED
        ticket.closed_at = datetime.utcnow()

        # Registrar cierre
        closing_message = Message(
            ticket_id=ticket.id,
            company_id=company_id,
            type=MessageType.STATUS_CHANGE,
            content=f"Ticket cerrado. Resumen: {resolution_summary}",
            author_id=closed_by,
            is_internal=False,
            is_system_generated=True,
        )
        self.db.add(closing_message)
        self.db.commit()

        return ticket
