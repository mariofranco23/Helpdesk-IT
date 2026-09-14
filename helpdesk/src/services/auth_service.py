"""Servicio de autenticación y MFA.

Responsabilidades:
- Validación de credenciales (CUIT + username + password)
- Enrolamiento y verificación de TOTP (MFA obligatorio)
- Gestión de sesiones seguras
- Códigos de recuperación
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple

import pyotp
from cryptography.fernet import Fernet
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class AuthService:
    """Servicio central de autenticación y MFA.

    Aislamiento multi-tenant: validar CUIT y empresa en cada operación.
    No depender de tenant_id del navegador; resolver desde tokens válidos.
    """

    ENCRYPTION_KEY_LENGTH = 32
    RECOVERY_CODE_LENGTH = 12
    RECOVERY_CODE_COUNT = 10
    SESSION_DURATION_HOURS = 8
    MFA_ENROLLMENT_TIMEOUT_HOURS = 1

    def __init__(self, encryption_key: str):
        """Args:
            encryption_key: Clave Fernet de 32 bytes (base64) para cifrar secretos MFA.
        """
        key = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key
        self.cipher = Fernet(key)

    # === CONTRASEÑAS ===

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash seguro de contraseña con Argon2id."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verifica contraseña contra hash."""
        return pwd_context.verify(password, password_hash)

    # === TOTP / MFA ===

    @staticmethod
    def generate_totp_secret() -> str:
        """Genera un nuevo secreto TOTP (base32)."""
        return pyotp.random_base32()

    def encrypt_totp_secret(self, secret: str) -> str:
        """Cifra un secreto TOTP para almacenamiento."""
        return self.cipher.encrypt(secret.encode()).decode()

    def decrypt_totp_secret(self, encrypted_secret: str) -> str:
        """Descifra un secreto TOTP."""
        return self.cipher.decrypt(encrypted_secret.encode()).decode()

    @staticmethod
    def verify_totp(secret: str, code: str, window: int = 1) -> bool:
        """Verifica un código TOTP.

        Args:
            secret: Secreto TOTP en base32
            code: Código ingresado por el usuario (6 dígitos)
            window: Ventana de tolerancia (±30s adicionales)
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=window)
        except Exception:
            return False

    @staticmethod
    def get_totp_provisioning_uri(secret: str, name: str, issuer: str = "Mesa de Ayuda IT") -> str:
        """Genera URI de provisionamiento para QR."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=name, issuer_name=issuer)

    # === CÓDIGOS DE RECUPERACIÓN ===

    @staticmethod
    def generate_recovery_codes(count: int = 10) -> list[str]:
        """Genera códigos de recuperación únicos.

        Formato: 12 caracteres hexadecimales en mayúsculas
        """
        codes = []
        for _ in range(count):
            code = uuid.uuid4().hex[:12].upper()
            codes.append(code)
        return codes

    @staticmethod
    def hash_recovery_code(code: str) -> str:
        """Hash SHA-256 de un código de recuperación para almacenamiento."""
        return hashlib.sha256(code.encode()).hexdigest()

    @staticmethod
    def verify_recovery_code(code: str, code_hash: str) -> bool:
        """Verifica un código de recuperación contra su hash."""
        return hashlib.sha256(code.encode()).hexdigest() == code_hash

    def create_recovery_code_entries(self, codes: list[str]) -> list[dict]:
        """Crea estructura de almacenamiento para códigos de recuperación."""
        return [
            {
                "code_hash": self.hash_recovery_code(code),
                "used_at": None
            }
            for code in codes
        ]

    def mark_recovery_code_used(self, recovery_codes: list[dict], code: str) -> Tuple[bool, list[dict]]:
        """Marca un código de recuperación como usado.

        Returns:
            (was_valid, updated_list)
        """
        code_hash = self.hash_recovery_code(code)
        for entry in recovery_codes:
            if entry["code_hash"] == code_hash and entry["used_at"] is None:
                entry["used_at"] = datetime.utcnow().isoformat()
                return True, recovery_codes
        return False, recovery_codes

    # === SESIONES ===

    @staticmethod
    def generate_session_token() -> str:
        """Genera un token de sesión opaco."""
        return uuid.uuid4().hex

    @staticmethod
    def hash_session_token(token: str) -> str:
        """Hash SHA-256 del token para almacenamiento en BD."""
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def generate_csrf_token() -> str:
        """Genera un token CSRF."""
        return uuid.uuid4().hex

    # === CUIT ===

    @staticmethod
    def normalize_cuit(cuit: str) -> str:
        """Normaliza CUIT: solo dígitos, validación de rango.

        CUIT válido: 11-13 dígitos
        Formato normalizado: sin separadores (ej: 20309999999 en lugar de 20-30999999-9)

        No valida el dígito verificador en esta etapa (es responsabilidad
        de la aplicación comercial, no de validación técnica).
        """
        normalized = cuit.replace("-", "").replace(" ", "").strip()

        if not normalized.isdigit():
            raise ValueError("CUIT debe contener solo dígitos")

        if not (11 <= len(normalized) <= 13):
            raise ValueError("CUIT debe tener 11-13 dígitos")

        return normalized

    @staticmethod
    def validate_cuit_checksum(cuit: str) -> bool:
        """Valida el dígito verificador de CUIT (ley 20.705).

        Retorna False si no es válido. No lanza excepción.
        """
        cuit = cuit.strip().replace("-", "")

        if not cuit.isdigit() or len(cuit) != 11:
            return False

        multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        total = sum(int(cuit[i]) * multipliers[i] for i in range(10))

        verifier = 11 - (total % 11)
        if verifier == 11:
            verifier = 0
        elif verifier == 10:
            verifier = 9

        return int(cuit[10]) == verifier


def create_auth_service(encryption_key: Optional[str] = None) -> AuthService:
    """Crea instancia de AuthService.

    Si encryption_key es None, genera una clave de demostración (NO usar en prod).
    En producción, cargar de variable de entorno HELPDESK_MFA_ENCRYPTION_KEY.
    """
    if encryption_key is None:
        encryption_key = Fernet.generate_key().decode()

    return AuthService(encryption_key)
