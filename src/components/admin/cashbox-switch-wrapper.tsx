"use client"

import { useState, useEffect, useCallback } from "react"
import { CashboxSwitch } from "./cashbox-switch"
import { apiClient } from "@/lib/api"

interface BoxState {
  isBoxOpen: boolean
  boxOpenedAt: Date | null
  initialAmount: number
}

interface BoxSummary {
  cashBs: number
  cashUsd: number
  pagoMovil: number
  zelle: number
  total: number
  exchangeRate: number
}

export function CashboxSwitchWrapper() {
  const [boxState, setBoxState] = useState<BoxState>({
    isBoxOpen: false,
    boxOpenedAt: null,
    initialAmount: 0,
  })
  const [summary, setSummary] = useState<BoxSummary | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const fetchBoxState = useCallback(async () => {
    try {
      const res = await apiClient.get<{
        isOpen: boolean
        openedAt?: string
        initialAmount?: number
      }>("/cierre-caja/status")
      if (res.data) {
        setBoxState({
          isBoxOpen: res.data.isOpen,
          boxOpenedAt: res.data.openedAt ? new Date(res.data.openedAt) : null,
          initialAmount: res.data.initialAmount || 0,
        })
      }
    } catch {
      // caja cerrada por defecto
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get<BoxSummary>("/cierre-caja/summary")
      if (res.data) {
        setSummary(res.data)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchBoxState()
    fetchSummary()
  }, [fetchBoxState, fetchSummary])

  const handleToggle = useCallback(
    async (open: boolean) => {
      if (open) {
        setBoxState((prev) => ({
          ...prev,
          isBoxOpen: true,
          boxOpenedAt: new Date(),
          initialAmount: 0,
        }))
      } else {
        setBoxState({
          isBoxOpen: false,
          boxOpenedAt: null,
          initialAmount: 0,
        })
        setSummary(undefined)
      }
    },
    []
  )

  if (loading) {
    return null
  }

  return (
    <CashboxSwitch
      isBoxOpen={boxState.isBoxOpen}
      boxOpenedAt={boxState.boxOpenedAt}
      initialAmount={boxState.initialAmount}
      onToggle={handleToggle}
      summary={summary}
    />
  )
}
