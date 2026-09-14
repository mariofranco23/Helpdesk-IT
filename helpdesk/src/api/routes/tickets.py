"""Rutas de gestión de tickets

Endpoints:
- POST /tickets - Crear nuevo ticket
- GET /tickets - Listar tickets
- GET /tickets/{ticket_id} - Detalle del ticket
- PUT /tickets/{ticket_id} - Actualizar ticket
- POST /tickets/{ticket_id}/assign - Asignar a agente
- POST /tickets/{ticket_id}/close - Cerrar ticket
- POST /tickets/{ticket_id}/messages - Agregar mensaje
- GET /tickets/{ticket_id}/messages - Listar mensajes
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.services.ticket_service import TicketService
from src.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse, TicketListResponse, TicketDetailResponse
)
from src.models.ticket import TicketStatus, Priority

router = APIRouter()


def get_ticket_service(db: Session = Depends(get_db)) -> TicketService:
    return TicketService(db)


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: TicketCreate,
    service: TicketService = Depends(get_ticket_service),
    # TODO: Obtener company_id y user_id de sesión válida
    # Por ahora hardcodeados para desarrollo
):
    """Crear nuevo ticket (portal web - paso 3)"""
    # En producción, company_id y requester_id vienen de sesión validada
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder
    requester_id = UUID("00000000-0000-0000-0000-000000000002")  # Placeholder

    ticket = service.create_ticket(company_id, requester_id, request)

    return TicketResponse(
        id=ticket.id,
        public_id=ticket.public_id,
        title=ticket.title,
        description=ticket.description,
        type=ticket.type,
        status=ticket.status,
        priority=ticket.priority,
        requester_id=ticket.requester_id,
        assigned_to=ticket.assigned_to,
        category=ticket.category,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        first_response_at=ticket.first_response_at,
        resolved_at=ticket.resolved_at,
        has_cost=ticket.has_cost,
        estimated_cost=ticket.estimated_cost,
    )


@router.get("/", response_model=List[TicketListResponse])
async def list_tickets(
    status: TicketStatus = Query(None),
    assigned_to: UUID = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: TicketService = Depends(get_ticket_service),
):
    """Listar tickets con filtros (consola de casos)"""
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder

    tickets = service.list_tickets(
        company_id=company_id,
        status=status,
        assigned_to=assigned_to,
        limit=limit,
        offset=offset
    )

    return [
        TicketListResponse(
            id=t.id,
            public_id=t.public_id,
            title=t.title,
            status=t.status,
            priority=t.priority,
            category=t.category,
            assigned_to=t.assigned_to,
            created_at=t.created_at,
            updated_at=t.updated_at,
            reopens_count=t.reopens_count,
        )
        for t in tickets
    ]


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket(
    ticket_id: UUID,
    service: TicketService = Depends(get_ticket_service),
):
    """Obtener detalle del ticket"""
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder

    ticket = service.get_ticket(company_id, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return TicketDetailResponse(
        id=ticket.id,
        public_id=ticket.public_id,
        title=ticket.title,
        description=ticket.description,
        type=ticket.type,
        status=ticket.status,
        priority=ticket.priority,
        impact=ticket.impact,
        urgency=ticket.urgency,
        requester_id=ticket.requester_id,
        assigned_to=ticket.assigned_to,
        participants=ticket.participants or [],
        category=ticket.category,
        subcategory=ticket.subcategory,
        sector=ticket.sector,
        branch=ticket.branch,
        equipment=ticket.equipment,
        has_cost=ticket.has_cost,
        estimated_cost=ticket.estimated_cost,
        approved_cost=ticket.approved_cost,
        approval_status=ticket.approval_status,
        reopens_count=ticket.reopens_count,
        tags=ticket.tags or [],
        created_at=ticket.created_at,
        first_response_at=ticket.first_response_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        updated_at=ticket.updated_at,
    )


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: UUID,
    request: TicketUpdate,
    service: TicketService = Depends(get_ticket_service),
):
    """Actualizar ticket (cambiar estado, prioridad, etc)"""
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder
    agent_id = UUID("00000000-0000-0000-0000-000000000003")  # Placeholder

    ticket = service.update_ticket(company_id, ticket_id, request, agent_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return TicketResponse(
        id=ticket.id,
        public_id=ticket.public_id,
        title=ticket.title,
        description=ticket.description,
        type=ticket.type,
        status=ticket.status,
        priority=ticket.priority,
        requester_id=ticket.requester_id,
        assigned_to=ticket.assigned_to,
        category=ticket.category,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        first_response_at=ticket.first_response_at,
        resolved_at=ticket.resolved_at,
        has_cost=ticket.has_cost,
        estimated_cost=ticket.estimated_cost,
    )


@router.post("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: UUID,
    agent_id: UUID = Query(...),
    service: TicketService = Depends(get_ticket_service),
):
    """Asignar ticket a un agente"""
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder
    assigned_by = UUID("00000000-0000-0000-0000-000000000003")  # Placeholder

    ticket = service.assign_ticket(company_id, ticket_id, agent_id, assigned_by)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return {"status": "assigned", "ticket_id": ticket_id, "assigned_to": agent_id}


@router.post("/{ticket_id}/close")
async def close_ticket(
    ticket_id: UUID,
    resolution_summary: str = Query(..., min_length=10),
    service: TicketService = Depends(get_ticket_service),
):
    """Cerrar ticket con resumen de resolución"""
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # Placeholder
    closed_by = UUID("00000000-0000-0000-0000-000000000003")  # Placeholder

    ticket = service.close_ticket(company_id, ticket_id, resolution_summary, closed_by)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return {"status": "closed", "ticket_id": ticket_id, "closed_at": ticket.closed_at}
