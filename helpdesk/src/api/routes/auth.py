"""Rutas de autenticación.

Endpoints:
- POST /login - Login con CUIT + username + password
- POST /mfa/enroll/start - Inicia enrolamiento MFA
- POST /mfa/enroll/verify - Verifica código TOTP y completa enrolamiento
- POST /mfa/verify - Verifica TOTP en segundo paso de login
- POST /mfa/recovery - Usa código de recuperación
- POST /logout - Cierra sesión
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime

from src.services.auth_service import create_auth_service
from src.schemas.auth import (
    LoginRequest, LoginEmailRequest, LoginResponse, ErrorResponse,
    MFAEnrollmentStart, MFAEnrollmentVerify,
    MFAVerifyRequest, MFARecoveryCodeRequest
)
import uuid
import jwt
import os

router = APIRouter()


# Dependencias (se expandirán con inyección)
def get_auth_service():
    """Factory para obtener instancia de AuthService."""
    return create_auth_service()


# === ENDPOINTS ===

@router.post("/login")
async def login_email(request: LoginEmailRequest, auth_service=Depends(get_auth_service)):
    """
    Autentica usuario con email + password.
    Endpoint simplificado para frontend.
    """
    # Validaciones básicas
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email y password son requeridos")

    # Determinar rol basado en email (para demo)
    user_id = str(uuid.uuid4())
    is_requester = "requester" in request.email.lower()

    # Generar token JWT simple para demo
    token = jwt.encode(
        {
            "sub": user_id,
            "email": request.email,
            "role": "requester" if is_requester else "agent"
        },
        os.getenv("JWT_SECRET", "secret-key"),
        algorithm="HS256"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": request.email,
            "username": request.email.split("@")[0],
            "role": "requester" if is_requester else "agent"
        }
    }


@router.post("/mfa/enroll/start")
async def mfa_enroll_start(
    request: MFAEnrollmentStart,
    auth_service=Depends(get_auth_service)
):
    """Inicia enrolamiento de MFA TOTP.

    Requiere:
    - Usuario autenticado con paso 1 (CUIT + username + password)

    Retorna:
    - secret (en base32) - para guardar en cliente
    - provisioning_uri - para generar código QR
    - recovery_codes - códigos de recuperación (guardar en lugar seguro)
    """
    secret = auth_service.generate_totp_secret()
    recovery_codes = auth_service.generate_recovery_codes(10)

    # En BD se almacenará:
    # - encrypted_secret
    # - recovery_codes (hasheados)
    # - timestamp de inicio de enrolamiento

    return {
        "secret": secret,
        "provisioning_uri": auth_service.get_totp_provisioning_uri(
            secret=secret,
            name="user@company.local"  # Placeholder
        ),
        "recovery_codes": recovery_codes,
        "note": "Guarda estos códigos de recuperación en un lugar seguro. "
                "Se utilizan si pierdes acceso a tu autenticador."
    }


@router.post("/mfa/enroll/verify")
async def mfa_enroll_verify(
    request: MFAEnrollmentVerify,
    auth_service=Depends(get_auth_service)
):
    """Verifica código TOTP y completa enrolamiento MFA.

    Requiere:
    - Código TOTP de 6 dígitos
    - Confirmación de que el usuario guardó códigos de recuperación

    Efecto:
    - Habilita MFA en el usuario
    - Guarda secreto cifrado y códigos en BD
    - Retorna sesión válida
    """
    if not request.recovery_codes_acknowledged:
        raise HTTPException(
            status_code=400,
            detail="Debes confirmar que has guardado los códigos de recuperación"
        )

    # Aquí se verificaría el código TOTP contra el secreto temporal
    # y se guardaría en BD

    return {
        "status": "enrolled",
        "mfa_enabled": True,
        "message": "MFA habilitado correctamente"
    }


@router.post("/mfa/verify")
async def mfa_verify(
    request: MFAVerifyRequest,
    auth_service=Depends(get_auth_service)
):
    """Verifica código TOTP en segundo paso de login.

    Requiere:
    - Sesión temporal de usuario autenticado en paso 1
    - Código TOTP de 6 dígitos

    Retorna:
    - Token de sesión válida
    """
    # Verificar código TOTP
    # Crear sesión
    # Retornar token
    return {"status": "authenticated", "token": "placeholder-token"}


@router.post("/mfa/recovery")
async def mfa_recovery(
    request: MFARecoveryCodeRequest,
    auth_service=Depends(get_auth_service)
):
    """Usa un código de recuperación en lugar de TOTP.

    Útil cuando el usuario ha perdido acceso a su autenticador.

    Requiere:
    - Sesión temporal de usuario autenticado en paso 1
    - Código de recuperación válido (no usado)

    Efecto:
    - Marca código como usado
    - Crea sesión válida
    - (Envía notificación de usar código de recuperación)
    """
    return {"status": "authenticated", "token": "placeholder-token"}


@router.post("/logout")
async def logout():
    """Cierra sesión actual.

    Requiere:
    - Sesión válida (token en cookie)

    Efecto:
    - Invalida token de sesión en BD
    - Cookie se expira
    """
    return {"status": "logged_out"}


@router.get("/me")
async def get_current_user():
    """Obtiene información del usuario autenticado.

    Requiere:
    - Sesión válida
    """
    return {
        "id": "placeholder-id",
        "username": "placeholder-user",
        "email": "placeholder@company.local",
        "mfa_enabled": True,
        "active_company": "placeholder-company-id"
    }
