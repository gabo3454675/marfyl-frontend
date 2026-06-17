"use client"

import { memo, useMemo } from "react"
import { DollarSign, Users, Calendar, Activity } from "lucide-react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { formatPayrollTotals, type PayrollEmployee } from "@/types/payroll"

interface KpiCardsProps {
  employees: PayrollEmployee[]
  totals: { usd: number; ves: number }
  pendingPayments: number
  lastProcessedDate: string
  daysSinceLastProcess: number | null
  status: "pending" | "processing" | "completed"
}

export const PayrollKpiCards = memo(function PayrollKpiCards({
  employees,
  totals,
  pendingPayments,
  lastProcessedDate,
  daysSinceLastProcess,
  status,
}: KpiCardsProps) {
  const statusLabels = {
    pending: "Pendiente",
    processing: "En revisión",
    completed: "Completado",
  }

  const lastHint = useMemo(() => {
    if (lastProcessedDate === "—") return "Sin procesar"
    if (daysSinceLastProcess == null) return "Nómina actual"
    if (daysSinceLastProcess === 0) return "Hoy"
    if (daysSinceLastProcess === 1) return "Hace 1 día"
    return `Hace ${daysSinceLastProcess} días`
  }, [lastProcessedDate, daysSinceLastProcess])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        title="Total nómina"
        value={formatPayrollTotals(totals)}
        hint={totals.usd > 0 && totals.ves > 0 ? "Bimoneda (USD + Bs)" : undefined}
        icon={DollarSign}
      />
      <AdminStatCard
        title="Empleados activos"
        value={employees.length}
        hint="En rol"
        icon={Users}
      />
      <AdminStatCard
        title="Último procesamiento"
        value={lastProcessedDate}
        hint={lastHint}
        icon={Calendar}
      />
      <AdminStatCard
        title="Estado"
        value={statusLabels[status]}
        hint="Nómina actual"
        icon={Activity}
        className={
          status === "completed"
            ? "border-emerald-500/25"
            : status === "pending"
              ? "border-amber-500/25"
              : "border-primary/25"
        }
      />
    </div>
  )
})
