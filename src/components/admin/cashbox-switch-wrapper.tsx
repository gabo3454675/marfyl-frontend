"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CashboxSwitch } from "./cashbox-switch"
import { cierreCajaService, buildBoxSummary } from "@/lib/api/cierre-caja"
import { useAuthStore } from "@/store/useAuthStore"

export function CashboxSwitchWrapper() {
  const queryClient = useQueryClient()
  const selectedId = useAuthStore((s) => s.selectedOrganizationId || s.selectedCompanyId)
  const exchangeRate = useAuthStore((s) => {
    const id = s.selectedOrganizationId || s.selectedCompanyId
    const org = s.user?.organizations?.find((o) => o.id === id)
    return Number(org?.exchangeRate ?? 36.5)
  }) || 36.5

  const { data: abierto, isLoading } = useQuery({
    queryKey: ["cierre-caja", "abierto", selectedId],
    queryFn: () => cierreCajaService.getAbierto(),
    staleTime: 15_000,
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["cierre-caja"] })
  }, [queryClient])

  const handleOpenBox = useCallback(
    async (amount: number) => {
      await cierreCajaService.apertura({ montoInicial: amount })
      invalidate()
    },
    [invalidate],
  )

  const handleCloseBox = useCallback(
    async (data: {
      physicalAmountBs: number
      physicalAmountUsd: number
      observations: string
    }) => {
      await cierreCajaService.cerrar({
        montoFisicoUsd: data.physicalAmountUsd,
        montoFisicoVes: data.physicalAmountBs,
        observaciones: data.observations || undefined,
      })
      invalidate()
    },
    [invalidate],
  )

  if (isLoading) return null

  const summary = abierto ? buildBoxSummary(abierto, exchangeRate) : undefined

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
