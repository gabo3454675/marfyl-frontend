"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, Loader2, Receipt, DollarSign, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { calculateTotalPayroll, formatPayrollTotals, type PayrollEmployee } from "@/types/payroll"

interface PayrollModalProps {
  isOpen: boolean
  onClose: () => void
  employees: PayrollEmployee[]
  onProcess: () => Promise<void>
  isProcessing?: boolean
}

export function PayrollModal({
  isOpen,
  onClose,
  employees,
  onProcess,
  isProcessing: externalProcessing = false,
}: PayrollModalProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [localProcessing, setLocalProcessing] = useState(false)

  const isProcessing = externalProcessing || localProcessing

  useEffect(() => {
    if (isOpen) {
      setIsComplete(false)
      setLocalProcessing(false)
    }
  }, [isOpen])

  const totals = useMemo(() => {
    let totalFixedUsd = 0
    let totalFixedVes = 0
    let totalCommissionUsd = 0
    let totalCommissionVes = 0
    let totalBonusesUsd = 0
    let totalBonusesVes = 0
    let totalDeductionsUsd = 0
    let totalDeductionsVes = 0

    employees.forEach((emp) => {
      const isVes = emp.payCurrency === "VES"
      if (emp.type === "fixed" || emp.type === "hourly") {
        let base = emp.baseSalary
        if (emp.type === "hourly" && emp.hoursWorked) {
          base = base * emp.hoursWorked
        }
        if (isVes) totalFixedVes += base
        else totalFixedUsd += base
      } else if (emp.type === "commission") {
        const comm = emp.baseSalary + emp.baseSalary * ((emp.commission ?? 0) / 100)
        if (isVes) totalCommissionVes += comm
        else totalCommissionUsd += comm
      }
      if (isVes) {
        totalBonusesVes += emp.bonuses
        totalDeductionsVes += emp.deductions
      } else {
        totalBonusesUsd += emp.bonuses
        totalDeductionsUsd += emp.deductions
      }
    })

    return {
      totalFixedUsd,
      totalFixedVes,
      totalCommissionUsd,
      totalCommissionVes,
      totalBonusesUsd,
      totalBonusesVes,
      totalDeductionsUsd,
      totalDeductionsVes,
      employeeCount: employees.length,
    }
  }, [employees])

  const grandTotals = useMemo(() => calculateTotalPayroll(employees), [employees])

  const handleProcess = async () => {
    setLocalProcessing(true)
    try {
      await onProcess()
      setIsComplete(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      setLocalProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        className={cn(
          "relative flex w-full max-w-md flex-col overflow-hidden border bg-card shadow-2xl",
          "max-h-[min(92dvh,640px)] rounded-t-2xl sm:rounded-2xl",
        )}
      >
        {isComplete && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/10 backdrop-blur-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
              <Check className="h-10 w-10 text-white" />
            </div>
            <p className="mt-4 text-lg font-semibold text-emerald-600 dark:text-emerald-400">¡Nómina Procesada!</p>
          </div>
        )}

        <div className="shrink-0 border-b p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Procesar Nómina</h2>
              <p className="text-sm text-muted-foreground">Revisa el resumen antes de continuar</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Empleados
              </div>
              <p className="text-xl font-bold">{totals.employeeCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" />
                Total
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPayrollTotals(grandTotals)}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Desglose
            </div>
            <div className="space-y-2 text-sm">
              {(totals.totalFixedUsd > 0 || totals.totalFixedVes > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sueldos fijos</span>
                  <span className="font-medium text-right">
                    {totals.totalFixedUsd > 0 && `$ ${totals.totalFixedUsd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                    {totals.totalFixedUsd > 0 && totals.totalFixedVes > 0 && " · "}
                    {totals.totalFixedVes > 0 && `Bs ${totals.totalFixedVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
              {(totals.totalCommissionUsd > 0 || totals.totalCommissionVes > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisiones</span>
                  <span className="font-medium text-right">
                    {totals.totalCommissionUsd > 0 && `$ ${totals.totalCommissionUsd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                    {totals.totalCommissionUsd > 0 && totals.totalCommissionVes > 0 && " · "}
                    {totals.totalCommissionVes > 0 && `Bs ${totals.totalCommissionVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
              {(totals.totalBonusesUsd > 0 || totals.totalBonusesVes > 0) && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>+ Bonificaciones</span>
                  <span className="font-medium text-right">
                    {totals.totalBonusesUsd > 0 && `$ ${totals.totalBonusesUsd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                    {totals.totalBonusesUsd > 0 && totals.totalBonusesVes > 0 && " · "}
                    {totals.totalBonusesVes > 0 && `Bs ${totals.totalBonusesVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
              {(totals.totalDeductionsUsd > 0 || totals.totalDeductionsVes > 0) && (
                <div className="flex justify-between text-red-500">
                  <span>- Deducciones</span>
                  <span className="font-medium text-right">
                    {totals.totalDeductionsUsd > 0 && `$ ${totals.totalDeductionsUsd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                    {totals.totalDeductionsUsd > 0 && totals.totalDeductionsVes > 0 && " · "}
                    {totals.totalDeductionsVes > 0 && `Bs ${totals.totalDeductionsVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Neto a pagar</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatPayrollTotals(grandTotals)}</span>
              </div>
            </div>
          </div>

          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            Se registrarán gastos en categoría Nómina. Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="shrink-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="min-h-[44px] flex-1 cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleProcess} disabled={isProcessing || isComplete} className="min-h-[44px] flex-1 cursor-pointer">
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmar
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
