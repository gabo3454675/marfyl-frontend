"use client"

import { memo } from "react"
import { DollarSign, Users, Calendar, Clock } from "lucide-react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"

interface KpiCardsProps {
  totalPayroll: number
  employeeCount: number
  pendingPayments: number
  lastProcessedDate: string
  status: "pending" | "processing" | "completed"
}

export const PayrollKpiCards = memo(function PayrollKpiCards({
  totalPayroll,
  employeeCount,
  pendingPayments,
  lastProcessedDate,
  status,
}: KpiCardsProps) {
  const statusLabels = {
    pending: "Pendiente",
    processing: "En revisión",
    completed: "Completado",
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        title="Total nómina"
        value={`Bs ${totalPayroll.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
        icon={DollarSign}
      />
      <AdminStatCard title="Miembros activos" value={employeeCount} icon={Users} />
      <AdminStatCard title="Pagos pendientes" value={pendingPayments} icon={Clock} />
      <AdminStatCard
        title="Último procesamiento"
        value={lastProcessedDate}
        icon={Calendar}
        className={
          status === "completed"
            ? "border-emerald-500/25"
            : status === "pending"
              ? "border-amber-500/25"
              : "border-primary/25"
        }
      />
      <p className="col-span-full text-xs text-muted-foreground -mt-2">
        Estado del período: {statusLabels[status]}
      </p>
    </div>
  )
})
