# Design System Master — MARFYL

> **Lógica:** Al construir una página, revisa primero `design-system/marfyl/pages/[pagina].md`.
> Si existe, sus reglas **prevalecen** sobre este Master.
> Si no, sigue este archivo y `docs/MARFYL-DARK-MATERIALS.md`.

**Proyecto:** MARFYL  
**Categoría:** Panel administrativo SaaS / fintech / inventario / fiscal Venezuela  
**Stack:** Next.js 14, Tailwind, shadcn/ui, Framer Motion, Recharts

---

## Paletas oficiales (Dark Materials)

| Zona | Base | Acento | Uso |
|------|------|--------|-----|
| **A** — App operativo | Darkmoon `#222222` | Cashmere `#FFEE91` | Dashboard, sidebar, POS, inventario |
| **B** — Marketing / IA | Black Granite `#1E1E1E` | Sunset Coral `#FFCAB5` | `/empresa`, asistente FAB |

Variables CSS: `--dm-a-*`, `--dm-b-*` en `frontend/src/app/globals.css`.  
Modo oscuro por defecto; modo claro con fondo cálido sin orbes animados.

---

## Componentes React (implementación)

| Componente | Ruta | Uso |
|------------|------|-----|
| `AdminPageShell` | `@/components/admin/admin-page-shell` | Toda página del dashboard: título, eyebrow, acciones, loading |
| `AdminCard` | `@/components/admin/admin-card` | Listados, formularios, paneles |
| `AdminChartCard` | `@/components/admin/admin-card` | Gráficos Recharts |
| `AdminStatCard` | `@/components/admin/admin-stat-card` | KPIs compactos (3 columnas) |
| `AdminTableWrap` | `@/components/admin/admin-card` | Tablas con scroll horizontal en móvil |
| `AdminPanel` / `DmSurface` | `@/components/admin/admin-panel` | Dark Materials (shimmer, ruido) |
| `MetricCard` | `@/components/metric-card` | KPIs con sparkline en home |
| `FiscalShell` | `@/components/fiscal/fiscal-shell` | Módulo fiscal con breadcrumbs |

### Eyebrows por módulo

- **Panel de control** — `/`
- **Ventas** — POS, facturas, clientes, historial, cierre de caja
- **Inventario** — productos, movimientos, alertas, autoconsumo, combos
- **Finanzas** — gastos, créditos, CxP, tasas
- **Administración** — configuración, equipo
- **Fiscal MARFYL** — hub y subpáginas fiscales

---

## Reglas UX (ui-ux-pro-max)

### Interacción

- Transiciones **150–300ms** (`duration-200`, `ease-out`)
- `cursor-pointer` en todo elemento clickeable
- **Sin** `scale` en hover que desplace layout (evitar `hover:scale-105` en grids densos)
- Estados de foco visibles para teclado

### Motion

- Entrada de página: `AdminMotionFade` / `AdminMotionStagger`
- POS: `animate={false}` en `AdminPageShell` (rendimiento)
- Respetar `prefers-reduced-motion` (ya en CSS y Framer)

### Responsive

- Probar: 375, 768, 1024, 1440 px
- Tablas siempre dentro de `AdminTableWrap`
- Bottom nav móvil con etiquetas + targets ≥ 44px

### Iconos

- Solo **Lucide** / SVG — nunca emojis como iconos de UI

### Contraste

- Texto muted mínimo slate-600 en modo claro
- Bordes visibles en ambos modos (`border-border`)

---

## Tipografía

- **Producción actual:** Inter (Next.js `layout.tsx`)
- **Alternativa recomendada (analytics):** Fira Sans + Fira Code para cifras — opcional en fase 2

---

## Anti-patterns

- ❌ Modo claro por defecto sin decisión de producto
- ❌ Cards shadcn planas en páginas nuevas (usar `AdminCard`)
- ❌ Animaciones > 500ms en micro-interacciones
- ❌ Orbes `DmAmbientMotion` en modo claro
- ❌ Emojis como iconos
- ❌ Tablas sin contenedor scroll en móvil

---

## Checklist pre-entrega

- [ ] `AdminPageShell` con eyebrow + subtítulo
- [ ] Listados en `AdminCard` + `AdminTableWrap`
- [ ] Gráficos en `AdminChartCard`
- [ ] KPIs en `AdminStatCard` o `MetricCard`
- [ ] `prefers-reduced-motion` respetado
- [ ] Sin scroll horizontal accidental en viewport
- [ ] Carga con estado `loading` en shell

---

## Referencias

- `docs/MARFYL-DARK-MATERIALS.md` — efectos, orbes, shimmer
- `frontend/src/lib/design/marfyl-palettes.ts` — tokens TS
- Skill local: `.cursor/skills/ui-ux-pro-max/SKILL.md`
