"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Lock, Unlock, DollarSign, CreditCard, Smartphone, Banknote, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BoxSummary {
  cashBs: number
  cashUsd: number
  pagoMovil: number
  zelle: number
  total: number
  exchangeRate: number
}

interface CashboxModalProps {
  type: "open" | "close"
  isOpen: boolean
  onClose: () => void
  onOpenBox: (amount: number) => Promise<void>
  onCloseBox: (data: { physicalAmountBs: number; physicalAmountUsd: number; observations: string }) => Promise<void>
  summary?: BoxSummary
}

function formatCurrency(amount: number, currency: "Bs" | "$" = "Bs"): string {
  return `${currency} ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

export function CashboxModal({
  type,
  isOpen,
  onClose,
  onOpenBox,
  onCloseBox,
  summary,
}: CashboxModalProps) {
  const [initialAmount, setInitialAmount] = useState("")
  const [physicalAmountBs, setPhysicalAmountBs] = useState("")
  const [physicalAmountUsd, setPhysicalAmountUsd] = useState("")
  const [observations, setObservations] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setInitialAmount("")
      setPhysicalAmountBs("")
      setPhysicalAmountUsd("")
      setObservations("")
      setIsLoading(false)
      setIsComplete(false)
    }
  }, [isOpen, type])

  const handleOpenBox = async () => {
    const amount = parseFloat(initialAmount.replace(/,/g, ""))
    if (amount > 0) {
      setIsLoading(true)
      await onOpenBox(amount)
      setIsLoading(false)
      setIsComplete(true)
      setTimeout(() => onClose(), 1500)
    }
  }

  const handleCloseBox = async () => {
    setIsLoading(true)
    await onCloseBox({
      physicalAmountBs: parseFloat(physicalAmountBs.replace(/,/g, "")) || 0,
      physicalAmountUsd: parseFloat(physicalAmountUsd.replace(/,/g, "")) || 0,
      observations
    })
    setIsLoading(false)
    setIsComplete(true)
    setTimeout(() => onClose(), 1500)
  }

  const formatInputNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, "")
    const parts = cleaned.split(".")
    if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("")
    if (parts[1] && parts[1].length > 2) return parts[0] + "." + parts[1].slice(0, 2)
    return cleaned
  }

  if (!isOpen) return null

  const isOpenType = type === "open"

  const totalPhysicalBs = (parseFloat(physicalAmountBs.replace(/,/g, "") || "0")) +
    (parseFloat(physicalAmountUsd.replace(/,/g, "") || "0") * (summary?.exchangeRate || 36.5))

  const difference = summary ? totalPhysicalBs - summary.total : 0
  const differencePercent = summary ? ((difference / summary.total) * 100).toFixed(1) : "0"

  const totalExpectedPercent = summary ? [
    { label: 'Efectivo Bs', value: summary.cashBs, percent: summary.total > 0 ? (summary.cashBs / summary.total) * 100 : 0, color: 'from-emerald-500 to-emerald-400' },
    { label: 'Efectivo USD', value: summary.cashUsd, percent: summary.total > 0 ? (summary.cashUsd / summary.total) * 100 : 0, color: 'from-blue-500 to-blue-400' },
    { label: 'Pago Móvil', value: summary.pagoMovil, percent: summary.total > 0 ? (summary.pagoMovil / summary.total) * 100 : 0, color: 'from-purple-500 to-purple-400' },
    { label: 'Zelle', value: summary.zelle, percent: summary.total > 0 ? (summary.zelle / summary.total) * 100 : 0, color: 'from-amber-500 to-amber-400' },
  ].filter(item => item.value > 0) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className={cn(
        "relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "border border-slate-700/50",
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
        "animate-in fade-in zoom-in-95 duration-300"
      )}>
        {isComplete && (
          <div className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center",
            isOpenType ? "bg-emerald-500/20" : "bg-red-500/20",
            "backdrop-blur-sm"
          )}>
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              isOpenType ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.5)]" : "bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)]",
              "animate-in zoom-in duration-500"
            )}>
              <Check className="w-10 h-10 text-white" />
            </div>
            <p className={cn("mt-4 text-lg font-semibold", isOpenType ? "text-emerald-400" : "text-red-400")}>
              {isOpenType ? "¡Caja Abierta!" : "¡Caja Cerrada!"}
            </p>
          </div>
        )}

        <div className="relative p-6 pb-4">
          <div className={cn("absolute top-0 left-0 right-0 h-1", isOpenType ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400")} />

          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isOpenType ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/20 border border-red-500/30")}>
              {isOpenType ? <Unlock className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6 text-red-400" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                {isOpenType ? "Abrir Caja" : "Cerrar Caja"}
              </h2>
              <p className="text-sm text-slate-400">{isOpenType ? "Ingresa el monto inicial" : "Revisa el resumen y cierra"}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {isOpenType ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Monto Inicial (Bs)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">Bs</span>
                  <input type="text" value={initialAmount} onChange={(e) => setInitialAmount(formatInputNumber(e.target.value))}
                    placeholder="0.00"
                    className={cn("w-full h-14 pl-12 pr-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xl font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-200")} />
                </div>
                <p className="text-xs text-slate-500">Este monto será el saldo inicial de la caja para comenzar el día</p>
              </div>

              <div className="flex gap-2">
                {[1000, 5000, 10000, 50000].map((amount) => (
                  <button key={amount} onClick={() => setInitialAmount(amount.toString())}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-200">
                    Bs {amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {summary && (
                <>
                  <div className={cn("rounded-xl p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50")}>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Resumen del Día
                    </h3>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400"><Banknote className="w-4 h-4" />Efectivo Bs</div>
                        <span className="font-medium text-slate-200">{formatCurrency(summary.cashBs)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400"><Banknote className="w-4 h-4" />Efectivo USD</div>
                        <span className="font-medium text-slate-200">{formatCurrency(summary.cashUsd, "$")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400"><Smartphone className="w-4 h-4" />Pago Móvil</div>
                        <span className="font-medium text-slate-200">{formatCurrency(summary.pagoMovil)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400"><CreditCard className="w-4 h-4" />Zelle</div>
                        <span className="font-medium text-slate-200">{formatCurrency(summary.zelle, "$")}</span>
                      </div>
                      <div className="border-t border-slate-700/50 pt-2 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-300">Total en Sistema</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(summary.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cn("rounded-xl p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50")}>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      Distribución de Ventas
                    </h3>
                    <div className="space-y-2">
                      {totalExpectedPercent.map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{item.label}</span>
                            <span className="text-slate-300 font-medium">{item.percent.toFixed(1)}% <span className="text-slate-500">({formatCurrency(item.value)})</span></span>
                          </div>
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", item.color)}
                              style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn("rounded-xl p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50")}>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-red-400" />
                      Cuadre de Caja
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500">Efectivo Bs</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Bs</span>
                          <input type="text" value={physicalAmountBs} onChange={(e) => setPhysicalAmountBs(formatInputNumber(e.target.value))}
                            placeholder="0.00"
                            className="w-full h-11 pl-10 pr-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500">Efectivo USD</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
                          <input type="text" value={physicalAmountUsd} onChange={(e) => setPhysicalAmountUsd(formatInputNumber(e.target.value))}
                            placeholder="0.00"
                            className="w-full h-11 pl-8 pr-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Tasa BCV: {summary.exchangeRate.toFixed(2)} Bs/USD</p>
                  </div>

                  <div className={cn("rounded-xl p-4 border transition-all duration-300", difference === 0 ? "bg-amber-500/10 border-amber-500/30" : difference > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {difference === 0 ? <Minus className="w-5 h-5 text-amber-400" /> : difference > 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                        <div>
                          <p className="text-sm font-medium text-slate-300">Diferencia</p>
                          <p className="text-xs text-slate-500">Total físico vs Sistema</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold", difference === 0 ? "text-amber-400" : difference > 0 ? "text-emerald-400" : "text-red-400")}>
                          {difference > 0 ? "+" : ""}{formatCurrency(Math.abs(difference))}
                        </p>
                        <p className={cn("text-xs", difference === 0 ? "text-amber-400/70" : difference > 0 ? "text-emerald-400/70" : "text-red-400/70")}>
                          {difference > 0 ? "+" : ""}{differencePercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Observaciones</label>
                <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
                  placeholder="Agrega notas sobre el cierre de caja..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl resize-none bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
              </div>
            </>
          )}
        </div>

        <div className="relative px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}
              className="flex-1 h-11 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button onClick={isOpenType ? handleOpenBox : handleCloseBox} disabled={isLoading || isComplete}
              className={cn("flex-1 h-11 transition-all duration-300",
                isOpenType ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25" : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed")}>
              {isLoading ? (
                <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{isOpenType ? "Abriendo..." : "Cerrando..."}</div>
              ) : (
                <div className="flex items-center gap-2">
                  {isOpenType ? <><Unlock className="w-4 h-4" />Abrir Caja</> : <><Lock className="w-4 h-4" />Cerrar y Generar</>}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
