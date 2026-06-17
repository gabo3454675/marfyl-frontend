"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Lock, Unlock, DollarSign, CreditCard, Smartphone, Banknote, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { BoxSummary } from "@/lib/api/cierre-caja"

interface CashboxModalProps {
  type: "open" | "close"
  isOpen: boolean
  onClose: () => void
  onOpenBox: (amount: number) => Promise<void>
  onCloseBox: (data: { physicalAmountBs: number; physicalAmountUsd: number; observations: string }) => Promise<void>
  summary?: BoxSummary
}

function formatUsd(amount: number): string {
  return `$ ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

function formatBs(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setInitialAmount("")
      setPhysicalAmountBs("")
      setPhysicalAmountUsd("")
      setObservations("")
      setIsLoading(false)
      setIsComplete(false)
      setErrorMsg(null)
    }
  }, [isOpen, type])

  const formatInputNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, "")
    const parts = cleaned.split(".")
    if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("")
    if (parts[1] && parts[1].length > 2) return parts[0] + "." + parts[1].slice(0, 2)
    return cleaned
  }

  const handleOpenBox = async () => {
    const amount = parseFloat(initialAmount.replace(/,/g, ""))
    if (Number.isNaN(amount) || amount < 0) {
      setErrorMsg("Ingresa un monto inicial válido (USD).")
      return
    }
    setIsLoading(true)
    setErrorMsg(null)
    try {
      await onOpenBox(amount)
      setIsComplete(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      setErrorMsg("No se pudo abrir la caja. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseBox = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      await onCloseBox({
        physicalAmountBs: parseFloat(physicalAmountBs.replace(/,/g, "")) || 0,
        physicalAmountUsd: parseFloat(physicalAmountUsd.replace(/,/g, "")) || 0,
        observations,
      })
      setIsComplete(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      setErrorMsg("No se pudo cerrar la caja. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const isOpenType = type === "open"
  const physUsd = parseFloat(physicalAmountUsd.replace(/,/g, "") || "0")
  const physBs = parseFloat(physicalAmountBs.replace(/,/g, "") || "0")
  const diffUsd = summary ? physUsd - summary.totalUsd : 0
  const diffVes = summary ? physBs - summary.totalVes : 0

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div className={cn(
        "relative z-10 flex min-h-0 flex-1 flex-col",
        "mx-auto w-full max-w-2xl",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
      )}>
        {isComplete && (
          <div className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm",
            isOpenType ? "bg-emerald-500/15" : "bg-red-500/15",
          )}>
            <div className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl",
              isOpenType ? "bg-emerald-500" : "bg-red-500",
            )}>
              <Check className="h-10 w-10" />
            </div>
            <p className={cn("mt-4 text-lg font-semibold", isOpenType ? "text-emerald-600" : "text-red-600")}>
              {isOpenType ? "¡Caja Abierta!" : "¡Caja Cerrada!"}
            </p>
          </div>
        )}

        <div className={cn("h-1 shrink-0", isOpenType ? "bg-emerald-500" : "bg-red-500")} />

        <header className="shrink-0 border-b px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border",
              isOpenType ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10",
            )}>
              {isOpenType ? <Unlock className="h-5 w-5 text-emerald-500" /> : <Lock className="h-5 w-5 text-red-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{isOpenType ? "Abrir Caja" : "Cerrar Caja"}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {isOpenType ? "Monto inicial en USD para iniciar el turno" : "Conciliación bimoneda del turno"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading} className="min-h-[44px] shrink-0 cursor-pointer">
              Cerrar
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {errorMsg && (
            <p className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMsg}
            </p>
          )}

          {isOpenType ? (
            <div className="mx-auto max-w-md space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Monto Inicial (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(formatInputNumber(e.target.value))}
                  placeholder="0.00"
                  className="h-14 min-h-[44px] w-full rounded-xl border bg-muted/30 pl-10 pr-4 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <p className="text-xs text-muted-foreground">Saldo inicial en dólares con el que comienza el turno.</p>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setInitialAmount(amount.toString())}
                    className="min-h-[44px] flex-1 min-w-[4.5rem] rounded-lg border py-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-4 pb-4">
              <section className="rounded-xl border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Resumen del turno
                </h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground">Monto inicial USD</span>
                    <span className="font-medium">{formatUsd(summary.montoInicial)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />Efectivo USD</span>
                    <span className="font-medium">{formatUsd(summary.cashUsd)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />Efectivo Bs</span>
                    <span className="font-medium">{formatBs(summary.cashBs)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" />Pago Móvil</span>
                    <span className="font-medium">{formatBs(summary.pagoMovil)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" />POS / Zelle</span>
                    <span className="font-medium">{formatUsd(summary.zelle)}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
                  <div className="flex justify-between font-medium">
                    <span>Total esperado USD</span>
                    <span className="text-emerald-600">{formatUsd(summary.totalUsd)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total esperado Bs</span>
                    <span className="text-emerald-600">{formatBs(summary.totalVes)}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium">Cuadre físico</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Efectivo USD contado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={physicalAmountUsd}
                        onChange={(e) => setPhysicalAmountUsd(formatInputNumber(e.target.value))}
                        placeholder="0.00"
                        className="h-11 w-full rounded-lg border bg-muted/30 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Efectivo Bs contado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Bs</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={physicalAmountBs}
                        onChange={(e) => setPhysicalAmountBs(formatInputNumber(e.target.value))}
                        placeholder="0.00"
                        className="h-11 w-full rounded-lg border bg-muted/30 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <DiffCard label="Diferencia USD" value={diffUsd} formatter={formatUsd} />
                <DiffCard label="Diferencia Bs" value={diffVes} formatter={formatBs} />
              </section>

              <div>
                <label className="mb-2 block text-sm font-medium">Observaciones</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Notas sobre el cierre..."
                  rows={2}
                  className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Cargando resumen del turno...</p>
          )}
        </div>

        <footer className="shrink-0 border-t bg-card/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col-reverse gap-3 sm:flex-row">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="min-h-[44px] flex-1 cursor-pointer">
              Cancelar
            </Button>
            <Button
              onClick={isOpenType ? handleOpenBox : handleCloseBox}
              disabled={isLoading || isComplete}
              className={cn("min-h-[44px] flex-1 cursor-pointer", isOpenType ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500")}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isOpenType ? "Abriendo..." : "Cerrando..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isOpenType ? <><Unlock className="h-4 w-4" />Abrir Caja</> : <><Lock className="h-4 w-4" />Cerrar y Generar</>}
                </span>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function DiffCard({
  label,
  value,
  formatter,
}: {
  label: string
  value: number
  formatter: (n: number) => string
}) {
  const isZero = Math.abs(value) < 0.01
  return (
    <div className={cn(
      "rounded-xl border p-4",
      isZero ? "border-amber-500/30 bg-amber-500/10" : value > 0 ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10",
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isZero ? <Minus className="h-4 w-4 text-amber-500" /> : value > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          <p className="text-sm font-medium">{label}</p>
        </div>
        <p className={cn("font-bold", isZero ? "text-amber-600" : value > 0 ? "text-emerald-600" : "text-red-600")}>
          {value > 0 ? "+" : value < 0 ? "-" : ""}{formatter(Math.abs(value))}
        </p>
      </div>
    </div>
  )
}
