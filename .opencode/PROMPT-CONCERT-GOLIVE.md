# PROMPT MAESTRO: Go-live Módulo Concierto MARFYL

## Contexto
Proyecto: `MARFYL-GIT/` con:
- Frontend: `marfyl-frontend/` (Next.js 14, puerto 3003)
- Backend: `marfyl-backend/` (NestJS 10 + Prisma, puerto 3001)

Evento actual: **Hemenegilda Capacidad** (`slug: hemenegilda-capacidad`).
El módulo de boletería está implementado en código pero **NO es production-ready**. Falta email (Resend), hardening de seguridad, y piezas operativas.

## Workflow multi-agente (OBLIGATORIO — seguir orchestrator)
1. **planner_agent** → descomponer en tareas ordenadas con dependencias
2. **security_agent** → PLAN_REVIEW del plan antes de implementar (scope: concierto + email + uploads públicos)
3. Esperar aprobación del usuario
4. **coding_agent** → backend (email, seguridad, endpoints faltantes)
5. **frontend_design_agent** → UI (email obligatorio, reenvío, cancelación, notificaciones)
6. **security_agent** → CODE_REVIEW del diff final
7. **critic_agent** → revisión calidad
8. **docs_agent** → actualizar `.env.example`, runbook go-live

NO implementar en paralelo. NO saltar security review.

---

## Estado actual (NO reimplementar lo que ya existe)

### Backend implementado
- `marfyl-backend/src/modules/concert/concert.service.ts` — hold, checkout, markOrderPaid, scan
- `concert-public.controller.ts` — endpoints @Public()
- `concert.controller.ts` — admin JWT + OrganizationGuard (SIN RolesGuard)
- Prisma: ConcertEvent, ConcertSeat, ConcertOrder, ConcertTicket
- QR: `MARFYL-TKT-${randomUUID()}` en markOrderPaid

### Frontend implementado
- `/evento/[slug]` — mapa + checkout
- `/evento/[slug]/entrada/[orderToken]` — polling + QR (qrcode.react)
- `/concierto`, `/concierto/ordenes`, `/concierto/mapa`, `/concierto/escaner`
- `src/lib/api/concert.ts` — concertService

### NO existe
- Integración Resend (0 referencias en repo)
- Email al comprador ni al owner
- Rate limiting en endpoints públicos
- RolesGuard en admin concierto
- Cancelación órdenes (endpoint + UI)
- Reenvío email
- buyerEmail obligatorio

---

## FASE A — Módulo Email (Resend) en backend

### A1. Dependencias
```bash
cd marfyl-backend
npm install resend
npm install @react-email/components react-email
```

### A2. Nuevo módulo `src/modules/email/`
- `email.module.ts`, `email.service.ts`
- Wrapper Resend con:
  - `sendConcertOrderPendingToOwner(...)` — trigger en checkoutPublic
  - `sendConcertTicketsToBuyer(...)` — trigger en markOrderPaid
  - `resendConcertTickets(orderId)` — reenvío manual

Variables env (añadir a `.env.example`):
```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=entradas@marfyl.com
RESEND_FROM_NAME=MARFYL Entradas
CONCERT_OWNER_NOTIFY_EMAIL=
```

### A3. Templates email (HTML responsive, español)

**Email owner — nueva orden pendiente:**
- Comprador, teléfono, cédula, monto USD/Bs, método pago, referencia
- Link admin: {FRONTEND_URL}/concierto/ordenes
- Link comprobante (solo si existe, URL firmada o admin-only)

**Email comprador — entrada confirmada:**
- Nombre evento, fecha, venue
- Lista tickets: mesa/asiento, section
- QR embebido por ticket (PNG inline CID o URL hosted)
- Link web: {FRONTEND_URL}/evento/{slug}/entrada/{publicToken}
- Instrucciones: "Presente este QR en la entrada"

### A4. Integrar triggers en `concert.service.ts`
- `checkoutPublic` → después de crear orden: `emailService.sendConcertOrderPendingToOwner(...)` (no bloquear checkout si email falla — log + fire-and-forget con try/catch)
- `markOrderPaid` → después de generar tickets: `emailService.sendConcertTicketsToBuyer(...)`
- Guardar en BD: `emailSentAt`, `emailSentTo` en `ConcertOrder` (migración Prisma) para idempotencia y reenvío

### A5. Endpoint reenvío
- `POST /concert/admin/orders/:id/resend-email` — solo ADMIN/MANAGER
- Validar orden PAID + buyerEmail presente

---

## FASE B — Validación y DTOs

### B1. buyerEmail obligatorio
- `checkout.dto.ts`: `@IsEmail()` + `@IsNotEmpty()` en buyerEmail
- `admin-sell.dto.ts`: idem
- Frontend `/evento/[slug]/page.tsx`: input email required, validación antes submit
- Mensaje UX: "Recibirás tus entradas en este correo cuando confirmemos tu pago"

### B2. Unicidad referencia de pago (opcional MVP+)
- Índice único parcial en `paymentReference + paymentMethod + eventId` donde `status != CANCELLED`
- O validación en `checkoutPublic`

---

## FASE C — Cancelación de órdenes

### C1. Backend
- `POST /concert/admin/orders/:id/cancel` — RolesGuard ADMIN, MANAGER
- Liberar asientos (AVAILABLE), status CANCELLED
- Solo si PENDING_PAYMENT

### C2. Frontend
- Botón "Cancelar" en `/concierto/ordenes` para pendientes
- Confirm dialog

---

## FASE D — Seguridad

Ejecutar `security_agent` con PLAN_REVIEW antes de codear. Implementar mínimo:

### D1. Rate limiting
- `@nestjs/throttler` en hold y checkout públicos
- Ej: 10 req/min por IP en hold, 5 req/min en checkout

### D2. RolesGuard en `concert.controller.ts`
- `@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)` // confirm, cancel, resend
- `@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.SELLER)` // scan, sell, list

### D3. Frontend permisos
- `/concierto/*` pages: verificar `usePermission()`
- Ocultar "Confirmar pago" a SELLER si security decide

### D4. Comprobantes de pago
- NO servir `/uploads/concert/payments/*` públicamente sin auth
- Endpoint admin autenticado: `GET /concert/admin/orders/:id/proof` con OrganizationGuard
- Actualizar frontend órdenes para usar endpoint protegido

### D5. QR más robusto (si security aprueba scope)
- Firmar payload: `MARFYL-TKT-{uuid}.{hmac}` con `CONCERT_QR_SECRET`
- Validar firma en `scanTicket`

### D6. Producción
- Verificar `DEV_PREVIEW_AUTH` y `NEXT_PUBLIC_FISCAL_PREVIEW` desactivados
- Documentar checklist en docs

---

## FASE E — Frontend UX go-live

### E1. Checkout `/evento/[slug]/page.tsx`
- Email obligatorio con validación
- Copy claro: "Te enviaremos tus QR a este correo cuando el organizador confirme"
- Mejor feedback post-checkout

### E2. Página entrada `/evento/.../entrada/[orderToken]`
- Estado "Revisa tu correo" cuando PAID
- Botón "Reenviar a mi correo"

### E3. Admin órdenes `/concierto/ordenes`
- Badge "Email enviado" / "Falló envío"
- Botón "Reenviar email" en órdenes PAID
- Botón "Cancelar" en pendientes
- Notificación visual nueva orden (poll 30s)

### E4. Admin setup checklist en `/concierto`
- Card "Checklist go-live":
  - Evento configurado (setup)
  - RESEND_API_KEY configurada
  - Link venta pública copiable
  - Probar flujo completo

---

## FASE F — Configuración producción

### Backend `.env`
```
CONCERT_FEATURE_ENABLED=true
CONCERT_DEFAULT_SLUG=hemenegilda-capacidad
RESEND_API_KEY=...
RESEND_FROM_EMAIL=entradas@tudominio.com
FRONTEND_URL=https://app.marfyl.com
```

### Frontend `.env`
```
NEXT_PUBLIC_FEATURE_CONCERT=true
NEXT_PUBLIC_CONCERT_SLUG=hemenegilda-capacidad
NEXT_PUBLIC_API_URL=https://api.marfyl.com/api
```

### Runbook inicial
1. Deploy backend + migraciones
2. Login admin → `/concierto` → "Configurar evento" (POST setup)
3. Probar compra test → confirmar → verificar email Resend
4. Probar escáner

---

## Verificación
```bash
# Backend
cd marfyl-backend && npm run build && npm run test
# Frontend
cd marfyl-frontend && npm run type-check && npm run build
```

### Test manual E2E
1. GET `/evento/hemenegilda-capacidad` — mapa carga
2. Seleccionar asientos → hold → checkout con email real
3. Owner recibe email pendiente
4. Owner confirma en `/concierto/ordenes`
5. Comprador recibe email con QR
6. `/evento/.../entrada/{token}` muestra QR
7. Escáner autoriza una vez, rechaza segunda vez
8. Rate limit: 11 holds rápidos → 429

---

## Restricciones
- ❌ NO pasarela Stripe automática (fuera de scope — pago manual VE)
- ❌ NO reescribir lógica de asientos/catálogo Hemenegilda
- ❌ NO commits sin pedir al usuario
- ✅ Emails en español
- ✅ Idempotencia: no reenviar duplicados en confirm accidental
- ✅ Logs estructurados si email falla (sin exponer API keys)

---

# PROMPT 2 — Agente de seguridad OpenCode (PLAN_REVIEW)

## SECURITY REVIEW — Módulo Concierto MARFYL + Integración Resend
### Modo
PLAN_REVIEW (antes de implementación)

### Scope
- `marfyl-backend/src/modules/concert/**`
- Nuevo módulo `email/` con Resend
- Uploads comprobantes pago
- Endpoints públicos: hold, checkout, getOrder
- Endpoints admin: confirm, cancel, scan, resend-email
- Frontend: `/evento/*`, `/concierto/*`
- Variables: RESEND_API_KEY, CONCERT_QR_SECRET, JWT, DEV_PREVIEW flags

### Preguntas específicas
1. **Rate limiting**: ¿10/min hold y 5/min checkout son suficientes? ¿Throttler por IP + slug?
2. **RolesGuard**: ¿Quién puede confirmar pagos, cancelar, escanear, reenviar email?
3. **Comprobantes de pago**: `/uploads/concert/payments/` es público hoy.
4. **QR payload** sin firma: ¿Implementar HMAC con CONCERT_QR_SECRET?
5. **orderToken público** (UUID en URL): ¿Expiración? ¿Rate limit?
6. **buyerEmail en checkout público**: ¿Validación anti-spam en reenvío?
7. **Resend**: ¿FROM domain verificado obligatorio? ¿Sanitizar HTML?
8. **Multi-tenant**: ¿OrganizationGuard suficiente en todos los admin endpoints?
9. **DEV_PREVIEW_AUTH / NEXT_PUBLIC_FISCAL_PREVIEW**: ¿Bypass de auth en prod?
10. **paymentReference duplicada**: ¿Fraude con misma referencia en múltiples órdenes?

### Output esperado del security_agent
Para cada hallazgo:
- Qué es el riesgo
- Cómo se explota
- Severidad (Critical/High/Medium/Low)
- Remediación concreta (código/config)

Veredicto final:
- [ ] CLEAR — proceder implementación
- [ ] CLEAR WITH CONDITIONS — listar condiciones obligatorias
- [ ] BLOCK — no implementar hasta corregir plan

NO escribir código. Solo review.
