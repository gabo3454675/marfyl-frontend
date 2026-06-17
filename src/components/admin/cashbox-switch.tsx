"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CashboxModal } from "./cashbox-modal"
import type { BoxSummary } from "@/lib/api/cierre-caja"

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

function formatUsd(amount: number): string {
  return `$ ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`
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
        aria-label={isBoxOpen ? "Caja abierta — tocar para cerrar" : "Caja cerrada — tocar para abrir"}
        className={cn(
          "flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5",
          "transition-all duration-300 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
          isBoxOpen
            ? "border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 focus:ring-emerald-500/50"
            : "border border-border bg-muted/40 hover:bg-muted/60 focus:ring-muted-foreground/30",
        )}
      >
        <div
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-all duration-300",
            isBoxOpen
              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "bg-muted-foreground/30",
          )}
        >
          <div
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300",
              isBoxOpen ? "left-5" : "left-1",
            )}
          />
          {isBoxOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse" />
          )}
        </div>

        {/* Etiqueta compacta en móvil */}
        <span className={cn(
          "text-[11px] font-medium sm:hidden",
          isBoxOpen ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
        )}>
          {isBoxOpen ? "Abierta" : "Caja"}
        </span>

        <div className="hidden text-left sm:block">
          {isBoxOpen ? (
            <>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:text-sm">
                <Unlock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Caja Abierta
              </span>
              <p className="text-[10px] sm:text-xs text-emerald-500/70">
                Desde {boxOpenedAt ? formatTime(boxOpenedAt) : "--:--"} ·{" "}
                {formatUsd(initialAmount)}
              </p>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground sm:text-sm">
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Caja
              </span>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Sin actividad</p>
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
