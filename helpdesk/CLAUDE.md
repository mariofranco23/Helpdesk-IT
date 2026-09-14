# CLAUDE.md - Mesa de Ayuda IT

Guía de desarrollo para Claude Code en este repositorio.

## Contexto del Proyecto

**Mesa de Ayuda IT** es una plataforma integral de gestión de tickets para equipos de soporte que atienden múltiples empresas externas. 

- **Multi-tenant seguro** por CUIT
- **Autenticación robusta** con MFA TOTP obligatorio
- **Canales múltiples:** Portal web, Email, WhatsApp, Telefonía
- **Gestión comercial:** Aprobación de costos, registro de horas
- **Dashboard y reportes** para supervisión y auditoría

## Reglas de Desarrollo

1. **SDD-Driven:** Revisar especificaciones en `docs/sdd/` antes de implementar cambios
2. **Type hints:** Python con Pydantic, TypeScript en React
3. **Testing:** Cobertura mínima 80% en servicios críticos (auth, multi-tenant)
4. **Seguridad:** Validar tenant_id, no confiar en tokens del cliente, CSRF, rate limiting
5. **Aislamiento:** Nunca mezclar datos entre tenants en consultas, caché o eventos

## Arquitectura

### Backend (Python/FastAPI)

```
src/
├── api/
│   ├── main.py           # Aplicación FastAPI
│   ├── dependencies.py    # Inyección de dependencias
│   └── routes/
│       ├── auth.py        # Login, MFA
│       ├── companies.py    # Empresas (admin)
│       ├── tickets.py      # Gestión de tickets
│       └── ...
├── models/
│   ├── company.py
│   ├── user.py
│   ├── membership.py
│   ├── ticket.py
│   ├── message.py
│   └── ...
├── schemas/
│   ├── auth.py
│   ├── ticket.py
│   └── ...
├── services/
│   ├── auth_service.py    # Credenciales, TOTP, sesiones
│   ├── ticket_service.py   # Lógica de tickets
│   ├── channel_service.py  # Canales (email, whatsapp)
│   └── ...
└── database.py            # Configuración SQLAlchemy
```

### Frontend (React/TypeScript)

```
frontend/src/
├── components/
│   ├── Auth/              # Login, MFA, reset
│   ├── Portal/            # Vista de solicitante
│   ├── Console/           # Consola de casos
│   ├── Common/            # UI reutilizable
├── pages/                 # Rutas principales
├── hooks/                 # Custom hooks (useAuth, useTickets)
├── services/              # Llamadas a API
└── types/                 # Tipos TypeScript
```

### Base de Datos

```
PostgreSQL con aislamiento Row-Level Security (futuro hardening):

- companies (tenants, id=UUID, cuit=unique)
- users (id=UUID, company_id, email/username únicos por company)
- memberships (usuario→company, roles)
- mfa_sessions (TOTP, códigos de recuperación)
- sessions (auth tokens, duración limitada)
- tickets (estado, prioridad, SLA)
- messages (conversación, audit trail)
- attachments (archivos adjuntos)
- approvals (aprobación de costos)
- time_entries (registro de horas)
- events (auditoría)
- ...
```

## Configuración de Desarrollo

### Requisitos

```bash
# Backend
poetry install

# Frontend
cd frontend && npm install

# Base de datos (Docker)
docker-compose up -d postgres redis
```

### Variables de Entorno

Crear `.env`:

```env
# Database
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk

# Security
SECRET_KEY=generada-aleatoriamente-en-produccion
MFA_ENCRYPTION_KEY=clave-fernet-base64

# Configuración
DEBUG=true
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Canales (opcional en dev)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER=
SMTP_SERVER=
SMTP_USER=
```

### Servidor de Desarrollo

**Backend:**
```bash
poetry run alembic upgrade head  # Migraciones
poetry run uvicorn src.api.main:app --reload
# http://localhost:8000
# Docs: http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:3000
```

## Patrones de Desarrollo

### Aislamiento Multi-Tenant

**Principio:** Nunca confiar en tenant_id del navegador. Resolver contexto desde sesión válida.

```python
# ✅ Correcto
@router.get("/tickets")
async def list_tickets(session: Session = Depends(get_session)):
    user_company_id = session.company_id  # Validado en BD
    tickets = db.query(Ticket).filter(Ticket.company_id == user_company_id)

# ❌ Incorrecto
@router.get("/tickets")
async def list_tickets(company_id: UUID = Query(...)):
    tickets = db.query(Ticket).filter(Ticket.company_id == company_id)  # Confía en cliente!
```

### Servicios de Lógica

Todos los servicios usan inyección de dependencias:

```python
class TicketService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def create_ticket(self, company_id: UUID, data: TicketCreate) -> Ticket:
        # Lógica centralizada, testeable
        pass

# En routes
@router.post("/tickets")
async def create_ticket(
    request: TicketCreate,
    service: TicketService = Depends(get_ticket_service)
) -> TicketResponse:
    return service.create_ticket(company_id=current_session.company_id, data=request)
```

### Validación de API

Usar Pydantic para toda entrada:

```python
from pydantic import BaseModel, EmailStr, Field

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(..., regex=r"^[a-z_]+$")
    priority: Priority = Field(default=Priority.MEDIUM)
```

## Pruebas

**Estructura:**
```
tests/
├── conftest.py        # Fixtures pytest
├── unit/
│   ├── test_auth_service.py
│   ├── test_ticket_service.py
│   └── ...
└── integration/
    ├── test_auth_flow.py
    ├── test_ticket_creation.py
    └── ...
```

**Ejecutar:**
```bash
poetry run pytest                  # Todos
poetry run pytest tests/unit -v    # Con output
poetry run pytest --cov=src        # Cobertura
```

## Migraciones

Usar Alembic para esquema:

```bash
# Crear migración
poetry run alembic revision --autogenerate -m "Descripción"

# Aplicar
poetry run alembic upgrade head

# Revertir
poetry run alembic downgrade -1
```

## Decisiones Importantes

Ver [DECISIONS.md](./DECISIONS.md) para:
- Stack elegido y rationale
- Modelos iniciales
- Criptografía y seguridad
- Próximos pasos por etapa

## Documentación de Especificaciones

Ver `docs/sdd/` para especificaciones técnicas formales:
- SDD-001: Autenticación y MFA
- SDD-002: Multi-tenant (CUIT, aislamiento)
- SDD-003: Modelo de tickets
- SDD-004: Canales de entrada
- ...

