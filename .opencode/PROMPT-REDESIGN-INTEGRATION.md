# TAREA MAESTRA: Integración completa del rediseño MARFYL — SaaS premium (Azul claro + Blanco + Negro)
## Rol y agente
Actúa como **Senior Frontend Design Engineer** usando el agente de OpenCode configurado para UI (`coding-interface-agent` / frontend design agent).
**OBLIGATORIO antes de escribir código:**
1. Leer y seguir el skill **`marfyl-frontend/.opencode/skills/ui-ux-pro-max/SKILL.md`** en todo momento.
2. Ejecutar el design system del skill para validar decisiones:
```bash
cd marfyl-frontend
python .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS B2B fintech dashboard POS inventory fiscal Venezuela professional minimal blue white" --design-system -p "MARFYL"
```
Aplicar las recomendaciones del skill (UX guidelines, anti-patterns, contraste, motion, responsive) sin contradecir el ZIP de referencia visual.
Principio: El skill ui-ux-pro-max guía criterio UX; el ZIP es la fuente de verdad visual (colores, efectos, patrones, componentes). Si hay conflicto menor, gana el ZIP; si el skill detecta un problema de accesibilidad o UX grave, corrígelo y documenta el cambio.

## Repositorios y rutas
| Qué | Ruta |
|-----|------|
| App producción (integrar aquí) | marfyl-frontend/ |
| Rediseño v0 (REFERENCIA VISUAL) | ../marfyl-saa-s-redesign.zip |
| ZIP extraído (usar como guía) | ../marfyl-saa-s-redesign-extracted/ (extraer si no existe) |

```powershell
# Si no está extraído:
Expand-Archive -Path "..\marfyl-saa-s-redesign.zip" -DestinationPath "..\marfyl-saa-s-redesign-extracted" -Force
```

## Objetivo de producto
Transformar MARFYL de un look "Dark Materials" (oscuro + amarillo cashmere #FFEE91 + coral #FFCAB5) a un SaaS B2B de otro nivel: limpio, premium, confiable, con profundidad visual — como Stripe, Linear o Mercury, pero adaptado a Venezuela (POS bimoneda, SENIAT, Pago Móvil).

**Meta visual:** Azul claro + blanco + detalles negro/slate-900. Efectos: glass, mesh gradients, glow suave, hover-lift, sombras con tinte azul, nav con borde izquierdo activo.
**Meta técnica:** Integrar el diseño del ZIP en marfyl-frontend sin romper lógica de negocio, API, auth, permisos, rutas ni stores (excepto tema default).

## Fuente de verdad visual — ZIP marfyl-saa-s-redesign.zip
El rediseño ya está hecho en el ZIP. NO reinventar desde cero. Portar patrones, tokens, clases y estilos al proyecto real.

### Archivos clave del ZIP (leer TODOS antes de implementar)
| Archivo ZIP | Qué portar a marfyl-frontend |
|-------------|------------------------------|
| app/globals.css | Design tokens, utilities: .glass-navbar, .mesh-gradient-bg, .grid-pattern, .card-elevated, .hover-lift, .gradient-text, .glow-*, shadows con tinte azul |
| tailwind.config.ts | Colores extend, shadows elevated/card-hover, mesh-gradient, radius, spacing sidebar |
| app/page.tsx | Landing: hero mesh, navbar glass, feature cards, FAQ, CTA band, trust section |
| app/admin/layout.tsx | Shell admin: sidebar + topbar + FAB |
| components/admin/sidebar.tsx | Nav agrupada, item activo border-l-4 border-l-blue-600, gradient sutil, logo |
| components/admin/topbar.tsx | Topbar glass/gradient, chip tasa BCV con glow, notificaciones, avatar gradient |
| components/admin/bottom-nav.tsx | Bottom nav móvil azul activo |
| components/admin/assistant-fab.tsx | FAB azul, panel chat blanco, header blue-600 |
| app/admin/page.tsx | KPI cards con .hover-lift, grid charts |
| app/admin/pos/page.tsx | Layout POS 2 columnas, toggle USD/Bs, botón cobrar |
| app/admin/products/page.tsx | Tabla inventario elevada |
| app/admin/seniat/page.tsx | Módulo fiscal / calendario |
| app/admin/customers/page.tsx | Listado clientes |
| app/admin/settings/page.tsx | Settings con tabs |
| components/ui/button.tsx, card.tsx, badge.tsx, etc. | Variantes shadcn alineadas al nuevo look |
| public/logo-marfyl.svg | Copiar a marfyl-frontend/public/ |

### Tokens del ZIP (implementar en producción)
```css
/* Del ZIP — adaptar a formato HSL shadcn en marfyl-frontend/src/app/globals.css */
--blue-50: #F0F9FF;
--blue-100: #E0F2FE;
--blue-600: #0284C7;
--blue-700: #0369A1;
--background: #F8FBFF;        /* azul muy claro, NO gris plano */
--background-subtle: #EFF5FB;
--surface: #FFFFFF;
--surface-secondary: #F5F9FE;
--foreground: #0C2340;        /* azul marino profundo — títulos */
--foreground-muted: #475569;
--border: #D0E8F7;            /* borde azul suave */
--border-strong: #8FBFE5;
--black-accent: #000000;      /* detalles: eyebrows, KPI bold, separadores */
/* Sombras con tinte azul (del ZIP) */
--shadow-md: 0 4px 6px -1px rgba(2, 132, 199, 0.15);
--shadow-xl: 0 20px 25px -5px rgba(2, 132, 199, 0.25);
--glow-md: 0 0 32px rgba(2, 132, 199, 0.3);
```

Dark mode (ZIP): #0B1929 fondo, #1A2A42 surface, #E0F2FE foreground — mantener coherencia azul profundo, sin amarillo/coral.

## Workflow ui-ux-pro-max + ZIP (obligatorio)

### Paso A — Design system con skill
```bash
cd marfyl-frontend
python .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS fintech dashboard Venezuela blue white professional depth glass morphism" --design-system --persist -p "MARFYL Blue Horizon"
```
Actualizar design-system/marfyl/MASTER.md con paleta "Blue Horizon" (nombre sugerido), referenciando tokens del ZIP.

### Paso B — Auditoría visual ZIP vs producción
Comparar lado a lado:
- ZIP app/page.tsx ↔ marfyl-frontend/src/app/(marketing)/empresa/page.tsx
- ZIP components/admin/sidebar.tsx ↔ marfyl-frontend/src/components/sidebar.tsx
- ZIP components/admin/topbar.tsx ↔ marfyl-frontend/src/components/admin/admin-topbar.tsx
- ZIP app/admin/pos/page.tsx ↔ marfyl-frontend/src/app/(dashboard)/pos/page.tsx

Documentar en comentario de commit (no archivo .md nuevo) qué patrones se portan.

### Paso C — Implementación por capas (orden estricto)

#### FASE 1 — Fundación (tokens + CSS global)
**Archivos:**
- marfyl-frontend/src/app/globals.css (~1700 líneas)
- marfyl-frontend/src/lib/design/marfyl-palettes.ts
- marfyl-frontend/tailwind.config.ts
- marfyl-frontend/src/store/useThemeStore.ts → default 'light'
- marfyl-frontend/src/app/layout.tsx → script hidratación light por defecto, themeColor: #0284C7
- Copiar public/logo-marfyl.svg del ZIP

**Acciones:**
1. Fusionar tokens del ZIP en :root / .dark manteniendo compatibilidad shadcn (--primary, --sidebar-*, --card, etc.).
2. Mapear vars legacy sin romper referencias:
   - --dm-a-accent, --dm-b-accent, --marketing-accent → azul #0284C7 / HSL equivalente
   - --dm-a-base → #F8FBFF, --dm-b-base → #FFFFFF
3. Portar utilities del ZIP: .glass-navbar, .mesh-gradient-bg, .grid-pattern, .card-elevated, .hover-lift, .gradient-text, .glow-sm/md/lg, .text-eyebrow
4. Re-tintar TODAS las clases legacy en globals.css:
   - .admin-*, .marketing-*, .dm-*, .ai-*, .fiscal-hub-*, .fiscal-v0-*, .bottom-nav-*, .concert-*
5. Eliminar gradientes amarillo/coral en .dark .admin-page-title → usar .gradient-text azul del ZIP
6. Marketing: dejar de forzar tema oscuro en .marketing-root → fondo claro #F8FBFF + mesh como ZIP landing

#### FASE 2 — Shell de aplicación (copiar patrones del ZIP)
| Producción | Referencia ZIP | Patrones a portar |
|------------|----------------|-------------------|
| src/components/sidebar.tsx | components/admin/sidebar.tsx | Nav activo border-l-4 border-l-blue-600, gradient hover from-blue-50 to-blue-100/50, glow corner, logo gradient |
| src/components/layout/sidebar-nav-parts.tsx | idem | Mismos estados activo/hover |
| src/components/admin/admin-topbar.tsx | components/admin/topbar.tsx | Chip BCV gradient blue, glass topbar, glow accent |
| src/components/bottom-nav.tsx | components/admin/bottom-nav.tsx | Activo azul sólido, sombra blue |
| src/components/assistant/marfyl-assistant.tsx | components/admin/assistant-fab.tsx | FAB bg-blue-600, panel blanco, header azul |
| src/components/ui/dm-ambient-motion.tsx | mesh del ZIP | Orbes azul #0284C7 / #38BDF8, ocultos en light |
| src/components/ui/dm-surface.tsx | .card-elevated | Superficies blancas + border #D0E8F7 + shadow-md |
| src/components/admin/admin-panel.tsx | .card-elevated + .hover-lift | - |
| src/components/admin/admin-card.tsx | idem | - |
| src/components/metric-card.tsx | ZIP admin KPI cards | .hover-lift, icon text-blue-600, sparkline azul |

Layout dashboard: src/app/(dashboard)/layout.tsx — mantener estructura actual (NotificationFeed, AssistantProvider, PWA) pero aplicar clases visuales del ZIP.

#### FASE 3 — Marketing (landing nivel SaaS premium)
**Referencia principal:** ZIP app/page.tsx

**Archivos producción:**
- src/app/(marketing)/layout.tsx — fondo claro + mesh sutil (no palette="b" oscuro)
- src/components/marketing/marketing-navbar.tsx → .glass-navbar del ZIP
- marketing-footer.tsx → footer slate-900 (contraste), links hover azul
- marketing-cta-band.tsx → banda bg-blue-600 texto blanco (como CTA final del ZIP)
- marketing-feature-card.tsx vía CSS → .card-elevated + .hover-lift
- pricing-table.tsx, marketing-faq.tsx, marketing-preview-bar.tsx
- Páginas: (marketing)/empresa, caracteristicas, precios, blog, blog/[slug]

**Efectos obligatorios del ZIP en marketing:**
- Hero: .mesh-gradient-bg + blobs bg-blue-200 blur-3xl animate-pulse
- Badge pill: bg-blue-50 border-blue-200 text-blue-600
- Feature cards: hover lift + shadow-xl
- FAQ acordeón limpio blanco
- CTA final: gradient azul full-width
- Eliminar TODAS las refs a --dm-b-accent, coral, hsl(22 ...).

#### FASE 4 — Auth
**Referencia:** estilo landing ZIP (glass + mesh)
- src/app/(auth)/layout.tsx
- src/app/(auth)/login/page.tsx, register, recover-password
- src/components/auth/ResetPasswordFormContent.tsx
- Split layout: panel izquierdo mesh azul + beneficios; derecha card blanca .card-elevated. Sin blobs indigo/coral legacy.

#### FASE 5 — Páginas dashboard (47 rutas)
Portar estilo visual del ZIP manteniendo toda la lógica existente (hooks, API, permisos):

**Prioridad (mapear a ZIP):**
| Ruta producción | Referencia ZIP |
|-----------------|----------------|
| (dashboard)/page.tsx | app/admin/page.tsx |
| (dashboard)/pos/page.tsx | app/admin/pos/page.tsx |
| (dashboard)/products/page.tsx | app/admin/products/page.tsx |
| (dashboard)/customers/page.tsx | app/admin/customers/page.tsx |
| (dashboard)/fiscal/** | app/admin/seniat/page.tsx |
| (dashboard)/settings/** | app/admin/settings/page.tsx |

Resto de (dashboard)/**/page.tsx: aplicar AdminPageShell + AdminCard + tokens nuevos.

Componentes compartidos: notifications-section, exchange-rate-indicator, expense-charts, invoice-detail-sheet, etc.

#### FASE 6 — Fiscal + Asistente IA
- src/components/fiscal/** — acento azul (no amarillo cashmere)
- src/components/assistant/** — panel estilo ZIP assistant-fab
- Clases .fiscal-hub-*, .fiscal-v0-* en globals.css

#### FASE 7 — Módulos secundarios
- Concierto: src/app/evento/**, src/components/concert/** — acento azul
- Públicos: pay/[token], invite/[token], demo/page.tsx
- Copiar assets: logo-marfyl.svg, icons del ZIP si aplica

#### FASE 8 — Barrido legacy (obligatorio)
```bash
# Desde marfyl-frontend/src — corregir cada match:
rg "dm-a-accent|dm-b-accent|FFEE91|FFCAB5|cashmere|coral|amber-500|yellow-400|hsl\(48 |hsl\(22 "
```
Preferir tokens semánticos y clases del ZIP (.hover-lift, .card-elevated, text-blue-600, etc.).

## Reglas ui-ux-pro-max (aplicar en paralelo al ZIP)
Del skill, obligatorio:
- Transiciones 150–300ms (duration-200 ease-out)
- cursor-pointer en clickeables
- Focus rings visibles (focus-visible:ring-2 focus-visible:ring-blue-500)
- Touch targets ≥ 44px (POS, bottom nav)
- Tablas en AdminTableWrap con scroll horizontal móvil
- Solo iconos Lucide — nunca emojis en UI (el ZIP landing usa emojis en "companies" — NO portar eso, usar texto o logos SVG)
- Contraste WCAG AA: texto muted mínimo slate-500 sobre blanco
- prefers-reduced-motion: desactivar orbes, pulse, gradient-flow
- POS: animate={false} en AdminPageShell (rendimiento)
- Sin hover:scale-105 en grids densos (POS/tablas) — el ZIP usa scale(1.01) en .hover-lift; en tablas usar solo translateY(-2px)

## Restricciones estrictas
❌ NO modificar: src/lib/api/**, hooks de datos, middleware.ts, stores auth/org (excepto theme), tipos, rutas API
❌ NO inventar KPIs, testimonios ni logos de empresas falsas
❌ NO commits automáticos
❌ NO crear .md nuevos (excepto actualizar design-system/marfyl/MASTER.md)
❌ NO copiar lógica mock del ZIP — solo estilos y layout visual
❌ NO romper multi-tenant, permisos por rol, PWA safe areas

✅ Mantener: AdminPageShell, AdminCard, AdminChartCard, AdminTableWrap, MetricCard, FiscalShell
✅ Proyecto compilable en cada fase

## Verificación final
```bash
cd marfyl-frontend
npm run type-check
npm run lint
npm run build
```
Visual QA (reportar):
- /empresa = calidad visual del ZIP app/page.tsx
- /dashboard = calidad ZIP app/admin/page.tsx
- /pos = calidad ZIP app/admin/pos/page.tsx
- Sidebar/topbar/FAB = idénticos en espíritu al ZIP
- /fiscal/calendario coherente
- /assistant panel azul/blanco
- Modo oscuro coherente (sin amarillo/coral)
- 375px / 768px / 1440px sin scroll horizontal accidental
- Grep legacy colors = 0 (salvo comentarios)

## Entregables
- Diff completo integrando ZIP → marfyl-frontend
- design-system/marfyl/MASTER.md actualizado (paleta Blue Horizon + refs al ZIP)
- Tabla tokens viejos → nuevos
- Output del comando ui-ux-pro-max --design-system usado
- Lista de archivos tocados
- Notas de desviaciones justificadas (si el skill corrigió algo del ZIP)

## Orden de ejecución
```
ui-ux-pro-max --design-system
    ↓
Extraer/leer ZIP
    ↓
FASE 1 (tokens) → FASE 2 (shell) → FASE 3 (marketing) → FASE 4 (auth)
    ↓
FASE 5 (dashboard) → FASE 6 (fiscal/IA) → FASE 7 (secundarios) → FASE 8 (barrido)
    ↓
type-check + lint + build + Visual QA
```

No avanzar sin completar FASE 1. Todo depende de globals.css + tokens del ZIP.

**Comenzar ahora.** El resultado debe sentirse como un SaaS de otro nivel: profundidad, glass, mesh, glow azul sutil, blancos limpios y negro/slate-900 para jerarquía — exactamente como marfyl-saa-s-redesign.zip, integrado en la app real de producción.
