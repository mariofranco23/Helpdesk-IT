"""Rutas de gestión de mensajes en tickets"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from src.database import get_db
from src.services.message_service import MessageService
from src.schemas.message import MessageCreate, MessageResponse, MessageListResponse
from src.api.dependencies import get_authenticated_user, AuthenticatedUser

router = APIRouter()


def get_message_service(db: Session = Depends(get_db)) -> MessageService:
    return MessageService(db)


@router.post("/{ticket_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    ticket_id: UUID,
    request: MessageCreate,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: MessageService = Depends(get_message_service),
):
    """Agregar un mensaje o nota al ticket"""
    message = service.create_message(
        company_id=user.company_id,
        ticket_id=ticket_id,
        content=request.content,
        author_id=user.user_id,
        message_type=request.type,
        channel=request.channel,
        is_internal=request.is_internal,
        custom_data=request.custom_data,
    )

    if not message:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    return MessageResponse(
        id=message.id,
        ticket_id=message.ticket_id,
        type=message.type,
        content=message.content,
        channel=message.channel,
        author_id=message.author_id,
        is_internal=message.is_internal,
        is_system_generated=message.is_system_generated,
        delivery_status=message.delivery_status,
        delivery_attempts=message.delivery_attempts,
        created_at=message.created_at,
        updated_at=message.updated_at,
    )


@router.get("/{ticket_id}/messages", response_model=List[MessageListResponse])
async def list_messages(
    ticket_id: UUID,
    include_internal: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: MessageService = Depends(get_message_service),
):
    """Listar mensajes del ticket"""
    messages = service.list_messages(
        company_id=user.company_id,
        ticket_id=ticket_id,
        include_internal=include_internal,
        limit=limit,
        offset=offset,
    )

    return [
        MessageListResponse(
            id=m.id,
            type=m.type,
            content=m.content,
            author_id=m.author_id,
            is_internal=m.is_internal,
            is_system_generated=m.is_system_generated,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.get("/{ticket_id}/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    ticket_id: UUID,
    message_id: UUID,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: MessageService = Depends(get_message_service),
):
    """Obtener detalle de un mensaje"""
    message = service.get_message(user.company_id, message_id)
    if not message or message.ticket_id != ticket_id:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    return MessageResponse(
        id=message.id,
        ticket_id=message.ticket_id,
        type=message.type,
        content=message.content,
        channel=message.channel,
        author_id=message.author_id,
        is_internal=message.is_internal,
        is_system_generated=message.is_system_generated,
        delivery_status=message.delivery_status,
        delivery_attempts=message.delivery_attempts,
        created_at=message.created_at,
        updated_at=message.updated_at,
    )
