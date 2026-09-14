# Mesa de Ayuda IT - Plataforma de Tickets Multi-Tenant

Sistema integral de gestión de tickets para equipos de soporte IT que atienden múltiples empresas externas.

## Características Principales

- ✅ **Multi-tenant seguro:** Aislamiento por CUIT con validación en BD y API
- ✅ **Autenticación robusta:** Login + MFA TOTP obligatorio
- ✅ **Gestión de tickets:** Estados, prioridades, asignación, SLA
- ✅ **Canales de entrada:** Portal web, Email, WhatsApp, Telefonía (futuro)
- ✅ **Aprobación de costos:** Flujo comercial integrado
- ✅ **Registro de horas:** Imputación de tiempo y facturación
- ✅ **Reportes y auditoría:** Dashboard, exportación, trazabilidad

## Etapas de Implementación

1. **Etapa 1 (Actual):** Base - Autenticación + Multi-tenant
2. **Etapa 2:** MVP operativo - Portal web + Consola de casos
3. **Etapa 3:** Canales - Email + WhatsApp
4. **Etapa 4:** Telefonía - IVR + Bot
5. **Etapa 5:** Operación - SLA, reportes, despliegue

## Requisitos

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Docker Compose (para desarrollo)

## Inicio Rápido

### Backend

```bash
cd helpdesk
poetry install
poetry run alembic upgrade head
poetry run uvicorn src.api.main:app --reload
```

### Frontend

```bash
cd helpdesk/frontend
npm install
npm run dev
```

## Documentación

- [CLAUDE.md](./helpdesk/CLAUDE.md) - Guía de desarrollo
- [DECISIONS.md](./helpdesk/DECISIONS.md) - Decisiones arquitectónicas
- [docs/sdd/](./docs/sdd/) - Especificaciones técnicas

