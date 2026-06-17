"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, Loader2, Receipt, DollarSign, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { calculateEmployeeSalary, calculateTotalPayroll, type PayrollEmployee } from "@/types/payroll"

interface PayrollModalProps {
  isOpen: boolean
  onClose: () => void
  employees: PayrollEmployee[]
  onProcess: () => Promise<void>
  isProcessing?: boolean
}

function formatCurrency(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
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
    let totalFixed = 0
    let totalCommission = 0
    let totalBonuses = 0
    let totalDeductions = 0

    employees.forEach((emp) => {
      if (emp.type === "fixed" || emp.type === "hourly") {
        let base = emp.baseSalary
        if (emp.type === "hourly" && emp.hoursWorked) {
          base = base * emp.hoursWorked
        }
        totalFixed += base
      } else if (emp.type === "commission") {
        totalCommission += emp.baseSalary + emp.baseSalary * ((emp.commission ?? 0) / 100)
      }
      totalBonuses += emp.bonuses
      totalDeductions += emp.deductions
    })

    return { totalFixed, totalCommission, totalBonuses, totalDeductions, employeeCount: employees.length }
  }, [employees])

  const grandTotal = useMemo(() => calculateTotalPayroll(employees), [employees])

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm sm:items-center sm:justify-center sm:bg-black/60 sm:p-4">
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} aria-hidden />

      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden border bg-card shadow-2xl",
          "sm:max-h-[min(90dvh,640px)] sm:w-full sm:max-w-md sm:flex-none sm:rounded-2xl",
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
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Desglose
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sueldos Fijos</span>
                <span className="font-medium">{formatCurrency(totals.totalFixed)}</span>
              </div>
              {totals.totalCommission > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisiones</span>
                  <span className="font-medium">{formatCurrency(totals.totalCommission)}</span>
                </div>
              )}
              {totals.totalBonuses > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>+ Bonificaciones</span>
                  <span className="font-medium">{formatCurrency(totals.totalBonuses)}</span>
                </div>
              )}
              {totals.totalDeductions > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>- Deducciones</span>
                  <span className="font-medium">{formatCurrency(totals.totalDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Neto a Pagar</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
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
