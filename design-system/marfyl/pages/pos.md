# Punto de venta (`/pos`)

**Override del Master MARFYL**

## Shell

- `AdminPageShell` con **`animate={false}`** (catálogo grande, muchos tiles)
- Eyebrow: **Ventas**

## Layout

- Grid `lg:grid-cols-3`: catálogo (2 cols) + carrito (1 col, sticky desktop)
- Paneles: `AdminCard` con clases `admin-pos-panel` + `bodyClassName` flex column
- Tiles producto: `div.admin-pos-product-tile` (no `AdminPanel` por tile — rendimiento)
- Combos: borde amber; servicios: borde sky
- Teclado: `role="button"`, Enter/Espacio en tiles disponibles

## Accesibilidad

- `cursor-pointer` solo si hay stock/disponibilidad
- Botón COBRAR: `cursor-pointer`, altura `h-12`
