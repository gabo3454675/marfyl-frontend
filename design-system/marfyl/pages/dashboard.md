# Dashboard home (`/`)

**Override del Master MARFYL**

## Estructura

1. `AdminPageHeader` — eyebrow: "Panel de control"
2. `AdminMotionStagger` → bloques con `AdminMotionItem`
3. KPIs: `MetricCard` en `admin-kpi-grid` (4 columnas)
4. Tareas / transacciones: `AdminPanel`
5. Salud / Diagnóstico / Estrategia: `AdminSection` + `AdminChartCard` para gráficos Recharts
6. Métricas financieras secundarias: `MetricCard` (grid 3 cols)

## Gráficos

- Usar `AdminChartCard`, no `Card` de shadcn
- Altura mínima chart: `h-[240px] sm:h-[280px] md:h-[300px]`
- Tooltips con `hsl(var(--card))` y `border-border`

## Errores

- `AdminCard` con `border-destructive` y título en rojo
