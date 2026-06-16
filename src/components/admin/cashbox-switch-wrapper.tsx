"use client"

import { useState, useEffect, useCallback } from "react"
import { CashboxSwitch } from "./cashbox-switch"
import { apiClient } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"

interface CierreAbierto {
  id: number
  fechaApertura: string
  montoInicial: number
  ventasEfectivoUsd?: number
  ventasEfectivoBs?: number
  ventasPagoMovil?: number
  ventasPos?: number
}

interface BoxSummary {
  cashBs: number
  cashUsd: number
  pagoMovil: number
  zelle: number
  total: number
  exchangeRate: number
}

function buildSummary(cierre: CierreAbierto, exchangeRate: number): BoxSummary {
  const cashBs = Number(cierre.ventasEfectivoBs ?? 0)
  const cashUsd = Number(cierre.ventasEfectivoUsd ?? 0)
  const pagoMovil = Number(cierre.ventasPagoMovil ?? 0)
  const zelle = Number(cierre.ventasPos ?? 0)
  const total = cashBs + cashUsd * exchangeRate + pagoMovil + zelle * exchangeRate
  return { cashBs, cashUsd, pagoMovil, zelle, total, exchangeRate }
}

export function CashboxSwitchWrapper() {
  const [abierto, setAbierto] = useState<CierreAbierto | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedId =
    useAuthStore((s) => s.selectedOrganizationId || s.selectedCompanyId)
  const exchangeRate =
    useAuthStore((s) => {
      const id = s.selectedOrganizationId || s.selectedCompanyId
      const org = s.user?.organizations?.find((o) => o.id === id)
      return Number(org?.exchangeRate ?? 36.5)
    }) || 36.5

  const fetchBoxState = useCallback(async () => {
    try {
      const res = await apiClient.get<CierreAbierto | null>("/cierre-caja/abierto")
      setAbierto(res.data ?? null)
    } catch {
      setAbierto(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void fetchBoxState()
  }, [fetchBoxState, selectedId])

  const handleOpenBox = useCallback(
    async (amount: number) => {
      await apiClient.post("/cierre-caja/apertura", { montoInicial: amount })
      await fetchBoxState()
    },
    [fetchBoxState],
  )

  const handleCloseBox = useCallback(
    async (data: {
      physicalAmountBs: number
      physicalAmountUsd: number
      observations: string
    }) => {
      await apiClient.post("/cierre-caja/cerrar", {
        montoFisicoUsd: data.physicalAmountUsd,
        montoFisicoVes: data.physicalAmountBs,
        observaciones: data.observations || undefined,
      })
      setAbierto(null)
      await fetchBoxState()
    },
    [fetchBoxState],
  )

  if (loading) {
    return null
  }

  const summary = abierto ? buildSummary(abierto, exchangeRate) : undefined

  return (
    <CashboxSwitch
      isBoxOpen={!!abierto}
      boxOpenedAt={abierto ? new Date(abierto.fechaApertura) : null}
      initialAmount={abierto?.montoInicial ?? 0}
      onOpenBox={handleOpenBox}
      onCloseBox={handleCloseBox}
      summary={summary}
    />
  )
}
