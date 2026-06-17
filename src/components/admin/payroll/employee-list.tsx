"use client"

import { memo } from "react"
import Image from "next/image"
import { Check, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AdminCard } from "@/components/admin/admin-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QuickActionPopover } from "./quick-action-popover"
import {
  calculateEmployeeSalary,
  formatPayrollMoney,
  type PayrollCurrency,
  type PayrollEmployee,
} from "@/types/payroll"

export type Employee = PayrollEmployee

interface EmployeeListProps {
  employees: PayrollEmployee[]
  onUpdateBonuses: (employeeId: number, amount: number) => void
  onUpdateDeductions: (employeeId: number, amount: number) => void
  onUpdateCurrency: (employeeId: number, currency: PayrollCurrency) => void
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
  onUpdateCurrency,
}: {
  employee: PayrollEmployee
  onAddBonus: (employeeId: number, amount: number) => void
  onAddDeduction: (employeeId: number, amount: number) => void
  onUpdateCurrency: (employeeId: number, currency: PayrollCurrency) => void
}) {
  const status = statusConfig[employee.status]
  const totalSalary = calculateEmployeeSalary(employee)
  const StatusIcon = status.icon
  const currency = employee.payCurrency ?? "USD"

  return (
    <AdminCard bodyClassName="p-3 sm:p-4">
      <div className="flex items-center gap-3">
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
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
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
          <p className="mt-0.5 text-xs text-muted-foreground">
            Base: {formatPayrollMoney(employee.baseSalary, currency)}
            {employee.type === "commission" && employee.commission != null && (
              <span> · +{employee.commission}% comisión</span>
            )}
            {employee.type === "hourly" && employee.hoursWorked != null && (
              <span> · {employee.hoursWorked}h</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onUpdateCurrency(employee.memberId, currency === "USD" ? "VES" : "USD")}
            className="cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted"
            title="Cambiar moneda de pago (USD / Bs)"
          >
            {currency === "USD" ? "USD" : "Bs"}
          </button>
          <QuickActionPopover
            employeeId={employee.memberId}
            payCurrency={currency}
            currentBonuses={employee.bonuses}
            currentDeductions={employee.deductions}
            onAddBonus={onAddBonus}
            onAddDeduction={onAddDeduction}
          />
          <div className="min-w-[5.5rem] text-right">
            <p className="text-sm font-bold tabular-nums text-foreground sm:text-base">
              {formatPayrollMoney(totalSalary, currency)}
            </p>
            {(employee.bonuses > 0 || employee.deductions > 0) && (
              <p className="text-[10px] tabular-nums text-muted-foreground">
                {employee.bonuses > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">+{employee.bonuses}</span>
                )}
                {employee.bonuses > 0 && employee.deductions > 0 && " "}
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
  onUpdateCurrency,
}: EmployeeListProps) {
  return (
    <div className="space-y-2.5">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.memberId}
          employee={employee}
          onAddBonus={onUpdateBonuses}
          onAddDeduction={onUpdateDeductions}
          onUpdateCurrency={onUpdateCurrency}
        />
      ))}
    </div>
  )
}
