# Mocks de concierto — fallback opcional

> **Estado:** Aprobado tras migración Opción C (critic_agent confianza 0.98).  
> **Decisión clave (P2=A):** los mocks solo se activan como **fallback en error de red** cuando el flag está encendido. Ya no son la ruta primaria.

---

## Flag de entorno

| Variable | Valor | Efecto |
|----------|-------|--------|
| `NEXT_PUBLIC_CONCERT_MOCK` | `true` | Habilita fallback a mocks en errores de red (`isNetworkFailure`). |
| `NEXT_PUBLIC_CONCERT_MOCK` | `false` o ausente | Las páginas de concierto siempre intentan el backend real; sin fallback. |

**No renombrar el flag (P3=A).** Se mantiene `NEXT_PUBLIC_CONCERT_MOCK` para no romper `.env` existentes.

---

## Comportamiento del fallback

En cada página que consume datos de concierto, el flujo es:

1. Intentar llamada real vía `concertService`.
2. Si falla **y** `CONCERT_MOCK_ENABLED === true` **y** `isNetworkFailure(err) === true`, usar mock local.
3. Cualquier otro error (4xx, 5xx con respuesta, etc.) se muestra al usuario normalmente.

Esto aplica a:

- `evento/[slug]/page.tsx` — carga de evento, hold y checkout.
- `evento/[slug]/entrada/[orderToken]/page.tsx` — consulta de orden con polling cada 15 s.
- `(dashboard)/concierto/page.tsx` — overview admin.
- `(dashboard)/concierto/ordenes/page.tsx` — listado y confirmación de órdenes.
- `(dashboard)/concierto/mapa/page.tsx` — plano del salón con auto-refresh cada 20 s.

---

## Caso especial: escáner QR

En `(dashboard)/concierto/escaner/page.tsx` existe una **rama de demo adicional**:

- Si `CONCERT_MOCK_ENABLED` está activo y el payload escaneado contiene `MARFYL-TKT-DEMO`, el resultado se resuelve localmente **sin llamar a la API**.
- Esto permite probar el flujo de acceso sin backend levantado.

---

## Archivos preservados

- `src/lib/concert/mock-data.ts` — datos de demo (evento, órdenes, hold, tickets).
- `src/lib/concert/feature.ts` — exporta `CONCERT_MOCK_ENABLED` y `CONCERT_DEFAULT_SLUG`.

Ambos siguen en el repo como **fallback opcional**, no como ruta primaria.

---

## Servicio real

Todas las llamadas al backend de concierto pasan por `src/lib/api/concert.ts`:

- 4 métodos públicos: `getEvent`, `holdSeats`, `checkout`, `getOrder`.
- 7 métodos admin: `getOverview`, `setupEvent`, `syncCatalog`, `getOrders`, `confirmOrder`, `sell`, `scanTicket`.

Las páginas ya no usan `axios` ni `apiClient` directamente; usan `concertService`.

---

## Notas independientes

- **Fiscal preview** (`useFiscalCalendarHub`, `fiscal-preview.ts`) no depende de `CONCERT_MOCK_ENABLED`. Tiene su propio fallback si aplica.
- **Fiscal preview** sigue funcionando como bypass de auth para dev (sin cambios, P1=A).
