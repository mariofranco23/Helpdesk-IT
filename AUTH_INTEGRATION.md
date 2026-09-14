# Autenticación en Endpoints - Guía de Integración

## Overview
Todos los endpoints ahora están integrados con autenticación basada en sesiones. Los tokens de sesión se validan contra la base de datos y se extraen `user_id` y `company_id` para cada solicitud.

## Flujo de Autenticación

### 1. Login (Etapa 1)
```
POST /api/v1/auth/login
{
  "cuit": "20-30999999-9",
  "username": "jdoe",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "jdoe",
  "email": "jdoe@company.local",
  "mfa_enabled": false,
  "mfa_enrollment_pending": true,
  "active_company_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### 2. Completar MFA (si está habilitado)
```
POST /api/v1/auth/mfa/enroll/verify
{
  "code": "123456",
  "recovery_codes_acknowledged": true
}
```

### 3. Session Response
Después de login exitoso, se crea una sesión en la BD:
- **Session.token_hash**: SHA-256(token)
- **Session.user_id**: ID del usuario autenticado
- **Session.expires_at**: Datetime de expiración
- **Session.user_agent**: Para rastreo de dispositivos
- **Session.ip_address**: Para auditoría

El cliente recibe un token opaco (UUID) que debe almacenar y enviar en cada solicitud.

## Uso de Endpoints Autenticados

### Header de Autorización
Todos los endpoints requieren un header `Authorization`:

```
GET /api/v1/tickets/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Format: `Bearer <token>`

### Extracción de Contexto
El middleware `get_authenticated_user` hace lo siguiente:

1. **Extrae token** del header `Authorization: Bearer <token>`
2. **Valida token** contra `sessions.token_hash` en BD
3. **Verifica expiración** contra `sessions.expires_at`
4. **Obtiene usuario** asociado
5. **Retorna AuthenticatedUser** con:
   - `user_id`: Para rastrear quién hace la acción
   - `company_id`: Para aislamiento multi-tenant
   - `username`, `email`, `role`: Información del usuario

### Ejemplo de Endpoint

**Antes** (con hardcoded UUIDs):
```python
@router.post("/", response_model=TicketResponse)
async def create_ticket(
    request: TicketCreate,
    service: TicketService = Depends(get_ticket_service),
):
    company_id = UUID("00000000-0000-0000-0000-000000000001")  # ❌ Hardcoded
    requester_id = UUID("00000000-0000-0000-0000-000000000002")  # ❌ Hardcoded
    
    ticket = service.create_ticket(company_id, requester_id, request)
```

**Después** (con autenticación):
```python
@router.post("/", response_model=TicketResponse)
async def create_ticket(
    request: TicketCreate,
    user: AuthenticatedUser = Depends(get_authenticated_user),
    service: TicketService = Depends(get_ticket_service),
):
    # ✅ Del usuario autenticado en la sesión
    ticket = service.create_ticket(user.company_id, user.user_id, request)
```

## Control de Acceso por Rol

### Requerir Rol Específico
```python
from src.api.dependencies import require_role

@router.post("/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: UUID,
    agent_id: UUID = Query(...),
    user: AuthenticatedUser = Depends(
        require_role("COMPANY_ADMIN", "IT_SUPERVISOR")
    ),
    service: TicketService = Depends(get_ticket_service),
):
    """Solo admins y supervisores pueden asignar tickets"""
    ticket = service.assign_ticket(user.company_id, ticket_id, agent_id, user.user_id)
```

### Roles Disponibles
- `EXTERNAL_REQUESTER` - Cliente externo (puede crear tickets)
- `COMPANY_ADMIN` - Administrador de empresa (gestión completa)
- `IT_AGENT` - Agente IT (resolver tickets)
- `IT_SUPERVISOR` - Supervisor IT (validar soluciones)
- `SYSTEM_ADMIN` - Administrador del sistema (acceso total)

## Endpoints Modificados

### ✅ Tickets
- `POST /api/v1/tickets/` - Usa `user.user_id` como requester
- `GET /api/v1/tickets/` - Filtra por `user.company_id`
- `GET /api/v1/tickets/{ticket_id}` - Valida pertenencia a company
- `PUT /api/v1/tickets/{ticket_id}` - Usa `user.user_id` para auditría
- `POST /api/v1/tickets/{ticket_id}/assign` - Usa `user.user_id` como assigned_by
- `POST /api/v1/tickets/{ticket_id}/close` - Usa `user.user_id` como closed_by

### ✅ Mensajes
- `POST /api/v1/tickets/{ticket_id}/messages` - Usa `user.user_id` como author
- `GET /api/v1/tickets/{ticket_id}/messages` - Filtra por company
- `GET /api/v1/tickets/{ticket_id}/messages/{message_id}` - Valida pertenencia

### ✅ Aprobaciones de Costo
- `POST /api/v1/tickets/{ticket_id}/cost-approvals` - Usa `user.user_id` como requested_by
- `GET /api/v1/tickets/{ticket_id}/cost-approvals` - Filtra por company
- `POST /api/v1/tickets/{ticket_id}/cost-approvals/{approval_id}/approve` - Usa `user.user_id` como approved_by
- `POST /api/v1/tickets/{ticket_id}/cost-approvals/{approval_id}/reject` - Usa `user.user_id` como rejected_by

### ✅ Registros de Tiempo
- `POST /api/v1/tickets/{ticket_id}/time-entries` - Usa `user.user_id` como agent_id
- `GET /api/v1/tickets/{ticket_id}/time-entries` - Filtra por company
- `GET /api/v1/tickets/{ticket_id}/time-entries/{entry_id}` - Valida pertenencia

## Manejo de Errores

### 401 Unauthorized
```json
{
  "detail": "Token de sesión faltante o inválido"
}
```
**Causas:**
- Header Authorization faltante
- Formato incorrecto (no es "Bearer <token>")
- Token no existe en BD
- Token expirado

**Acción del cliente:**
- Reenviarse a login
- Solicitar nuevo token

### 403 Forbidden
```json
{
  "detail": "Rol insuficiente. Requerido: COMPANY_ADMIN, IT_SUPERVISOR"
}
```
**Causas:**
- Usuario autenticado pero sin rol requerido

**Acción del cliente:**
- Mostrar error de permisos
- Ofrecer contactar con administrador

### 404 Not Found
```json
{
  "detail": "Ticket no encontrado"
}
```
**Causas:**
- Recurso no pertenece a company_id del usuario
- Recurso fue eliminado

## Configuración de Variable de Entorno

```bash
# .env
HELPDESK_MFA_ENCRYPTION_KEY=your_fernet_key_here
```

Generar una clave válida:
```python
from cryptography.fernet import Fernet
key = Fernet.generate_key().decode()
print(key)
```

## Testing con cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "20309999999",
    "username": "jdoe",
    "password": "SecurePassword123"
  }' | jq -r '.token')

# 2. Usar token en endpoint protegido
curl -X GET http://localhost:8000/api/v1/tickets/ \
  -H "Authorization: Bearer $TOKEN"
```

## Testing con Python

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "cuit": "20309999999",
        "username": "jdoe",
        "password": "SecurePassword123"
    }
)

# 2. Extraer token
token = login_response.json()["token"]

# 3. Usar en endpoints
headers = {"Authorization": f"Bearer {token}"}

tickets = requests.get(
    f"{BASE_URL}/tickets/",
    headers=headers
).json()
```

## Aislamiento Multi-Tenant

Cada usuario está asociado a exactamente una `company_id`:
- **Email/Username únicos por empresa**: `(user.company_id, user.email)` es único
- **Queries filtradas por company**: Todo query en service filtra por `company_id`
- **Sin confianza en cliente**: `company_id` se extrae del token, no del cliente

Ejemplo de consulta segura:
```python
def get_ticket(self, company_id: UUID, ticket_id: UUID):
    return self.db.query(Ticket).filter(
        and_(
            Ticket.id == ticket_id,
            Ticket.company_id == company_id  # ← Siempre validar
        )
    ).first()
```

## Próximos Pasos

1. ✅ Integración de autenticación completada
2. ⏳ Test suite para validar sesiones
3. ⏳ Rate limiting por usuario/IP
4. ⏳ Auditoría de acciones por usuario
5. ⏳ Refresh tokens para sesiones largas
6. ⏳ Revocación de tokens

## Referencias

- **AuthService**: `src/services/auth_service.py`
- **Dependencies**: `src/api/dependencies.py`
- **Session Model**: `src/models/session.py`
- **Auth Routes**: `src/api/routes/auth.py`
