"use client"

import { DollarSign, Users, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: "total" | "employees" | "date" | "status"
  trend?: {
    value: number
    isPositive: boolean
  }
  accentColor?: "emerald" | "blue" | "amber" | "red"
}

const iconMap = {
  total: DollarSign,
  employees: Users,
  date: Calendar,
  status: Clock,
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.15)]",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
}

function KPICard({ title, value, subtitle, icon, trend, accentColor = "blue" }: KPICardProps) {
  const Icon = iconMap[icon]
  const colors = colorMap[accentColor]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "p-5 transition-all duration-300",
        "hover:border-slate-600/60 hover:shadow-xl",
        "hover:-translate-y-0.5"
      )}
    >
      <div
        className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full",
          "bg-gradient-to-br from-current to-transparent",
          "opacity-10 blur-2xl",
          colors.icon
        )}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            colors.bg,
            colors.glow
          )}
        >
          <Icon className={cn("w-6 h-6", colors.icon)} />
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </p>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          "bg-gradient-to-r from-transparent via-current to-transparent",
          "opacity-20"
        )}
      />
    </div>
  )
}

interface KpiCardsProps {
  totalPayroll: number
  activeEmployees: number
  lastProcessedDate: string
  status: "pending" | "processing" | "completed"
}

export function PayrollKpiCards({
  totalPayroll,
  activeEmployees,
  lastProcessedDate,
  status,
}: KpiCardsProps) {
  const statusConfig = {
    pending: {
      label: "Pendiente",
      color: "amber" as const,
      icon: Clock,
    },
    processing: {
      label: "Procesando",
      color: "blue" as const,
      icon: Clock,
    },
    completed: {
      label: "Completado",
      color: "emerald" as const,
      icon: Clock,
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Nómina"
        value={`Bs ${totalPayroll.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
        subtitle="Período actual"
        icon="total"
        accentColor="emerald"
        trend={{ value: 8.5, isPositive: true }}
      />
      <KPICard
        title="Empleados Activos"
        value={activeEmployees.toString()}
        subtitle="En rol"
        icon="employees"
        accentColor="blue"
      />
      <KPICard
        title="Último Procesamiento"
        value={lastProcessedDate}
        subtitle="Hace 5 días"
        icon="date"
        accentColor="blue"
      />
      <KPICard
        title="Estado"
        value={currentStatus.label}
        subtitle="Nómina actual"
        icon="status"
        accentColor={currentStatus.color}
      />
    </div>
  )
}
