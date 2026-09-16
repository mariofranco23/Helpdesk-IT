from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class LoginRequest(BaseModel):
    cuit: str = Field(..., description="CUIT normalizado (11-13 dígitos)")
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)


class LoginEmailRequest(BaseModel):
    email: str = Field(..., description="Email del usuario")
    password: str = Field(..., min_length=1)


class MFAEnrollmentStart(BaseModel):
    """Inicia enrolamiento de MFA TOTP después de login exitoso"""
    pass


class MFAEnrollmentVerify(BaseModel):
    """Verifica el código TOTP para completar enrolamiento"""
    code: str = Field(..., pattern=r"^\d{6}$", description="Código TOTP de 6 dígitos")
    recovery_codes_acknowledged: bool = Field(
        default=False,
        description="Usuario confirmó que guardó los códigos de recuperación"
    )


class MFAVerifyRequest(BaseModel):
    """Verifica TOTP en login"""
    code: str = Field(..., pattern=r"^\d{6}$", description="Código TOTP de 6 dígitos")


class MFARecoveryCodeRequest(BaseModel):
    """Usa un código de recuperación en lugar de TOTP"""
    recovery_code: str = Field(..., min_length=8, max_length=20)


class LoginResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    mfa_enabled: bool
    mfa_enrollment_pending: bool = Field(
        default=False,
        description="Si es True, redirigir a enrolamiento MFA"
    )
    active_company_id: Optional[UUID] = Field(
        default=None,
        description="Contexto de empresa activo"
    )


class UserInfo(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    is_active: bool
    mfa_enabled: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
