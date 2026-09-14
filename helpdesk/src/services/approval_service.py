"""Servicio de gestión de aprobaciones de costos"""

from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.models.approval import CostApproval, TimeEntry, ApprovalStatus
from src.models.ticket import Ticket
from src.models.message import Message, MessageType, MessageChannel


class ApprovalService:
    def __init__(self, db: Session):
        self.db = db

    def request_cost_approval(
        self,
        company_id: UUID,
        ticket_id: UUID,
        amount: int,
        concept: str,
        requested_by: UUID,
        currency: str = "ARS",
        description: str = None,
    ) -> CostApproval:
        """Solicitar aprobación de costo"""
        ticket = self.db.query(Ticket).filter(
            and_(Ticket.id == ticket_id, Ticket.company_id == company_id)
        ).first()

        if not ticket:
            return None

        approval = CostApproval(
            ticket_id=ticket_id,
            company_id=company_id,
            amount=amount,
            currency=currency,
            concept=concept,
            description=description,
            requested_by=requested_by,
            status=ApprovalStatus.PENDING,
        )

        self.db.add(approval)

        # Create a system message for the approval request
        message = Message(
            ticket_id=ticket_id,
            company_id=company_id,
            type=MessageType.APPROVAL,
            content=f"Solicitud de aprobación: {concept} - {amount/100:.2f} {currency}",
            channel=MessageChannel.INTERNAL,
            author_id=requested_by,
            is_internal=True,
            is_system_generated=True,
            delivery_status="sent",
            delivery_attempts=1,
            custom_data={"approval_id": str(approval.id)},
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(approval)

        return approval

    def get_cost_approval(self, company_id: UUID, approval_id: UUID) -> CostApproval:
        """Obtener una aprobación de costo"""
        return self.db.query(CostApproval).filter(
            and_(
                CostApproval.id == approval_id,
                CostApproval.company_id == company_id,
            )
        ).first()

    def list_cost_approvals(
        self,
        company_id: UUID,
        ticket_id: UUID = None,
        status: str = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[CostApproval]:
        """Listar aprobaciones de costo"""
        query = self.db.query(CostApproval).filter(
            CostApproval.company_id == company_id
        )

        if ticket_id:
            query = query.filter(CostApproval.ticket_id == ticket_id)

        if status:
            query = query.filter(CostApproval.status == status)

        return query.order_by(CostApproval.created_at.desc()).limit(limit).offset(offset).all()

    def approve_cost(self, company_id: UUID, approval_id: UUID, approved_by: UUID) -> CostApproval:
        """Aprobar un costo solicitado"""
        approval = self.get_cost_approval(company_id, approval_id)

        if not approval:
            return None

        approval.status = ApprovalStatus.APPROVED
        approval.approved_by = approved_by
        approval.approved_at = datetime.utcnow()

        # Update ticket approved cost
        ticket = self.db.query(Ticket).filter(Ticket.id == approval.ticket_id).first()
        if ticket:
            ticket.approved_cost = (ticket.approved_cost or 0) + approval.amount
            ticket.approval_status = "approved"

        # Create approval message
        message = Message(
            ticket_id=approval.ticket_id,
            company_id=company_id,
            type=MessageType.APPROVAL,
            content=f"Costo aprobado: {approval.concept} - {approval.amount/100:.2f} {approval.currency}",
            channel=MessageChannel.INTERNAL,
            author_id=approved_by,
            is_internal=True,
            is_system_generated=True,
            delivery_status="sent",
            delivery_attempts=1,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(approval)

        return approval

    def reject_cost(
        self,
        company_id: UUID,
        approval_id: UUID,
        rejected_by: UUID,
        rejection_reason: str,
    ) -> CostApproval:
        """Rechazar un costo solicitado"""
        approval = self.get_cost_approval(company_id, approval_id)

        if not approval:
            return None

        approval.status = ApprovalStatus.REJECTED
        approval.approved_by = rejected_by
        approval.approved_at = datetime.utcnow()
        approval.rejection_reason = rejection_reason

        # Update ticket approval status
        ticket = self.db.query(Ticket).filter(Ticket.id == approval.ticket_id).first()
        if ticket:
            ticket.approval_status = "rejected"

        # Create rejection message
        message = Message(
            ticket_id=approval.ticket_id,
            company_id=company_id,
            type=MessageType.APPROVAL,
            content=f"Costo rechazado: {approval.concept}\nMotivo: {rejection_reason}",
            channel=MessageChannel.INTERNAL,
            author_id=rejected_by,
            is_internal=True,
            is_system_generated=True,
            delivery_status="sent",
            delivery_attempts=1,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(approval)

        return approval


class TimeEntryService:
    def __init__(self, db: Session):
        self.db = db

    def create_time_entry(
        self,
        company_id: UUID,
        ticket_id: UUID,
        agent_id: UUID,
        duration_minutes: int,
        work_type: str = None,
        description: str = None,
        work_date: datetime = None,
    ) -> TimeEntry:
        """Crear un registro de tiempo trabajado"""
        ticket = self.db.query(Ticket).filter(
            and_(Ticket.id == ticket_id, Ticket.company_id == company_id)
        ).first()

        if not ticket:
            return None

        entry = TimeEntry(
            ticket_id=ticket_id,
            company_id=company_id,
            agent_id=agent_id,
            duration_minutes=duration_minutes,
            work_type=work_type,
            description=description,
            work_date=work_date or datetime.utcnow(),
            billing_status="pending",
        )

        self.db.add(entry)

        # Create a system message for time entry
        hours = duration_minutes / 60
        message = Message(
            ticket_id=ticket_id,
            company_id=company_id,
            type=MessageType.TIME_ENTRY,
            content=f"Tiempo registrado: {hours:.1f}h - {work_type or 'Trabajo general'}",
            channel=MessageChannel.INTERNAL,
            author_id=agent_id,
            is_internal=True,
            is_system_generated=True,
            delivery_status="sent",
            delivery_attempts=1,
            custom_data={"duration_minutes": duration_minutes},
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(entry)

        return entry

    def get_time_entry(self, company_id: UUID, entry_id: UUID) -> TimeEntry:
        """Obtener un registro de tiempo"""
        return self.db.query(TimeEntry).filter(
            and_(
                TimeEntry.id == entry_id,
                TimeEntry.company_id == company_id,
            )
        ).first()

    def list_time_entries(
        self,
        company_id: UUID,
        ticket_id: UUID = None,
        agent_id: UUID = None,
        billing_status: str = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[TimeEntry]:
        """Listar registros de tiempo"""
        query = self.db.query(TimeEntry).filter(
            TimeEntry.company_id == company_id
        )

        if ticket_id:
            query = query.filter(TimeEntry.ticket_id == ticket_id)

        if agent_id:
            query = query.filter(TimeEntry.agent_id == agent_id)

        if billing_status:
            query = query.filter(TimeEntry.billing_status == billing_status)

        return query.order_by(TimeEntry.work_date.desc()).limit(limit).offset(offset).all()

    def update_billing_status(
        self,
        company_id: UUID,
        entry_id: UUID,
        billing_status: str,
    ) -> TimeEntry:
        """Actualizar estado de facturación"""
        entry = self.get_time_entry(company_id, entry_id)

        if entry:
            entry.billing_status = billing_status
            self.db.commit()
            self.db.refresh(entry)

        return entry
