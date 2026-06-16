"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CashboxModal } from "./cashbox-modal"

interface BoxSummary {
  cashBs: number
  cashUsd: number
  pagoMovil: number
  zelle: number
  total: number
  exchangeRate: number
}

interface CashboxSwitchProps {
  isBoxOpen: boolean
  boxOpenedAt: Date | null
  initialAmount: number
  onOpenBox: (amount: number) => Promise<void>
  onCloseBox: (data: {
    physicalAmountBs: number
    physicalAmountUsd: number
    observations: string
  }) => Promise<void>
  summary?: BoxSummary
}

function formatCurrency(amount: number): string {
  return `Bs ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function CashboxSwitch({
  isBoxOpen,
  boxOpenedAt,
  initialAmount,
  onOpenBox,
  onCloseBox,
  summary,
}: CashboxSwitchProps) {
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const handleSwitchClick = () => {
    if (isBoxOpen) {
      setShowCloseModal(true)
    } else {
      setShowOpenModal(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSwitchClick}
        className={cn(
          "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
          isBoxOpen
            ? "bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 focus:ring-emerald-500/50"
            : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800 focus:ring-slate-500/50"
        )}
      >
        <div
          className={cn(
            "relative w-9 sm:w-10 h-5 sm:h-6 rounded-full transition-all duration-300",
            isBoxOpen
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
              : "bg-slate-700"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 sm:top-1 w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white shadow-md",
              "transition-all duration-300",
              isBoxOpen ? "left-4 sm:left-5" : "left-0.5 sm:left-1"
            )}
          />
          {isBoxOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse" />
          )}
        </div>

        <div className="text-left hidden sm:block">
          {isBoxOpen ? (
            <>
              <span className="text-xs sm:text-sm font-medium text-emerald-400 flex items-center gap-1">
                <Unlock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Caja Abierta
              </span>
              <p className="text-[10px] sm:text-xs text-emerald-500/70">
                Desde {boxOpenedAt ? formatTime(boxOpenedAt) : "--:--"} ·{" "}
                {formatCurrency(initialAmount)}
              </p>
            </>
          ) : (
            <>
              <span className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-1">
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Caja
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500">Sin actividad</p>
            </>
          )}
        </div>
      </button>

      <CashboxModal
        type="open"
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onOpenBox={onOpenBox}
        onCloseBox={async () => {}}
      />

      <CashboxModal
        type="close"
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onOpenBox={async () => {}}
        onCloseBox={onCloseBox}
        summary={summary}
      />
    </>
  )
}
