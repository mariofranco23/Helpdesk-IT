# Decisiones Arquitectónicas - Mesa de Ayuda IT

**Fecha:** 2026-09-14  
**Etapa:** 1 (Base - Autenticación + Multi-tenant)

## Stack Seleccionado

| Componente | Selección | Rationale |
|-----------|-----------|-----------|
| Backend | FastAPI | Async, validación Pydantic integrada, documentación automática |
| ORM | SQLAlchemy 2.0+ | Migraciones con Alembic, relaciones, soporte para RLS futuro |
| BD | PostgreSQL | Multi-tenant RLS, UUID nativo, JSON, índices avanzados |
| Frontend | React 18 + TypeScript | Ecosistema maduro, componentes reutilizables |
| Autenticación | TOTP + Sessions | MFA requerido por spec, códigos de recuperación |
| Contraseñas | Argon2id | Hash seguro, algoritmo moderno con buenas defenses |
| MFA Secret | Fernet (cryptography) | Cifrado simétrico, sin necesidad de gestionar múltiples claves |
| Cache/Queue | Redis | Sessions, rate limiting, cola de trabajos (Etapas 2+) |
| Storage | S3-compatible | Archivos adjuntos, separación por tenant |

## Aislamiento Multi-Tenant (Crítico)

### Principio Fundamental
**Nunca confiar en tenant_id del navegador.**

### Implementación Etapa 1
- ✅ **CUIT:** Campo `cuit` único en tabla `companies`, normalizado (sin separadores)
- ✅ **Users:** Tabla `users` con FK a `companies` - email/username únicos POR company
- ✅ **Memberships:** Tabla de unión explícita (user → company, con rol)
- ✅ **Sessions:** Token contiene user_id + company_id, validado en cada request
- ✅ **API:** Validación en cada endpoint que tenant_id viene de sesión válida, no de cliente

### Defensa en Profundidad (Futuro)
- RLS (Row-Level Security) en PostgreSQL
- Índices compuestos para evitar scans globales
- Auditoría de accesos entre tenants

## Modelos Iniciales (Etapa 1)

### companies
```sql
id UUID PRIMARY KEY
cuit VARCHAR(15) UNIQUE NOT NULL  -- Normalizado, sin separadores
name VARCHAR(255) NOT NULL
address VARCHAR(512)
phone VARCHAR(20)
email VARCHAR(255)
status ENUM (active, suspended, inactive)
contract_metadata JSONB -- SLA, horarios, volumen, etc.
created_at TIMESTAMP
updated_at TIMESTAMP
```

### users
```sql
id UUID PRIMARY KEY
company_id UUID NOT NULL (FK companies)
email VARCHAR(255) NOT NULL  -- Único POR company
username VARCHAR(100) NOT NULL  -- Único POR company
password_hash VARCHAR(255) NOT NULL
full_name VARCHAR(255)
phone VARCHAR(20)
is_active BOOLEAN DEFAULT true
mfa_enabled BOOLEAN DEFAULT false
password_changed_at TIMESTAMP
last_login_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP

UNIQUE CONSTRAINT (company_id, email)
UNIQUE CONSTRAINT (company_id, username)
```

### memberships
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK users)
company_id UUID NOT NULL (FK companies)
role ENUM (external_requester, company_admin, it_agent, it_supervisor, system_admin)
explicit_permissions JSONB -- Permisos adicionales
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP

UNIQUE CONSTRAINT (user_id, company_id)
```

### mfa_sessions
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK users)
encrypted_secret VARCHAR(500) NOT NULL -- Secreto TOTP cifrado
recovery_codes JSONB NOT NULL -- [{"code_hash": "...", "used_at": null}...]
verified_at TIMESTAMP -- NULL si aún en enrolamiento
enrollment_started_at TIMESTAMP
enrollment_expires_at TIMESTAMP -- Timeout de enrolamiento
created_at TIMESTAMP
updated_at TIMESTAMP
```

### sessions
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK users)
company_id UUID NOT NULL (FK companies) -- Contexto activo
token_hash VARCHAR(255) UNIQUE NOT NULL
user_agent VARCHAR(512)
ip_address VARCHAR(45) -- IPv4 o IPv6
expires_at TIMESTAMP NOT NULL
created_at TIMESTAMP
last_activity_at TIMESTAMP
```

## Criptografía y Seguridad - Etapa 1

### Contraseñas
- **Algoritmo:** Argon2id via `passlib`
- **Config:** Parámetros por defecto de passlib (time_cost=2, memory_cost=65536)
- **Validación:** Min 8 caracteres (frontend + backend)
- **Hash Storage:** Nunca en plain text, siempre hasheado

### MFA TOTP
- **Algoritmo:** RFC 6238 (Time-based OTP)
- **Librería:** `pyotp` (librería estándar)
- **Longitud:** 6 dígitos
- **Ventana:** ±1 período de 30s para tolerancia de reloj

### Secreto TOTP Storage
- **Cifrado:** Fernet (cryptography) - AES-128-CBC + HMAC-SHA256
- **Clave:** Variable de entorno `HELPDESK_MFA_ENCRYPTION_KEY` (32 bytes base64)
- **Demo:** En dev, generar clave automáticamente (NO usar en prod)

### Códigos de Recuperación
- **Formato:** 12 caracteres hexadecimales (UUID truncado)
- **Cantidad:** 10 códigos por usuario
- **Storage:** Hasheados con SHA-256 (one-way)
- **Validación:** Verificar hash, marcar como usado en JSONB

### Sesiones de Usuario
- **Token:** UUID opaco (token_hash almacenado en BD)
- **Cookie:** httponly, secure (https en prod), samesite=strict
- **Duración:** 8 horas (configurable)
- **Validación:** Verificar token_hash en BD, no expiración, no invalidación previa

### Rate Limiting (Etapa 2+)
- Login: 5 intentos por CUIT/username en 15 minutos
- MFA: 3 intentos por sesión temporal en 10 minutos
- Recovery code: Marcar como usado inmediatamente

## Próximos Pasos - Orden de Implementación

### Etapa 1 (Actual)
1. ✅ Modelos SQLAlchemy
2. ✅ Migraciones Alembic iniciales
3. ⏳ DB connection y pooling
4. ⏳ Endpoints de login + MFA (completos)
5. ⏳ Tests unitarios (auth_service, CUIT validation)
6. ⏳ Documentación API (OpenAPI)

### Etapa 2 (MVP Operativo)
- Portal web en 3 pasos (crear ticket)
- Consola de casos (listar, asignar, cambiar estado)
- Modelo Ticket + Message
- Flujo de aprobación de costos (básico)
- Registro de horas (imputación de tiempo)
- Notificaciones locales (dentro de app)
- Creación manual de llamadas

### Etapa 3 (Canales)
- Adaptador Email (IMAP/SMTP o API)
- Adaptador WhatsApp Business
- Correlación de conversaciones
- Ingestión idempotente (webhooks)

### Etapa 4 (Telefonía)
- Adaptador PBX (Asterisk/SIP o telefonía comercial)
- IVR y transfer automático
- Grabación/transcripción opcional
- Bot con IA (configurable)

### Etapa 5 (Operación)
- SLA (objetivos de tiempo, calendarios, alertas)
- Dashboard (métricas, gráficos)
- Reportes de horas (exportación)
- Auditoría (quién hizo qué, cuándo)
- Backups y restauración
- Guía de despliegue

## Decisiones Reversibles / A Confirmar

- **Horario de trabajo:** América/Argentina/Córdoba (hardcodeado, configurable en Etapa 2)
- **Nombre comercial:** "Mesa de Ayuda IT" (genérico, para demos)
- **Dominio de email:** helpdesk.local (configurable)
- **Duración de sesión:** 8 horas (configurable en env)
- **Cantidad de recovery codes:** 10 (configurable)

## Referencias y Especificaciones

- **PROMPT_PROYECTO_MESA_DE_AYUDA.md** - Especificación funcional completa
- **PostgreSQL Docs** - RLS, performance, backups
- **OWASP Top 10** - Validación, auth, injection, CSRF
- **RFC 6238** - TOTP specification
- **Fernet** - Encrypted serialization format

