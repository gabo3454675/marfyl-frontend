"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Minus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface QuickActionPopoverProps {
  employeeId: number
  payCurrency: "USD" | "VES"
  currentBonuses: number
  currentDeductions: number
  onAddBonus: (employeeId: number, amount: number) => void
  onAddDeduction: (employeeId: number, amount: number) => void
}

export function QuickActionPopover({
  employeeId,
  payCurrency,
  currentBonuses,
  currentDeductions,
  onAddBonus,
  onAddDeduction,
}: QuickActionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bonusAmount, setBonusAmount] = useState("")
  const [deductionAmount, setDeductionAmount] = useState("")
  const [activeField, setActiveField] = useState<"bonus" | "deduction" | null>(null)
  const [successBonus, setSuccessBonus] = useState(false)
  const [successDeduction, setSuccessDeduction] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setActiveField(null)
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleAddBonus = () => {
    const amount = parseFloat(bonusAmount)
    if (amount > 0) {
      onAddBonus(employeeId, amount)
      setBonusAmount("")
      setSuccessBonus(true)
      setTimeout(() => setSuccessBonus(false), 1500)
      setActiveField(null)
    }
  }

  const handleAddDeduction = () => {
    const amount = parseFloat(deductionAmount)
    if (amount > 0) {
      onAddDeduction(employeeId, amount)
      setDeductionAmount("")
      setSuccessDeduction(true)
      setTimeout(() => setSuccessDeduction(false), 1500)
      setActiveField(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      action()
    }
    if (e.key === "Escape") {
      setIsOpen(false)
      setActiveField(null)
    }
  }

  const currencyLabel = payCurrency === "VES" ? "Bs" : "$"

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bonificaciones y deducciones"
        aria-expanded={isOpen}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-lg p-0.5 transition-colors duration-200",
          "hover:bg-muted/60",
          isOpen && "bg-muted",
        )}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Plus className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
          <Minus className="h-3.5 w-3.5" />
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/40 sm:hidden"
            aria-hidden
            onClick={() => {
              setIsOpen(false)
              setActiveField(null)
            }}
          />
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Ajustes de nómina"
            className={cn(
              "z-[100] rounded-xl border bg-card p-0 shadow-lg",
              "fixed inset-x-3 bottom-[calc(var(--app-bottom-chrome,4.5rem)+0.75rem)] max-h-[min(70dvh,24rem)] overflow-y-auto",
              "animate-in fade-in slide-in-from-bottom-4 duration-200",
              "sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:max-h-none",
            )}
          >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Asignaciones</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setActiveField(null)
              }}
              className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex gap-4 text-xs">
              <span className="text-muted-foreground">
                Bonos: <strong className="text-emerald-600 dark:text-emerald-400">{currencyLabel} {currentBonuses.toLocaleString()}</strong>
              </span>
              <span className="text-muted-foreground">
                Deducc.: <strong className="text-red-600 dark:text-red-400">{currencyLabel} {currentDeductions.toLocaleString()}</strong>
              </span>
            </div>

            <AdjustRow
              label="Bonificación"
              icon={Plus}
              tone="emerald"
              currencyLabel={currencyLabel}
              value={bonusAmount}
              onChange={setBonusAmount}
              onFocus={() => setActiveField("bonus")}
              active={activeField === "bonus"}
              onSubmit={handleAddBonus}
              onKeyDown={(e) => handleKeyDown(e, handleAddBonus)}
              success={successBonus}
            />
            <AdjustRow
              label="Deducción"
              icon={Minus}
              tone="red"
              currencyLabel={currencyLabel}
              value={deductionAmount}
              onChange={setDeductionAmount}
              onFocus={() => setActiveField("deduction")}
              active={activeField === "deduction"}
              onSubmit={handleAddDeduction}
              onKeyDown={(e) => handleKeyDown(e, handleAddDeduction)}
              success={successDeduction}
            />
          </div>
          </div>
        </>
      )}
    </div>
  )
}

function AdjustRow({
  label,
  icon: Icon,
  tone,
  currencyLabel,
  value,
  onChange,
  onFocus,
  active,
  onSubmit,
  onKeyDown,
  success,
}: {
  label: string
  icon: typeof Plus
  tone: "emerald" | "red"
  currencyLabel: string
  value: string
  onChange: (v: string) => void
  onFocus: () => void
  active: boolean
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  success: boolean
}) {
  const ring = tone === "emerald" ? "focus:ring-emerald-500/30 border-emerald-500/40" : "focus:ring-red-500/30 border-red-500/40"
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className={cn("h-3 w-3", tone === "emerald" ? "text-emerald-500" : "text-red-500")} />
          {label}
        </label>
        {success && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 animate-in fade-in">
            <Check className="h-3 w-3" /> OK
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyLabel}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder="0.00"
            className={cn(
              "h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm transition-colors duration-200",
              "focus:outline-none focus:ring-2",
              ring,
              active && (tone === "emerald" ? "border-emerald-500/50" : "border-red-500/50"),
            )}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onSubmit}
          disabled={!value || parseFloat(value) <= 0}
          className="h-9 cursor-pointer px-3"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
