"""Dependencias y middleware para autenticación y validación."""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from uuid import UUID
from datetime import datetime

from src.database import get_db
from src.models.session import Session as SessionModel
from src.models.user import User
from src.services.auth_service import AuthService


class AuthenticatedUser:
    """Información de usuario autenticado."""

    def __init__(self, user_id: UUID, company_id: UUID, username: str, email: str, role: str):
        self.user_id = user_id
        self.company_id = company_id
        self.username = username
        self.email = email
        self.role = role


def get_auth_service() -> AuthService:
    """Obtiene instancia de AuthService con clave de encriptación."""
    import os
    encryption_key = os.getenv(
        "HELPDESK_MFA_ENCRYPTION_KEY",
        "gAAAAABkY_7BZ1234567890ABCDEFGHIJKLMNOP"  # Fallback demo key
    )
    return AuthService(encryption_key)


def extract_token_from_header(authorization: Optional[str]) -> Optional[str]:
    """Extrae el token Bearer del header Authorization.

    Formato esperado: "Bearer <token>"
    """
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


async def get_authenticated_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> AuthenticatedUser:
    """Valida el token de sesión y retorna el usuario autenticado.

    Extrae user_id y company_id del token validado.
    Lanza excepción 401 si el token es inválido o expiró.
    """
    auth_service = get_auth_service()

    # Extraer token del header
    token = extract_token_from_header(authorization)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sesión faltante o inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validar token contra base de datos
    token_hash = auth_service.hash_session_token(token)

    session = db.query(SessionModel).filter(
        SessionModel.token_hash == token_hash
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sesión inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que no haya expirado
    if session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sesión expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Obtener usuario asociado
    user = db.query(User).filter(User.id == session.user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo o no encontrado",
        )

    # Retornar información del usuario autenticado
    return AuthenticatedUser(
        user_id=user.id,
        company_id=user.company_id,
        username=user.username,
        email=user.email,
        role=user.role.value,
    )


async def get_authenticated_user_optional(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> Optional[AuthenticatedUser]:
    """Valida sesión pero no lanza excepción si falta token.

    Retorna None si no hay token o es inválido.
    Útil para endpoints que pueden ser públicos o autenticados.
    """
    try:
        return await get_authenticated_user(db, authorization)
    except HTTPException:
        return None


def require_role(*allowed_roles: str):
    """Factory para crear dependencia que valida rol.

    Uso:
        @router.get("/admin")
        async def admin_endpoint(
            user: AuthenticatedUser = Depends(
                require_role("COMPANY_ADMIN", "SYSTEM_ADMIN")
            )
        ):
            ...
    """
    async def check_role(
        user: AuthenticatedUser = Depends(get_authenticated_user),
    ) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol insuficiente. Requerido: {', '.join(allowed_roles)}",
            )
        return user

    return check_role
