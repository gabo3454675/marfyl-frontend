# Punto de venta (`/pos`)

**Override del Master MARFYL**

## Shell

- `AdminPageShell` con **`animate={false}`** (catálogo grande, muchos tiles)
- Ruta principal (`/pos` con acceso): **`hideHeader`** — no aplica eyebrow/título del shell (p. ej. «Ventas»)
- Fallback sin permiso: sí usa `eyebrow="Ventas"` + título «Punto de Venta»
- `PosToolbar` (estación / cajero POS-only, cuando aplica) va **dentro** de `AdminPageShell` como caja `shrink-0` (`.admin-pos-station-toolbar`)

## Layout

- Viewport fijo en desktop (`h-[100dvh]` en cadena de layout; `app-page-shell--pos`; `admin-pos-shell` = `flex-1 min-h-0`); scroll de página **cerrado** en desktop (`.app-main-scroll--pos` → `overflow: hidden`)
- Chrome de página `shrink-0` (pestañas abiertas / toolbar estación); sin barra de título local «Punto de Venta»; grid catálogo | carrito a **misma altura útil**
- Grid layout `md`: catálogo (`md:col-span-2`) + carrito (1 col, misma altura del grid — no sticky)
- Paneles: `AdminCard` con clases `admin-pos-panel` + `bodyClassName` flex column
- Scrolls **principales** del layout: `.admin-pos-catalog-scroll` y `.admin-pos-cart-scroll`; controles/modalidades del carrito pueden tener scroll interno secundario al alcanzar su tope %

### Catálogo (`.admin-pos-catalog-card`)

- Header card + filtros/búsqueda: `shrink-0` (no hacen scroll)
- Único scroll del catálogo: `.admin-pos-catalog-scroll`
  - **md+:** `max-height: none` (sin techo dvh; crece en la cadena flex del viewport fijo)
  - **móvil (<md):** `min-height: 18rem` + `max-height: min(70dvh, 36rem)`
- `.admin-pos-product-grid`: altura natural; **sin** overflow propio (scrolla el padre `catalog-scroll`)
- Densidad moderada de columnas: `2` → `md:3` → `lg:4` → `xl:5` → `2xl:6`
- Tiles (`.admin-pos-product-tile`): más compactos en xl/2xl (menos padding / `min-height`); no `AdminPanel` por tile — rendimiento
- Combos: borde amber; servicios: borde sky
- Teclado: `role="button"`, Enter/Espacio en tiles disponibles

### Carrito (`.admin-pos-cart-body` → `.admin-pos-cart-stack`)

- Stack **flex column** (no grid): controles → lista (scroll principal) → bottom
- `.admin-pos-cart-controls`: moneda + cliente + modalidades; `max-height: min(38%, 13rem)` (split más estricto: `min(36dvh, 13rem)`); scroll secundario al superar el tope
- `.admin-pos-cart-scroll`: `flex: 1 1 0%` + `min-height: 8rem` (compact / sheet: `4.5rem`)
- `.admin-pos-cart-bottom`: solo totales + COBRAR (sin modalidades)
- Prioridad de altura: **lista de ítems > controles**

## Accesibilidad

- `cursor-pointer` solo si hay stock/disponibilidad
- Botón COBRAR (panel carrito desktop): `cursor-pointer`, altura `h-14`
