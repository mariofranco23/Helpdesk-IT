"""Rutas de gestión de aprobaciones de costos y registros de tiempo"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.services.approval_service import ApprovalService, TimeEntryService
from src.schemas.approval import (
    CostApprovalCreate, CostApprovalApprove, CostApprovalReject, CostApprovalResponse,
    TimeEntryCreate, TimeEntryResponse
)
from src.api.dependencies import get_authenticated_user, AuthenticatedUser

router = APIRouter()


def get_approval_service(db: Session = Depends(get_db)) -> ApprovalService:
    return ApprovalService(db)


def get_time_entry_service(db: Session = Depends(get_db)) -> TimeEntryService:
    return TimeEntryService(db)


# Cost Approval Endpoints
@router.post("/{ticket_id}/cost-approvals", response_model=CostApprovalResponse, status_code=status.HTTP_201_CREATED)
async def request_cost_approval(
    ticket_id: UUID,
    request: CostApprovalCreate,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: ApprovalService = Depends(get_approval_service),
):
    """Solicitar aprobación de costo para un ticket"""
    approval = service.request_cost_approval(
        company_id=user.company_id,
        ticket_id=ticket_id,
        amount=request.amount,
        concept=request.concept,
        currency=request.currency,
        description=request.description,
        requested_by=user.user_id,
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return CostApprovalResponse(
        id=approval.id,
        ticket_id=approval.ticket_id,
        amount=approval.amount,
        currency=approval.currency,
        concept=approval.concept,
        status=approval.status.value,
        requested_by=approval.requested_by,
        requested_at=approval.requested_at,
        approved_by=approval.approved_by,
        approved_at=approval.approved_at,
        rejection_reason=approval.rejection_reason,
        created_at=approval.created_at,
        updated_at=approval.updated_at,
    )


@router.get("/{ticket_id}/cost-approvals", response_model=List[CostApprovalResponse])
async def list_cost_approvals(
    ticket_id: UUID,
    status: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: ApprovalService = Depends(get_approval_service),
):
    """Listar aprobaciones de costo de un ticket"""
    approvals = service.list_cost_approvals(
        company_id=user.company_id,
        ticket_id=ticket_id,
        status=status,
        limit=limit,
        offset=offset,
    )

    return [
        CostApprovalResponse(
            id=a.id,
            ticket_id=a.ticket_id,
            amount=a.amount,
            currency=a.currency,
            concept=a.concept,
            status=a.status.value,
            requested_by=a.requested_by,
            requested_at=a.requested_at,
            approved_by=a.approved_by,
            approved_at=a.approved_at,
            rejection_reason=a.rejection_reason,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in approvals
    ]


@router.post("/{ticket_id}/cost-approvals/{approval_id}/approve", response_model=CostApprovalResponse)
async def approve_cost(
    ticket_id: UUID,
    approval_id: UUID,
    request: CostApprovalApprove,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: ApprovalService = Depends(get_approval_service),
):
    """Aprobar un costo solicitado"""
    approval = service.approve_cost(
        company_id=user.company_id,
        approval_id=approval_id,
        approved_by=user.user_id,
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Aprobación no encontrada")

    return CostApprovalResponse(
        id=approval.id,
        ticket_id=approval.ticket_id,
        amount=approval.amount,
        currency=approval.currency,
        concept=approval.concept,
        status=approval.status.value,
        requested_by=approval.requested_by,
        requested_at=approval.requested_at,
        approved_by=approval.approved_by,
        approved_at=approval.approved_at,
        rejection_reason=approval.rejection_reason,
        created_at=approval.created_at,
        updated_at=approval.updated_at,
    )


@router.post("/{ticket_id}/cost-approvals/{approval_id}/reject", response_model=CostApprovalResponse)
async def reject_cost(
    ticket_id: UUID,
    approval_id: UUID,
    request: CostApprovalReject,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: ApprovalService = Depends(get_approval_service),
):
    """Rechazar un costo solicitado"""
    approval = service.reject_cost(
        company_id=user.company_id,
        approval_id=approval_id,
        rejected_by=user.user_id,
        rejection_reason=request.rejection_reason,
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Aprobación no encontrada")

    return CostApprovalResponse(
        id=approval.id,
        ticket_id=approval.ticket_id,
        amount=approval.amount,
        currency=approval.currency,
        concept=approval.concept,
        status=approval.status.value,
        requested_by=approval.requested_by,
        requested_at=approval.requested_at,
        approved_by=approval.approved_by,
        approved_at=approval.approved_at,
        rejection_reason=approval.rejection_reason,
        created_at=approval.created_at,
        updated_at=approval.updated_at,
    )


# Time Entry Endpoints
@router.post("/{ticket_id}/time-entries", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    ticket_id: UUID,
    request: TimeEntryCreate,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: TimeEntryService = Depends(get_time_entry_service),
):
    """Registrar tiempo trabajado en un ticket"""
    entry = service.create_time_entry(
        company_id=user.company_id,
        ticket_id=ticket_id,
        agent_id=user.user_id,
        duration_minutes=request.duration_minutes,
        work_type=request.work_type,
        description=request.description,
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return TimeEntryResponse(
        id=entry.id,
        ticket_id=entry.ticket_id,
        agent_id=entry.agent_id,
        duration_minutes=entry.duration_minutes,
        work_type=entry.work_type,
        description=entry.description,
        work_date=entry.work_date,
        billing_status=entry.billing_status,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


@router.get("/{ticket_id}/time-entries", response_model=List[TimeEntryResponse])
async def list_time_entries(
    ticket_id: UUID,
    agent_id: UUID = Query(None),
    billing_status: str = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: TimeEntryService = Depends(get_time_entry_service),
):
    """Listar registros de tiempo de un ticket"""
    entries = service.list_time_entries(
        company_id=user.company_id,
        ticket_id=ticket_id,
        agent_id=agent_id,
        billing_status=billing_status,
        limit=limit,
        offset=offset,
    )

    return [
        TimeEntryResponse(
            id=e.id,
            ticket_id=e.ticket_id,
            agent_id=e.agent_id,
            duration_minutes=e.duration_minutes,
            work_type=e.work_type,
            description=e.description,
            work_date=e.work_date,
            billing_status=e.billing_status,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in entries
    ]


@router.get("/{ticket_id}/time-entries/{entry_id}", response_model=TimeEntryResponse)
async def get_time_entry(
    ticket_id: UUID,
    entry_id: UUID,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: TimeEntryService = Depends(get_time_entry_service),
):
    """Obtener detalle de un registro de tiempo"""
    entry = service.get_time_entry(user.company_id, entry_id)
    if not entry or entry.ticket_id != ticket_id:
        raise HTTPException(status_code=404, detail="Registro de tiempo no encontrado")

    return TimeEntryResponse(
        id=entry.id,
        ticket_id=entry.ticket_id,
        agent_id=entry.agent_id,
        duration_minutes=entry.duration_minutes,
        work_type=entry.work_type,
        description=entry.description,
        work_date=entry.work_date,
        billing_status=entry.billing_status,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )
