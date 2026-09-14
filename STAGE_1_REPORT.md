# Reporte de Etapa 1 - Mesa de Ayuda IT

**Fecha:** 2026-09-14  
**Estado:** ✅ Estructura Base Completa - Listo para Etapa 2  
**Repositorio:** `/home/user/Helpdesk-IT`

---

## Resumen Ejecutivo

Se ha creado la estructura base del proyecto **Mesa de Ayuda IT**, una plataforma integral de gestión de tickets multi-tenant para equipos de soporte IT. 

**Etapa 1 completada:**
- ✅ Arquitectura definida y documentada
- ✅ Modelos SQLAlchemy con aislamiento multi-tenant
- ✅ Servicio de autenticación (Argon2id + TOTP + Recovery codes)
- ✅ API FastAPI con endpoints de login y MFA
- ✅ Validación de datos con Pydantic
- ✅ Decisiones arquitectónicas documentadas

---

## Estructura de Directorios

```
/home/user/Helpdesk-IT/
├── README.md                          # Visión general del proyecto
├── STAGE_1_REPORT.md                  # Este archivo
├── .env.example                       # Template de variables de entorno
├── .gitignore                         # Configuración de git
│
└── helpdesk/                          # Módulo principal
    ├── CLAUDE.md                      # Guía de desarrollo
    ├── DECISIONS.md                   # Decisiones arquitectónicas
    ├── pyproject.toml                 # Dependencias (Poetry)
    │
    └── src/
        ├── __init__.py
        ├── api/                       # Capa de API HTTP
        │   ├── main.py                # Inicialización FastAPI
        │   └── routes/
        │       ├── auth.py            # Endpoints de autenticación
        │       └── (tickets.py, companies.py - futuro)
        │
        ├── models/                    # Modelos SQLAlchemy (BD)
        │   ├── company.py             # Empresas (tenants)
        │   ├── user.py                # Usuarios
        │   ├── membership.py          # Asignación usuario→empresa
        │   ├── mfa_session.py         # Sesiones TOTP
        │   └── session.py             # Sesiones de autenticación
        │
        ├── schemas/                   # Esquemas Pydantic (validación)
        │   └── auth.py                # Requests/responses de login
        │
        └── services/                  # Lógica de negocio
            └── auth_service.py        # Autenticación, TOTP, CUIT

└── docs/                              # Documentación (futuro)
    ├── sdd/                           # Especificaciones técnicas
    └── diagrams/                      # Diagramas de arquitectura
```

---

## Componentes Implementados

### 1. **Modelos de Base de Datos** (SQLAlchemy)

#### Company (Tenant)
```python
- id: UUID (PK)
- cuit: str (UNIQUE) - Normalizado, sin separadores
- name: str
- address, phone, email: str
- status: enum (active, suspended, inactive)
- contract_metadata: JSON
- created_at, updated_at: timestamp
```

#### User
```python
- id: UUID (PK)
- company_id: UUID (FK) - Aislamiento multi-tenant
- email: str (UNIQUE per company)
- username: str (UNIQUE per company)
- password_hash: str (Argon2id)
- full_name, phone: str
- is_active: bool
- mfa_enabled: bool
- password_changed_at, last_login_at: timestamp
```

#### Membership (Usuario ↔ Empresa)
```python
- id: UUID (PK)
- user_id, company_id: UUID (FK)
- role: enum (external_requester, company_admin, it_agent, it_supervisor, system_admin)
- explicit_permissions: JSON
- is_active: bool
```

#### MFASession (TOTP)
```python
- id: UUID (PK)
- user_id: UUID (FK)
- encrypted_secret: str (Fernet - secreto TOTP cifrado)
- recovery_codes: JSON (SHA-256 hasheados)
- verified_at: timestamp (NULL si aún en enrolamiento)
- enrollment_started_at, enrollment_expires_at: timestamp
```

#### Session (Sesión HTTP)
```python
- id: UUID (PK)
- user_id, company_id: UUID (FK)
- token_hash: str (SHA-256 del token, UNIQUE)
- user_agent, ip_address: str
- expires_at, last_activity_at: timestamp
```

### 2. **Servicio de Autenticación** (`src/services/auth_service.py`)

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `hash_password()` | Argon2id hashing |
| `verify_password()` | Verificación segura de contraseña |
| `generate_totp_secret()` | Crea nuevo secreto TOTP |
| `encrypt_totp_secret()` | Cifra secreto con Fernet |
| `verify_totp()` | Valida código TOTP (6 dígitos) |
| `generate_recovery_codes()` | Crea 10 códigos de recuperación |
| `normalize_cuit()` | Normaliza CUIT (valida formato) |
| `validate_cuit_checksum()` | Valida dígito verificador |

**Seguridad:**
- Contraseñas: Argon2id (passlib)
- MFA Secret: Fernet (AES + HMAC)
- Recovery codes: SHA-256 (one-way, one-use)
- Session tokens: UUID opaco + SHA-256 en BD

### 3. **API REST** (FastAPI)

**Endpoints Etapa 1:**

```
POST /api/v1/auth/login
  Request: { cuit, username, password }
  Response: { user_id, username, email, mfa_enabled, mfa_enrollment_pending, active_company_id }

POST /api/v1/auth/mfa/enroll/start
  Response: { secret, provisioning_uri, recovery_codes }

POST /api/v1/auth/mfa/enroll/verify
  Request: { code (TOTP), recovery_codes_acknowledged }
  Response: { status: "enrolled", mfa_enabled: true }

POST /api/v1/auth/mfa/verify
  Request: { code (TOTP) }
  Response: { status: "authenticated", token }

POST /api/v1/auth/mfa/recovery
  Request: { recovery_code }
  Response: { status: "authenticated", token }

POST /api/v1/auth/logout
  Response: { status: "logged_out" }

GET /api/v1/auth/me
  Response: { id, username, email, mfa_enabled, active_company }
```

**Documentación automática:** http://localhost:8000/api/docs (Swagger)

### 4. **Validación de Datos** (Pydantic)

```
LoginRequest
  - cuit: str
  - username: str (3-100 chars)
  - password: str (min 8 chars)

MFAEnrollmentVerify
  - code: str (regex: 6 dígitos)
  - recovery_codes_acknowledged: bool

LoginResponse
  - user_id: UUID
  - username: str
  - email: str
  - mfa_enabled: bool
  - mfa_enrollment_pending: bool
  - active_company_id: UUID | None
```

### 5. **Documentación**

| Documento | Contenido |
|-----------|-----------|
| `CLAUDE.md` | Guía de desarrollo, patrones, setup |
| `DECISIONS.md` | Stack, modelos, criptografía, plan de Etapas |
| `README.md` | Visión, características, inicio rápido |
| `.env.example` | Variables de entorno requeridas |

---

## Decisiones Clave Tomadas

### Stack Seleccionado
- **Backend:** FastAPI (async, validación integrada)
- **ORM:** SQLAlchemy 2.0 (migraciones con Alembic)
- **BD:** PostgreSQL (multi-tenant RLS futuro)
- **Autenticación:** TOTP + Sessions
- **Hashing:** Argon2id (contraseñas), Fernet (MFA secret)

### Aislamiento Multi-Tenant
- **CUIT:** Único en `companies`, normalizado sin separadores
- **Usuarios:** Email/username únicos PER company (no globales)
- **Sesiones:** Contienen user_id + company_id, validadas en cada request
- **Validación:** API valida que tenant_id viene de sesión, NO del cliente

### Criptografía
- **Contraseñas:** Argon2id (passlib, parámetros por defecto)
- **MFA Secret:** Fernet (symmetric, auto HMAC)
- **Recovery Codes:** SHA-256 (one-way, one-use tracking)
- **Session Tokens:** UUID opaco, hash en BD (no almacenar en plain)

---

## Cómo Iniciar

### 1. Configuración Inicial

```bash
cd /home/user/Helpdesk-IT/helpdesk

# Copiar variables de entorno
cp ../.env.example .env

# Instalar dependencias
poetry install

# Generar clave MFA (una sola vez)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copiar salida a HELPDESK_MFA_ENCRYPTION_KEY en .env
```

### 2. Base de Datos (Próximo)

En Etapa 2 se crearán migraciones Alembic:
```bash
poetry run alembic upgrade head
```

### 3. Ejecutar Servidor

```bash
poetry run uvicorn src.api.main:app --reload
```

Disponible en:
- API: http://localhost:8000
- Docs: http://localhost:8000/api/docs
- Health: http://localhost:8000/health

---

## Próximos Pasos - Etapa 2

### Prioridades Inmediatas

1. **Migraciones Alembic**
   - Crear inicial con todos los modelos
   - Unique constraints por (company_id, email) y (company_id, username)
   - Índices para performance

2. **Endpoints Completos**
   - Validación de sesión en cada request
   - Login completo (validación BD)
   - MFA enrolamiento y verificación (integración BD)
   - Logout (invalidar sesión)

3. **Tests Unitarios**
   - auth_service: hash, TOTP, recovery codes, CUIT
   - Cobertura mínima 80%
   - Tests de concurrencia (dos usuarios tomando caso)

4. **Portal Web MVP**
   - 3 pasos: Categoría → Detalle → Contacto
   - Crear ticket (guardar en BD)
   - Mis solicitudes (listar con filtros)
   - Aprobación de costos (simple)

5. **Consola de Casos**
   - Listar tickets (tabla con filtros)
   - Detalle (timeline, asignación, estado)
   - Cambiar estado, asignar, registrar horas

---

## Criterios de Aceptación - Etapa 1

✅ **Completados:**
- Estructura de proyecto clara y documentada
- Modelos con aislamiento multi-tenant (CUIT)
- Servicio de autenticación robusto (Argon2id + TOTP)
- API con endpoints de login (estructura)
- Validación con Pydantic
- DECISIONS.md con decisiones clave
- CLAUDE.md con guía de desarrollo

❌ **NO incluido (Etapa 2):**
- Migraciones Alembic
- Persistencia real en BD
- Tests unitarios
- Portal web
- Consola de casos

---

## Notas Importantes

### Seguridad
- **Nunca** confiar en `tenant_id` del navegador
- Sesión debe contener `company_id` validado en BD
- Validar permisos en cada endpoint
- Rate limiting en login/MFA (implementar Etapa 2)

### Performance
- Índices en: CUIT, email/username (per company), user_id, token_hash
- Queries optimizadas para no cruzar tenants
- RLS en PostgreSQL (futuro, Etapa 3+)

### Configuración
- `.env` generada del `.env.example`
- `poetry.lock` versionado
- `pyproject.toml` es fuente de verdad

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `helpdesk/src/services/auth_service.py` | Core de autenticación (criptografía, TOTP) |
| `helpdesk/src/models/*.py` | Esquema de BD (SQLAlchemy) |
| `helpdesk/src/api/routes/auth.py` | Endpoints HTTP (placeholder) |
| `helpdesk/DECISIONS.md` | Decisiones y plan de Etapas |
| `helpdesk/CLAUDE.md` | Guía para desarrolladores |

---

## Commit Inicial

```
feat: etapa 1 - base de mesa de ayuda IT

- Modelos SQLAlchemy: Company, User, Membership, MFASession, Session
- Servicio de autenticación con Argon2id + TOTP + Códigos de recuperación
- Endpoints FastAPI: login, MFA enrollment, MFA verification
- Aislamiento multi-tenant por CUIT
- Documentación: CLAUDE.md, DECISIONS.md
```

**Hash:** `ff3ae3f` (primer commit en master)

---

## Contacto y Dudas

Para cambios arquitectónicos, consultar:
1. **DECISIONS.md** - Decisiones pasadas y rationale
2. **CLAUDE.md** - Patrones de desarrollo
3. **PROMPT_PROYECTO_MESA_DE_AYUDA.md** - Especificación funcional

Próximo revisor: Code Review en Etapa 2 (endpoints + tests)

