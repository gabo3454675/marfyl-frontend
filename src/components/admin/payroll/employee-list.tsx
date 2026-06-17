"use client"

import { memo } from "react"
import Image from "next/image"
import { Check, Clock, AlertCircle, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AdminCard } from "@/components/admin/admin-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QuickActionPopover } from "./quick-action-popover"
import { calculateEmployeeSalary, type PayrollEmployee } from "@/types/payroll"

export type Employee = PayrollEmployee

interface EmployeeListProps {
  employees: PayrollEmployee[]
  onUpdateBonuses: (employeeId: number, amount: number) => void
  onUpdateDeductions: (employeeId: number, amount: number) => void
}

const statusConfig = {
  paid: {
    label: "Pagado",
    icon: Check,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  review: {
    label: "En revisión",
    icon: AlertCircle,
    className: "bg-primary/10 text-primary border-primary/30",
  },
} as const

const typeLabels = {
  fixed: "Fijo",
  commission: "Comisión",
  hourly: "Por hora",
}

function formatCurrency(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const EmployeeCard = memo(function EmployeeCard({
  employee,
  onAddBonus,
  onAddDeduction,
}: {
  employee: PayrollEmployee
  onAddBonus: (employeeId: number, amount: number) => void
  onAddDeduction: (employeeId: number, amount: number) => void
}) {
  const status = statusConfig[employee.status]
  const totalSalary = calculateEmployeeSalary(employee)
  const StatusIcon = status.icon

  return (
    <AdminCard bodyClassName="p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0 border border-border">
            {employee.avatar ? (
              <Image
                src={employee.avatar}
                alt={employee.name}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials(employee.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">{employee.name}</h3>
              <Badge variant="outline" className={cn("text-[10px]", status.className)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {employee.role} · {typeLabels[employee.type]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Base {formatCurrency(employee.baseSalary)}
              {employee.type === "commission" && employee.commission != null && (
                <span> · +{employee.commission}% comisión</span>
              )}
              {employee.type === "hourly" && employee.hoursWorked != null && (
                <span> · {employee.hoursWorked}h</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:pt-4">
          <QuickActionPopover
            employeeId={employee.memberId}
            currentBonuses={employee.bonuses}
            currentDeductions={employee.deductions}
            onAddBonus={onAddBonus}
            onAddDeduction={onAddDeduction}
          />
          <div className="text-right">
            <p className="text-base font-bold tabular-nums text-foreground">{formatCurrency(totalSalary)}</p>
            {(employee.bonuses > 0 || employee.deductions > 0) && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {employee.bonuses > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">+{employee.bonuses}</span>
                )}
                {employee.bonuses > 0 && employee.deductions > 0 && " · "}
                {employee.deductions > 0 && (
                  <span className="text-red-600 dark:text-red-400">-{employee.deductions}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminCard>
  )
})

export function EmployeeList({
  employees,
  onUpdateBonuses,
  onUpdateDeductions,
}: EmployeeListProps) {
  return (
    <div className="space-y-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.memberId}
          employee={employee}
          onAddBonus={onUpdateBonuses}
          onAddDeduction={onUpdateDeductions}
        />
      ))}
    </div>
  )
}
