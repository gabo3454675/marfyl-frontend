"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Receipt, DollarSign, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "./employee-list"

interface PayrollModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  onProcess: () => Promise<void>
}

interface SummaryItem {
  label: string
  value: number
  type: "fixed" | "commission" | "bonus" | "deduction"
}

function formatCurrency(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

export function PayrollModal({
  isOpen,
  onClose,
  employees,
  onProcess,
}: PayrollModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false)
      setIsComplete(false)
    }
  }, [isOpen])

  const calculateTotals = () => {
    const items: SummaryItem[] = []
    let totalFixed = 0
    let totalCommission = 0
    let totalBonuses = 0
    let totalDeductions = 0
    let employeeCount = employees.length

    employees.forEach((emp) => {
      if (emp.type === "fixed" || emp.type === "hourly") {
        let base = emp.baseSalary
        if (emp.type === "hourly" && emp.hoursWorked) {
          base = base * emp.hoursWorked
        }
        totalFixed += base
      } else if (emp.type === "commission") {
        totalCommission += emp.baseSalary + (emp.baseSalary * ((emp.commission || 0) / 100))
      }

      totalBonuses += emp.bonuses
      totalDeductions += emp.deductions
    })

    return { totalFixed, totalCommission, totalBonuses, totalDeductions, employeeCount }
  }

  const totals = calculateTotals()
  const grandTotal =
    totals.totalFixed +
    totals.totalCommission +
    totals.totalBonuses -
    totals.totalDeductions

  const handleProcess = async () => {
    setIsProcessing(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      await onProcess()
      setIsProcessing(false)
      setIsComplete(true)

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full max-w-md mx-4 rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "border border-slate-700/50",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
          "animate-in fade-in zoom-in-95 duration-300"
        )}
      >
        {isComplete && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center",
              "bg-emerald-500/20 backdrop-blur-sm",
              "animate-in fade-in duration-300"
            )}
          >
            <div
              className={cn(
                "w-20 h-20 rounded-full",
                "bg-gradient-to-br from-emerald-400 to-emerald-600",
                "flex items-center justify-center",
                "shadow-[0_0_40px_rgba(16,185,129,0.5)]",
                "animate-in zoom-in duration-500"
              )}
            >
              <Check className="w-10 h-10 text-white" />
            </div>
            <p className="mt-4 text-lg font-semibold text-emerald-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
              ¡Nómina Procesada!
            </p>
          </div>
        )}

        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
                "border border-blue-500/30"
              )}
            >
              <Receipt className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Procesar Nómina
              </h2>
              <p className="text-sm text-slate-400">
                Revisa el resumen antes de continuar
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-slate-800/50 border border-slate-700/50"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Users className="w-3.5 h-3.5" />
                Empleados
              </div>
              <p className="text-xl font-bold text-slate-100">
                {totals.employeeCount}
              </p>
            </div>

            <div
              className={cn(
                "rounded-xl p-4",
                "bg-emerald-500/10 border border-emerald-500/30"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                <DollarSign className="w-3.5 h-3.5" />
                Total
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl p-4",
              "bg-slate-800/30 border border-slate-700/50"
            )}
          >
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              Desglose
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Sueldos Fijos</span>
                <span className="font-medium text-slate-200">
                  {formatCurrency(totals.totalFixed)}
                </span>
              </div>

              {totals.totalCommission > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Comisiones</span>
                  <span className="font-medium text-slate-200">
                    {formatCurrency(totals.totalCommission)}
                  </span>
                </div>
              )}

              {totals.totalBonuses > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">+ Bonificaciones</span>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(totals.totalBonuses)}
                  </span>
                </div>
              )}

              {totals.totalDeductions > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-400">- Deducciones</span>
                  <span className="font-medium text-red-400">
                    {formatCurrency(totals.totalDeductions)}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-700/50 pt-2 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-300">Neto a Pagar</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              "bg-amber-500/10 border border-amber-500/20"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-amber-400">!</span>
            </div>
            <p className="text-xs text-amber-200/80">
              Esta acción registrará los pagos y no podrá deshacerse. Asegúrate
              de que todos los datos sean correctos.
            </p>
          </div>
        </div>

        <div className="relative px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-11 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing || isComplete}
              className={cn(
                "flex-1 h-11 transition-all duration-300",
                "bg-gradient-to-r from-emerald-500 to-emerald-600",
                "hover:from-emerald-400 hover:to-emerald-500",
                "shadow-lg shadow-emerald-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Confirmar y Procesar
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
