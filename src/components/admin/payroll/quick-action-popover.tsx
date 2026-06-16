"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Minus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface QuickActionPopoverProps {
  employeeId: number
  currentBonuses: number
  currentDeductions: number
  onAddBonus: (employeeId: number, amount: number) => void
  onAddDeduction: (employeeId: number, amount: number) => void
  children: React.ReactNode
}

export function QuickActionPopover({
  employeeId,
  currentBonuses,
  currentDeductions,
  onAddBonus,
  onAddDeduction,
  children,
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
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

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Acciones rápidas"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200",
          "hover:bg-slate-700/50 active:scale-95",
          isOpen && "bg-slate-700"
        )}
      >
        {children}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Acciones de asignación"
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-72 rounded-xl",
            "bg-gradient-to-br from-slate-800 to-slate-900",
            "border border-slate-700/50",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <span className="text-sm font-medium text-slate-200">Asignaciones</span>
            <button
              onClick={() => {
                setIsOpen(false)
                setActiveField(null)
              }}
              className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Bonificaciones:</span>
                <span className="font-medium text-emerald-400">Bs {currentBonuses.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Deducciones:</span>
                <span className="font-medium text-red-400">Bs {currentDeductions.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Plus className="w-3 h-3 text-emerald-400" />
                  Bonificación
                </label>
                {successBonus && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 animate-in fade-in duration-200">
                    <Check className="w-3 h-3" />
                    Añadido
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Bs
                  </span>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    onFocus={() => setActiveField("bonus")}
                    onKeyDown={(e) => handleKeyDown(e, handleAddBonus)}
                    placeholder="0.00"
                    className={cn(
                      "w-full h-9 pl-8 pr-3 rounded-lg",
                      "bg-slate-900/50 border transition-all duration-200",
                      "text-sm text-slate-200 placeholder:text-slate-600",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50",
                      activeField === "bonus" && "border-emerald-500/50"
                    )}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddBonus}
                  disabled={!bonusAmount || parseFloat(bonusAmount) <= 0}
                  className={cn(
                    "h-9 px-3 transition-all duration-200",
                    "bg-emerald-500/10 text-emerald-400",
                    "hover:bg-emerald-500/20 hover:text-emerald-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Minus className="w-3 h-3 text-red-400" />
                  Deducción
                </label>
                {successDeduction && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 animate-in fade-in duration-200">
                    <Check className="w-3 h-3" />
                    Añadida
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    Bs
                  </span>
                  <input
                    type="number"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    onFocus={() => setActiveField("deduction")}
                    onKeyDown={(e) => handleKeyDown(e, handleAddDeduction)}
                    placeholder="0.00"
                    className={cn(
                      "w-full h-9 pl-8 pr-3 rounded-lg",
                      "bg-slate-900/50 border transition-all duration-200",
                      "text-sm text-slate-200 placeholder:text-slate-600",
                      "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50",
                      activeField === "deduction" && "border-red-500/50"
                    )}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddDeduction}
                  disabled={!deductionAmount || parseFloat(deductionAmount) <= 0}
                  className={cn(
                    "h-9 px-3 transition-all duration-200",
                    "bg-red-500/10 text-red-400",
                    "hover:bg-red-500/20 hover:text-red-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
