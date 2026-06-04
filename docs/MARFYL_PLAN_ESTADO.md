# Plan de Migración MARFYL — Estado y Handoff

> **Última actualización:** 2026-06-03
> **Autor:** Documentation Agent (docs-agent)
> **Objetivo:** Documento de handoff para retomar la migración de mocks → backend real sin perder contexto.

---

## Resumen ejecutivo

MARFYL es una plataforma SaaS multi-tenant para gestión de negocios (POS, facturación, inventario, fiscal, conciertos) construida con **Next.js 14 (frontend)** + **NestJS + Prisma (backend)** + **PostgreSQL**.

El proyecto está en proceso de **migración de mocks locales a llamadas reales al API backend**. El módulo **fiscal** (perfil, dashboard, calendario SENIAT, compliance hub, libros de ventas/compras, retenciones, predeclaración) ha sido migrado exitosamente con 22 métodos en `fiscalService` y una infraestructura de fallback robusta (patrón P2).

El módulo **concierto** también fue migrado (Opción C) con mock como fallback opcional bajo flag `NEXT_PUBLIC_CONCERT_MOCK`.

**Estado actual:** El módulo fiscal está completamente conectado. Quedan 8 módulos restantes por migrar (dashboard, cierre-caja, tasks, invitations, tenants, notifications, expense-categories, backup). Fase 2 (tests) está pendiente.

---

## Contexto del proyecto

### Stack

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | Next.js 14, React 18, TypeScript 5.3, Tailwind CSS, Zustand | 3003 |
| Backend | NestJS 10, Prisma 5.10, PostgreSQL | 3001 |
| Base de datos | PostgreSQL (Docker) | 5433 |
| ORM | Prisma Client | — |

### Estructura de carpetas relevante

```
Marfyl-project/
├── marfyl-frontend/
│   ├── src/
│   │   ├── app/(dashboard)/     # Páginas Next.js (App Router)
│   │   │   ├── fiscal/          # Módulo fiscal (MIGRADO)
│   │   │   ├── concierto/       # Módulo conciertos (MIGRADO)
│   │   │   ├── pos/             # Punto de venta
│   │   │   ├── invoices/        # Facturas
│   │   │   ├── expenses/        # Gastos
│   │   │   ├── products/        # Productos
│   │   │   ├── customers/       # Clientes
│   │   │   ├── suppliers/       # Proveedores
│   │   │   ├── inventory/       # Inventario
│   │   │   ├── credits/         # Créditos
│   │   │   ├── cierre-caja/     # Cierre de caja
│   │   │   ├── settings/        # Configuración
│   │   │   ├── assistant/       # Asistente IA
│   │   │   └── ...
│   │   ├── lib/api/             # Servicios frontend (fiscal.ts, concert.ts, etc.)
│   │   ├── lib/fiscal/          # Lógica fiscal (mapper, mock, types)
│   │   ├── lib/concert/         # Lógica conciertos (mock-data, feature, types)
│   │   ├── hooks/               # Hooks React (useFiscalCalendarHub, etc.)
│   │   ├── components/fiscal/   # Componentes UI fiscal
│   │   ├── types/               # Tipos compartidos
│   │   └── store/               # Zustand stores
│   └── docs/                    # Documentación
├── marfyl-backend/
│   ├── src/modules/             # Módulos NestJS
│   │   ├── fiscal/              # Módulo fiscal (completo)
│   │   ├── dashboard/           # Dashboard
│   │   ├── concierto/           # Conciertos
│   │   ├── cierre-caja/         # Cierre de caja
│   │   ├── tasks/               # Tareas
│   │   ├── invitations/         # Invitaciones
│   │   ├── tenants/             # Organizaciones
│   │   ├── notifications/       # Notificaciones
│   │   ├── expense-categories/  # Categorías de gastos
│   │   ├── backup/              # Backup
│   │   └── ...
│   └── prisma/
│       ├── schema.prisma        # Esquema de base de datos
│       ├── seed.ts              # Seed producción
│       └── seed-dev.ts          # Seed desarrollo (faker)
```

### Multi-tenant

- Cada request lleva header `x-tenant-id` con el `organizationId` del usuario.
- El interceptor en `client.ts` inyecta automáticamente el `organizationId` desde Zustand store.
- Guards: `JwtAuthGuard` → `OrganizationGuard` → módulo específico.
- Rutas públicas (`/auth/*`) y `/tenants/organizations-all` excluidas del header.

### Servicios API frontend

Archivos en `src/lib/api/`:

| Archivo | Service | Estado |
|---------|---------|--------|
| `fiscal.ts` | `fiscalService` (22 métodos) | ✅ MIGRADO |
| `concert.ts` | `concertService` (11 métodos) | ✅ MIGRADO |
| `auth.ts` | `authService` (5 métodos) | ✅ Conectado |
| `invoices.ts` | `invoiceService` (6 métodos) | ✅ Conectado |
| `products.ts` | `productService` (8 métodos) | ✅ Conectado |
| `customers.ts` | `customerService` (5 métodos) | ✅ Conectado |
| `suppliers.ts` | `supplierService` (5 métodos) | ✅ Conectado |
| `expenses.ts` | `expenseService` (9 métodos) | ✅ Conectado |
| `credits.ts` | `creditService` (6 métodos) | ✅ Conectado |
| `inventory.ts` | `inventoryService` (3 métodos) | ✅ Conectado |
| `assistant.ts` | `sendAssistantMessage` | ✅ Conectado |
| `client.ts` | `apiClient` (axios instance) | — Core |
| `get-error-message.ts` | `getApiErrorMessage` | — Utility |
| `index.ts` | Re-exports | — Barrel |

### Backend NestJS + Prisma

El backend tiene **14+ módulos** con controllers, services y DTOs. El módulo fiscal es el más complejo con 12+ sub-servicios:

```
fiscal/
├── fiscal.controller.ts           # 22 endpoints
├── fiscal.service.ts              # Lógica principal
├── fiscal-calendar.service.ts     # Calendario SENIAT
├── fiscal-compliance-hub.service.ts # Hub de cumplimiento
├── fiscal-validation.service.ts   # Validación preventiva
├── fiscal-events.service.ts       # Eventos de dominio
├── fiscal-audit.service.ts        # Auditoría
├── fiscal-norms.service.ts        # Normas SENIAT
├── fiscal-engine.service.ts       # Motor fiscal
├── fiscal-backfill.service.ts     # Backfill libros
├── fiscal-control-number.service.ts # Números de control
├── fiscal-rule-engine.service.ts  # Motor de reglas
├── fiscal-scheduler.service.ts    # Tareas programadas
├── retencion-pdf.service.ts       # PDFs de retención
├── helpers/                       # Helpers (tax-calculator, validators, etc.)
└── dto/                           # DTOs
```

---

## Convenciones establecidas

### 1. Servicios frontend (`fiscal.ts` como referencia)

```typescript
// Patrón estándar de servicio
import { apiClient } from './client';

export const fiscalService = {
  /** Descripción del método */
  methodName(params?: ParamType): Promise<ResponseType> {
    return apiClient
      .get<ResponseType>('/endpoint', { params })
      .then((res) => res.data);
  },
};
```

**Reglas:**
- Cada servicio es un objeto exportado con métodos que retornan `Promise<T>`.
- Todos los métodos usan `apiClient` (nunca `axios` directamente).
- Los tipos de request/response se definen en el mismo archivo del servicio.
- Los enums se definen como `type` (no `enum`) para tree-shaking.
- Cada método tiene JSDoc con descripción.

### 2. Patrón P2 (fallback a mock en error de red)

```typescript
// Ejemplo: useFiscalCalendarHub.ts
try {
  const hubRes = await fiscalService.getComplianceHub({ year, month });
  const vm = buildHubFromComplianceApi(hubRes, { backendOnline: true, ... });
  setData(vm);
  return;
} catch {
  // Fallback a endpoints legacy si la migración aún no está aplicada
}

try {
  const [calRes, profileRes] = await Promise.all([...]);
  // ...
} catch {
  backendOnline = false;
  const mock = mockHubViewModel(year, month, true);
  setData(mock);
  setError('Sin conexión al backend. Mostrando vista demo...');
}
```

**Reglas:**
- Intentar endpoint nuevo primero.
- Si falla, intentar endpoints legacy (si existen).
- Si todo falla (error de red), usar mock local.
- Marcar `backendOnline = false` y mostrar hint al usuario.
- El mock **nunca** es la ruta primaria.

### 3. Patrón P1 (preservar comportamiento legacy)

- No romper funcionalidad existente al migrar.
- Mantener compatibilidad con datos existentes en BD.
- Si un endpoint legacy sigue siendo usado por otras partes, no eliminarlo.

### 4. Multi-tenant

```typescript
// client.ts - Request interceptor
config.headers['x-tenant-id'] = selectedOrganizationId.toString();
```

- Header `x-tenant-id` inyectado automáticamente por el interceptor.
- Excluido para rutas públicas (`/auth/*`) y `/tenants/organizations-all`.
- Guard `OrganizationGuard` en backend valida el tenant.
- El `selectedOrganizationId` viene de Zustand store (`useAuthStore`).

### 5. CORS

- Backend configura CORS para permitir requests desde el frontend.
- `withCredentials: true` en `apiClient` para cookies de sesión.

### 6. Manejo de errores (`getApiErrorMessage`)

```typescript
// get-error-message.ts
export function getApiErrorMessage(err: unknown, fallback = 'Error al cargar datos'): string {
  if (isNetworkFailure(err)) {
    return 'No hay conexión con el API. Inicie el backend (puerto 3001)...';
  }
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    // ...
  }
}
```

**Reglas:**
- Usar `getApiErrorMessage()` para mensajes al usuario.
- Detectar error de red vs error de backend.
- Mensajes en español.
- Fallback genérico si no se puede extraer mensaje.

### 7. Fiscal preview (bypass de auth para dev)

```typescript
// fiscal-preview.ts
export function isFiscalPreviewMode(): boolean {
  if (process.env.NEXT_PUBLIC_FISCAL_PREVIEW === 'true') return true;
  // ...
  return process.env.NODE_ENV === 'development';
}

export const FISCAL_PREVIEW_TOKEN = 'dev-preview-token';
```

- Solo en desarrollo.
- Seed automático de auth con token estático.
- No afecta producción.
- Respeta flag de logout explícito (`EXPLICIT_LOGOUT_FLAG`).

### 8. Tests

- **Backend:** Jest + supertest (configurado, tests pendientes).
- **Frontend:** Vitest + RTL (pendiente de instalar).
- **E2E:** Playwright (pendiente).

---

## Tareas completadas

### Opción C — Migración de mocks de concierto

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| TAREA-001 | Crear `concertService` en `src/lib/api/concert.ts` con 11 métodos (4 públicos + 7 admin) | ✅ |
| TAREA-002 | Crear `feature.ts` con flag `CONCERT_MOCK_ENABLED` y `CONCERT_DEFAULT_SLUG` | ✅ |
| TAREA-003 | Crear `mock-data.ts` con datos demo completos (evento, órdenes, hold, tickets) | ✅ |
| TAREA-004 | Migrar `evento/[slug]/page.tsx` — carga de evento, hold y checkout | ✅ |
| TAREA-005 | Migrar `evento/[slug]/entrada/[orderToken]/page.tsx` — consulta de orden con polling | ✅ |
| TAREA-006 | Migrar `(dashboard)/concierto/page.tsx` — overview admin | ✅ |
| TAREA-007 | Migrar `(dashboard)/concierto/ordenes/page.tsx` — listado y confirmación | ✅ |
| TAREA-008 | Migrar `(dashboard)/concierto/mapa/page.tsx` — plano del salón | ✅ |
| TAREA-009 | Migrar `(dashboard)/concierto/escaner/page.tsx` — escáner QR con rama demo | ✅ |
| TAREA-010 | Documentar en `docs/CONCERT_MOCKS.md` | ✅ |

**Critic verdict:** Confianza 0.98. Aprobado.

### Fix logout fiscal preview

| Parte | Descripción | Estado |
|-------|-------------|--------|
| A | Detectar logout explícito vs recarga de página | ✅ |
| B | Flag `EXPLICIT_LOGOUT_FLAG` en sessionStorage + cookie | ✅ |
| C | `markExplicitLogout()` y `clearExplicitLogout()` | ✅ |
| D | `seedFiscalPreviewAuth()` respeta el flag de logout | ✅ |
| E | `isExplicitLogout()` consultado antes de seed automático | ✅ |

### Plan de conexión de 9 módulos restantes — Módulo fiscal (FASE 1.1)

#### TAREA-F1-1.1: fiscalService Profile+Dashboard

- **Archivos tocados:** `src/lib/api/fiscal.ts` (Profile + Dashboard types + methods)
- **Métodos creados:** `getProfile()`, `upsertProfile()`, `getDashboard()`
- **Tipos creados:** `FiscalProfileResponse`, `FiscalDashboardData`, `FiscalProfileData`, etc.
- **Estado:** ✅ Completado

#### TAREA-F1-1.2: fiscalService Calendario+Compliance

- **Archivos tocados:** `src/lib/api/fiscal.ts` (Calendar + Compliance types + methods)
- **Métodos creados:** `listCalendar()`, `syncCalendario()`, `getComplianceHub()`, `validateOperation()`, `emitEvent()`, `listAudit()`, `listNorms()`, `syncNorms()`
- **Tipos creados:** `CalendarApiResponse`, `ComplianceHubApiResponse`, `FiscalCalendarioSyncResult`, etc.
- **Estado:** ✅ Completado

#### TAREA-F1-1.3: fiscalService Libros+Retenciones+Predeclaración

- **Archivos tocados:** `src/lib/api/fiscal.ts` (Libros + Retenciones + Predeclaración types + methods)
- **Métodos creados:** `listLibroVentas()`, `exportLibroVentasXlsx()`, `exportLibroVentasTxt()`, `listLibroCompras()`, `backfillLibroVentas()`, `listRetenciones()`, `exportRetencionesTxt()`, `getRetencionPdf()`, `getPredeclaracion()`, `closePeriod()`, `cargaRapidaCompra()`
- **Tipos creados:** `LibroVentasResponse`, `LibroComprasResponse`, `RetencionIva`, `PredeclaracionData`, `ClosePeriodResponse`, etc.
- **Estado:** ✅ Completado

#### TAREA-F1-1.4.a: Refactor páginas simples

- **Archivos tocados:**
  - `src/app/(dashboard)/fiscal/page.tsx` — Dashboard fiscal
  - `src/app/(dashboard)/fiscal/perfil/page.tsx` — Perfil fiscal
  - `src/app/(dashboard)/fiscal/libro-ventas/page.tsx` — Libro de ventas
  - `src/app/(dashboard)/fiscal/libro-compras/page.tsx` — Libro de compras
- **Cambio:** Cada página ahora usa `fiscalService` en vez de llamadas directas o mocks.
- **Estado:** ✅ Completado

#### TAREA-F1-1.4.b: Refactor retenciones+libros

- **Archivos tocados:**
  - `src/app/(dashboard)/fiscal/retenciones/page.tsx` — Conectado a `fiscalService.listRetenciones()`, `exportRetencionesTxt()`, `getRetencionPdf()`
  - `src/components/fiscal/libro-fiscal-page.tsx` — Componente reutilizable para libros (ventas/compras)
- **Estado:** ✅ Completado

#### TAREA-F1-1.4.c: Refactor useFiscalCalendarHub

- **Archivos tocados:** `src/hooks/useFiscalCalendarHub.ts`
- **Patrón implementado:**
  1. Intentar `getComplianceHub()` (endpoint nuevo)
  2. Si falla, intentar `listCalendar()` + `getProfile()` (endpoints legacy)
  3. Si todo falla, usar `mockHubViewModel()` (fallback mock)
- **Archivos de soporte:**
  - `src/lib/fiscal/calendar-hub-mapper.ts` — `buildCalendarHubViewModel()`, `buildHubFromComplianceApi()`, `mapProfileToSnapshot()`
  - `src/lib/fiscal/calendar-hub-mock.ts` — `mockHubViewModel()`, `mockCalendarApi()`, `mockProfileUnconfigured()`
  - `src/types/fiscal-calendar-hub.ts` — Tipos del ViewModel
- **Estado:** ✅ Completado

#### TAREA-F1-1.5: Critic review global

- **Resultado:** Aprobado con 4 issues menores (ver Deuda Técnica).
- **Estado:** ✅ Completado

#### Fix type-check (7 errores AxiosHeaders)

- **Problema:** Errores de tipo al pasar `params` a endpoints con `AxiosHeaders`.
- **Solución:** Ajustar tipos en `fiscalService` para compatibilidad con Axios.
- **Estado:** ✅ Completado

---

## Tareas pendientes

### Módulos restantes (en orden de criticidad)

Cada módulo sigue el mismo patrón de migración:
1. Crear/verificar service en `src/lib/api/`
2. Conectar páginas existentes al service
3. Implementar fallback P2 si aplica
4. Validar con type-check

| ID | Módulo | Backend endpoints | Service frontend | Páginas | Prioridad |
|----|--------|-------------------|------------------|---------|-----------|
| TAREA-F1-2.x | **Dashboard** | `GET /dashboard/summary`, `GET /dashboard/pending-invoices`, `GET /dashboard/low-stock`, `GET /dashboard/health`, `GET /dashboard/diagnosis`, `GET /dashboard/strategy` | TBD ( crear `dashboardService`) | `(dashboard)/page.tsx` | Alta |
| TAREA-F1-3.x | **Cierre de caja** | Módulo `cierre-caja` con controller, service, scheduler | TBD | `cierre-caja/page.tsx` | Alta |
| TAREA-F1-4.x | **Tasks** | CRUD tasks con `tasks.controller.ts` | TBD (crear `taskService`) | (pendiente de identificar página) | Media |
| TAREA-F1-5.x | **Invitations** | `invitations.controller.ts` | TBD | (pendiente de identificar página) | Media |
| TAREA-F1-6.x | **Tenants/Organizations** | `tenants.controller.ts` | TBD | `settings/team/page.tsx` | Media |
| TAREA-F1-7.x | **Notifications** | `POST /notifications/fcm-token` | TBD | (pendiente de identificar página) | Baja |
| TAREA-F1-8.x | **Expense Categories** | `expense-categories.controller.ts` | TBD | (usado internamente por expenses) | Baja |
| TAREA-F1-9.x | **Backup** | `backup.controller.ts`, `backup-scheduler.service.ts` | TBD | (pendiente de identificar página) | Baja |

#### Detalle por módulo

##### TAREA-F1-2.x: Dashboard

**Backend endpoints disponibles:**
```
GET /dashboard/summary       → Resumen general (ventas, gastos, KPIs)
GET /dashboard/pending-invoices → Facturas pendientes
GET /dashboard/low-stock     → Productos con stock bajo
GET /dashboard/health        → Salud del negocio
GET /dashboard/diagnosis     → Diagnóstico operativo
GET /dashboard/strategy      → Estrategia y recomendaciones
```

**Service frontend a crear:** `src/lib/api/dashboard.ts`
```typescript
export const dashboardService = {
  getSummary(): Promise<DashboardSummary> { ... },
  getPendingInvoices(): Promise<PendingInvoice[]> { ... },
  getLowStock(): Promise<LowStockProduct[]> { ... },
  getHealth(): Promise<HealthStatus> { ... },
  getDiagnosis(): Promise<Diagnosis> { ... },
  getStrategy(): Promise<Strategy> { ... },
};
```

**Páginas a conectar:** `src/app/(dashboard)/page.tsx` (dashboard principal)

##### TAREA-F1-3.x: Cierre de caja

**Backend:** Módulo completo en `src/modules/cierre-caja/` con:
- `cierre-caja.controller.ts`
- `cierre-caja.service.ts`
- `cierre-caja-scheduler.service.ts`
- `cierre-caja-public.controller.ts`
- DTOs: `cierre-caja-z.dto.ts`, `apertura-caja.dto.ts`

**Service frontend a crear:** `src/lib/api/cierre-caja.ts`

**Páginas a conectar:** `src/app/(dashboard)/cierre-caja/page.tsx`

##### TAREA-F1-4.x: Tasks

**Backend:** `src/modules/tasks/` con:
- `tasks.controller.ts` (CRUD)
- `tasks.service.ts`
- DTOs: `create-task.dto.ts`, `update-task-status.dto.ts`

**Service frontend a crear:** `src/lib/api/tasks.ts`

**Páginas a identificar:** No hay ruta `/tasks/` en `(dashboard)/`. Verificar si existe como componente integrado en otra página.

##### TAREA-F1-5.x: Invitations

**Backend:** `src/modules/invitations/` con:
- `invitations.controller.ts`
- `invitations.service.ts`
- DTOs: `invite-member.dto.ts`, `provision-member.dto.ts`

**Service frontend a crear:** `src/lib/api/invitations.ts`

**Páginas a identificar:** Probablemente en `settings/team/page.tsx`.

##### TAREA-F1-6.x: Tenants/Organizations

**Backend:** `src/modules/tenants/` con:
- `tenants.controller.ts`
- `tenants.service.ts`
- DTOs: `create-organization.dto.ts`, `update-organization.dto.ts`, `update-member-role.dto.ts`

**Service frontend a crear:** `src/lib/api/tenants.ts`

**Páginas a conectar:** `src/app/(dashboard)/settings/team/page.tsx`

##### TAREA-F1-7.x: Notifications

**Backend:** `src/modules/notifications/` con:
- `notifications.controller.ts` (solo `POST /notifications/fcm-token`)
- `notifications.service.ts`
- `push-notification.service.ts` (FCM)

**Service frontend a crear:** `src/lib/api/notifications.ts`

**Páginas a identificar:** No hay ruta específica. Probablemente integrado en el layout o un servicio de fondo.

##### TAREA-F1-8.x: Expense Categories

**Backend:** `src/modules/expense-categories/` con:
- `expense-categories.controller.ts`
- `expense-categories.service.ts`

**Service frontend:** Ya existe integración en `expenses.ts` (las categorías se cargan como parte de expenses).

**Acción:** Verificar si necesita service dedicado o si la integración actual es suficiente.

##### TAREA-F1-9.x: Backup

**Backend:** `src/modules/backup/` con:
- `backup.controller.ts`
- `backup.service.ts`
- `backup-scheduler.service.ts`

**Service frontend a crear:** `src/lib/api/backup.ts`

**Páginas a identificar:** No hay ruta `/backup/` en `(dashboard)/`. Verificar si existe como función admin.

---

### Decisiones de producto pendientes

| ID | Decisión | Contexto | Estado |
|----|----------|----------|--------|
| DEC-001 | **`libro-ventas-panel.tsx` — ¿dead code?** | Archivo de 293 líneas en `src/components/fiscal/libro-ventas-panel.tsx`. No es importado por ninguna página (las páginas usan `libro-fiscal-page.tsx`). Puede ser remanente de una versión anterior. | **Requiere decisión:** ¿Eliminar o preservar? |
| DEC-002 | **TAREA-012 documentación rechazada** | `docs/CONCERT_MOCKS.md` fue creada pero el critic la marcó como "rechazada" en el contexto de la Opción C. Sin embargo, el archivo existe y es válido. | **Requiere clarificación:** ¿Se acepta la documentación o se descarta? |
| DEC-003 | **Mejora menor: try/catch en `exportTxt`/`openPdf`** | En `retenciones/page.tsx`, las funciones `exportTxt()` y `openPdf()` no tienen manejo de errores. Si el backend falla, el usuario no ve feedback. | **Requiere decisión:** ¿Agregar try/catch con toast de error? |
| DEC-004 | **Variable `err` muerta en `useNotificationFeed:146`** | Mencionada en deuda técnica pero el archivo `useNotificationFeed.ts` no existe en el codebase actual. Puede haber sido eliminada. | **Requiere verificación:** ¿Existe el archivo? |

---

### Fase 2: Tests

| Tipo | Framework | Tests planeados | Estado |
|------|-----------|-----------------|--------|
| Backend unit/integration | Jest + supertest | ~30 tests | ⏳ Pendiente (framework configurado) |
| Frontend unit | Vitest + React Testing Library | ~20 tests | ⏳ Pendiente (requiere instalar vitest + @testing-library/react) |
| E2E | Playwright | ~10 tests contra BD local con seed | ⏳ Pendiente (requiere instalar playwright) |

**Comandos para instalar:**
```bash
# Frontend tests
cd marfyl-frontend
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# E2E tests
pnpm add -D @playwright/test
npx playwright install
```

---

## Deuda técnica

### Issues menores del critic del módulo fiscal

| ID | Issue | Ubicación | Severidad | Acción sugerida |
|----|-------|-----------|-----------|-----------------|
| DT-001 | **`libro-ventas-panel.tsx` es dead code** | `src/components/fiscal/libro-ventas-panel.tsx` (293 líneas) | Media | Verificar si es importado. Si no, eliminar. |
| DT-002 | **Variable `err` muerta** | `useNotificationFeed:146` | Baja | Verificar si el archivo existe. Si fue eliminado, ignorar. |
| DT-003 | **Error handling manual en predeclaración** | `src/app/(dashboard)/fiscal/predeclaracion/page.tsx:53` | Baja | `(e as { response?: { data?: { message?: string } } })?.response?.data?.message` — usar `getApiErrorMessage()` en su lugar. |
| DT-004 | **Cast innecesario en useFiscalCalendarHub** | `src/hooks/useFiscalCalendarHub.ts:83` | Baja | `profileRes as Parameters<typeof mapProfileToSnapshot>[0]` — tipar correctamente el parámetro. |

### Notas sobre deuda técnica

- El archivo `useNotificationFeed.ts` **no existe** en el codebase actual. Puede haber sido eliminado en una iteración previa. Si DT-002 se refiere a un archivo que ya no existe, se puede cerrar.
- DT-003 es pre-existente (no introducido por la migración). Se puede corregir como mejora menor.
- DT-004 es un cast que se puede evitar tipando mejor `mapProfileToSnapshot`.

---

## Comandos útiles

### Desarrollo

```bash
# Frontend (Next.js en puerto 3003)
cd marfyl-frontend
pnpm dev

# Backend (NestJS en puerto 3001)
cd marfyl-backend
pnpm dev

# Type-check frontend
cd marfyl-frontend
pnpm type-check

# Type-check backend
cd marfyl-backend
pnpm type-check
```

### Base de datos

```bash
# Levantar PostgreSQL con Docker (puerto 5433)
docker compose up -d

# Ejecutar migraciones
cd marfyl-backend
npx prisma migrate dev

# Generar Prisma Client
npx prisma generate

# Seed producción
pnpm seed

# Seed desarrollo (con faker, más datos)
npx tsx prisma/seed-dev.ts

# Prisma Studio (UI de BD)
npx prisma studio
```

### Credenciales de seed

**Seed producción (`seed.ts`):**
```
Usuario 1:
  Email: glonga10@gmail.com
  Password: 338232gG

Usuario 2:
  Email: agpereir@gmail.com
  Password: monddy33

Organizaciones:
  - Davean (slug: davean, plan: ENTERPRISE)
  - Monddy (slug: monddy, plan: ENTERPRISE)
  - El Rancho De German (slug: el-rancho-de-german, plan: ENTERPRISE)
```

**Seed desarrollo (`seed-dev.ts`):**
```
Usuario:
  Email: admin@marfyl.dev
  Password: admin123

Organizaciones:
  - Davean (slug: davean, plan: ENTERPRISE)
  - El Rancho de Germán (slug: el-rancho-de-german, plan: ENTERPRISE)
  - Monddy Corp (slug: monddy, plan: ENTERPRISE)
```

### Variables de entorno relevantes

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api    # URL del backend
NEXT_PUBLIC_FISCAL_PREVIEW=true                   # Bypass auth en dev
NEXT_PUBLIC_CONCERT_MOCK=true                     # Fallback mocks concierto
NEXT_PUBLIC_FEATURE_CONCERT=true                  # Habilitar módulo concierto
NEXT_PUBLIC_CONCERT_SLUG=hemenegilda-capacidad    # Slug por defecto

# Backend
DATABASE_URL=postgresql://user:pass@localhost:5433/marfyl
JWT_SECRET=...
```

### Cierre de período fiscal

```bash
# vía API
POST /fiscal/periods/{year}/{month}/close

# vía UI
Navegar a /fiscal/predeclaracion → "Cerrar período"
```

---

## Próximos pasos inmediatos

1. **TAREA-F1-2.x (Dashboard)** — Crear `dashboardService` y conectar `(dashboard)/page.tsx`. Es la página principal y mayor impacto visual.

2. **TAREA-F1-3.x (Cierre de caja)** — Módulo crítico para operaciones diarias. Crear `cierre-cajaService` y conectar `cierre-caja/page.tsx`.

3. **Resolver DEC-001** — Decidir si `libro-ventas-panel.tsx` es dead code y eliminarlo.

4. **Resolver DEC-003** — Agregar try/catch con toast en `retenciones/page.tsx` para `exportTxt()` y `openPdf()`.

5. **Fase 2: Instalar Vitest** — Para poder escribir tests unitarios del frontend.

6. **TAREA-F1-4.x a TAREA-F1-9.x** — Módulos restantes en orden de criticidad.

---

## Archivos clave de referencia

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `src/lib/api/fiscal.ts` | Service de referencia (22 métodos, patrón completo) | 636 |
| `src/lib/api/concert.ts` | Service de referencia (11 métodos, patrón Opción C) | 138 |
| `src/lib/api/client.ts` | Core de axios con interceptores (auth, tenant, error handling) | 114 |
| `src/lib/api/get-error-message.ts` | Utility de manejo de errores | 32 |
| `src/hooks/useFiscalCalendarHub.ts` | Hook de referencia con patrón P2 (fallback) | 125 |
| `src/lib/fiscal/calendar-hub-mapper.ts` | Mapper de datos API → ViewModel | 257 |
| `src/lib/fiscal/calendar-hub-mock.ts` | Mock data para fallback | 103 |
| `src/types/fiscal-calendar-hub.ts` | Tipos compartidos del hub fiscal | 118 |
| `src/lib/fiscal-preview.ts` | Bypass de auth para desarrollo | 82 |
| `src/lib/auth-session-cookie.ts` | Cookie de sesión para middleware | 20 |
| `docs/CONCERT_MOCKS.md` | Documentación de mocks de concierto | 69 |
| `marfyl-backend/src/modules/fiscal/fiscal.controller.ts` | Controller fiscal (22 endpoints) | 287 |
| `marfyl-backend/prisma/seed.ts` | Seed producción | 247 |
| `marfyl-backend/prisma/seed-dev.ts` | Seed desarrollo con faker | 510 |

---

## Notas para el compañero nuevo

1. **Empieza por `fiscal.ts`** — Es el service mejor documentado y con más métodos. Úsalo como plantilla.

2. **Patrón de migración:** Para cada módulo:
   - Buscar el controller en `marfyl-backend/src/modules/{modulo}/`
   - Crear el service en `marfyl-frontend/src/lib/api/{modulo}.ts`
   - Conectar las páginas existentes en `src/app/(dashboard)/{modulo}/`
   - Agregar fallback P2 si aplica

3. **No romper funcionalidad existente** — El patrón P1 dice: preservar comportamiento legacy. Si algo funciona con mocks, no lo rompas al migrar.

4. **Type-check es tu amigo** — Ejecuta `pnpm type-check` frecuentemente. Los errores de tipo suelen indicar problemas de integración.

5. **El backend ya tiene los endpoints** — No necesitas crear endpoints en el backend. Solo crear el service frontend y conectar las páginas.

6. **Multi-tenant es automático** — El interceptor de `client.ts` inyecta `x-tenant-id`. No lo olvides al crear services, pero tampoco lo repitas manualmente.

7. **Mock como fallback, no como ruta primaria** — El patrón P2 dice: intentar backend real primero, mock solo en error de red.

---

## Changelog de documentación

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-06-03 | Creación inicial del handoff | docs-agent |
| 2026-06-04 | Auditoría integral + security hardening | security-agent, architect-agent, coding-interface-agent |

---

## Auditoría de Seguridad - 4 Junio 2026

### Vulnerabilidades Críticas Corregidas

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| SEC-001 | 🔴 CRÍTICA | Credenciales hardcoded `338232gG`, `monddy33` | ✅ CORREGIDO |
| SEC-002 | 🔴 CRÍTICA | JWT_SECRET por defecto inseguro | ✅ CORREGIDO |
| SEC-003 | 🔴 CRÍTICA | Tokens públicos predecibles (uuidv4) | ✅ CORREGIDO |
| SEC-004 | 🔴 CRÍTICA | Endpoint mark-paid sin protección | ✅ CORREGIDO |
| SEC-005/006 | 🟠 ALTA | Sin rate limiting en auth | ✅ CORREGIDO |
| SEC-007 | 🟠 ALTA | Sin protección CSRF | ✅ CORREGIDO |
| SEC-009 | 🟡 MEDIA | Contraseña por defecto `MARFYL2026!` | ✅ CORREGIDO |
| BUG-002 | 🔴 CRÍTICA | IVA hardcoded en PDF (=0) | ✅ CORREGIDO |

### Nuevas Funcionalidades

- **Soft-delete**: Schema actualizado con `deletedAt` en Invoice, Expense, Organization (compliance fiscal Venezuela 5+ años)
- **Paginación server-side**: Endpoints `?page=&limit=` en invoices y products
- **Dashboard optimizado**: GROUP BY en BD en lugar de findMany en memoria

### UI/UX Corregido

- AdminTableWrap padding móvil
- FiscalToolbar responsive
- InvoiceDetailSheet ancho
- POS grid breakpoints
- Toast en vez de alert()
- Error handling en retryLast()

### Documentación Relacionada

- `marfyl-backend/SECURITY_AUDIT.md` - Reporte completo de auditoría
- `marfyl-backend/PRODUCTION_CONFIG.md` - Configuración segura de producción
- `marfyl-backend/DEPLOYMENT.md` - Guía de despliegue actualizada
- `marfyl-backend/CHANGELOG.md` - Registro de cambios
