"use client"

import { useState } from "react"
import { User, Check, Clock, AlertCircle, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { QuickActionPopover } from "./quick-action-popover"

export interface Employee {
  id: number
  name: string
  avatar: string | null
  role: string
  type: "fixed" | "commission" | "hourly"
  baseSalary: number
  commission?: number
  hoursWorked?: number
  bonuses: number
  deductions: number
  status: "paid" | "pending" | "review"
}

interface EmployeeListProps {
  employees: Employee[]
  onUpdateBonuses: (employeeId: number, amount: number) => void
  onUpdateDeductions: (employeeId: number, amount: number) => void
}

const statusConfig = {
  paid: {
    label: "Pagado",
    variant: "default" as const,
    icon: Check,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  pending: {
    label: "Pendiente",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  review: {
    label: "En Revisión",
    variant: "secondary" as const,
    icon: AlertCircle,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
}

const typeLabels = {
  fixed: "Fijo",
  commission: "Comisión",
  hourly: "Por Hora",
}

function formatCurrency(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

function calculateSalary(employee: Employee): number {
  let base = employee.baseSalary

  if (employee.type === "hourly" && employee.hoursWorked) {
    base = base * employee.hoursWorked
  } else if (employee.type === "commission") {
    return base + (employee.baseSalary * ((employee.commission || 0) / 100))
  }

  return base + employee.bonuses - employee.deductions
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(id: number): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-purple-500 to-purple-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
  ]
  return colors[id % colors.length]
}

function EmployeeCard({
  employee,
  onAddBonus,
  onAddDeduction,
}: {
  employee: Employee
  onAddBonus: (employeeId: number, amount: number) => void
  onAddDeduction: (employeeId: number, amount: number) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const status = statusConfig[employee.status]
  const totalSalary = calculateSalary(employee)
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-slate-800/60 to-slate-900/80",
        "border border-slate-700/50",
        "p-4 transition-all duration-300",
        "hover:border-slate-600/60 hover:shadow-lg hover:shadow-slate-900/50",
        "hover:-translate-y-0.5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5",
          "opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}
      />

      <div className="relative flex items-center gap-4">
        <div className="relative">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br text-white font-semibold text-sm",
              getAvatarColor(employee.id),
              "shadow-lg"
            )}
          >
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(employee.name)
            )}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full",
              "border-2 border-slate-800",
              employee.status === "paid" && "bg-emerald-500",
              employee.status === "pending" && "bg-amber-500",
              employee.status === "review" && "bg-blue-500"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {employee.name}
            </h3>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", status.className)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {employee.role} · {typeLabels[employee.type]}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="text-slate-500">
              Base:{" "}
              <span className="text-slate-300">
                {formatCurrency(employee.baseSalary)}
              </span>
            </span>
            {employee.type === "commission" && employee.commission && (
              <span className="text-slate-500">
                +{employee.commission}% Comisión
              </span>
            )}
            {employee.type === "hourly" && employee.hoursWorked && (
              <span className="text-slate-500">
                {employee.hoursWorked}h × {formatCurrency(employee.baseSalary)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <QuickActionPopover
            employeeId={employee.id}
            currentBonuses={employee.bonuses}
            currentDeductions={employee.deductions}
            onAddBonus={onAddBonus}
            onAddDeduction={onAddDeduction}
          >
            <div className="flex items-center gap-1">
              <button
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  "bg-emerald-500/10 text-emerald-400",
                  "hover:bg-emerald-500/20 hover:text-emerald-300",
                  "active:scale-95"
                )}
                aria-label="Agregar bonificación"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  "bg-red-500/10 text-red-400",
                  "hover:bg-red-500/20 hover:text-red-300",
                  "active:scale-95"
                )}
                aria-label="Agregar deducción"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </QuickActionPopover>

          <div className="text-right">
            <p className="text-sm font-bold text-slate-100">
              {formatCurrency(totalSalary)}
            </p>
            {(employee.bonuses > 0 || employee.deductions > 0) && (
              <p className="text-[10px] text-slate-500">
                {employee.bonuses > 0 && (
                  <span className="text-emerald-500">+{employee.bonuses}</span>
                )}
                {employee.bonuses > 0 && employee.deductions > 0 && " · "}
                {employee.deductions > 0 && (
                  <span className="text-red-500">-{employee.deductions}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmployeeList({
  employees,
  onUpdateBonuses,
  onUpdateDeductions,
}: EmployeeListProps) {
  return (
    <div className="space-y-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onAddBonus={onUpdateBonuses}
          onAddDeduction={onUpdateDeductions}
        />
      ))}
    </div>
  )
}
