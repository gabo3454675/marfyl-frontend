# Gastos (`/expenses`)

**Override del Master MARFYL**

## Estructura

1. `AdminPageShell` — eyebrow: **Finanzas**
2. Fila KPI: `admin-kpi-grid-3` + `AdminStatCard` (Gastos del mes, Facturas proveedores, Operativos)
3. `ExpenseCharts` lazy (mantener componente actual)
4. Tabs: listados en `AdminCard` + `AdminTableWrap`

## Métricas

- No usar `Card` shadcn para KPIs — solo `AdminStatCard`
