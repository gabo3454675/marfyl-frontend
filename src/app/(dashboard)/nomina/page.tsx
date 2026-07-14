"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Users, Receipt, History, Play, Calculator, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { AdminCard } from "@/components/admin/admin-card"
import { PayrollKpiCards } from "@/components/admin/payroll/kpi-cards"
import { EmployeeList } from "@/components/admin/payroll/employee-list"
import { usePermission } from "@/hooks/usePermission"
import { payrollService } from "@/lib/api/payroll"
import {
  type PayrollEmployee,
  type PayrollCurrency,
  calculateTotalPayroll,
  calculateEmployeeSalary,
  formatPayrollMoney,
} from "@/types/payroll"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PayrollModal = dynamic(
  () => import("@/components/admin/payroll/payroll-modal").then((m) => m.PayrollModal),
  { ssr: false },
)

export default function NominaPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { canManageTeam } = usePermission()

  const [activeTab, setActiveTab] = useState("employees")
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    data: employees = [],
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["payroll", "employees"],
    queryFn: () => payrollService.getEmployees(),
    enabled: canManageTeam,
    staleTime: 15_000,
  })

  const { data: history = [] } = useQuery({
    queryKey: ["payroll", "history"],
    queryFn: () => payrollService.getHistory(),
    enabled: canManageTeam,
    staleTime: 30_000,
  })

  const invalidatePayroll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["payroll"] })
  }, [queryClient])

  const payrollTotals = useMemo(() => calculateTotalPayroll(employees), [employees])
  const pendingCount = useMemo(() => employees.filter((e) => e.status === "pending").length, [employees])
  const reviewCount = useMemo(() => employees.filter((e) => e.status === "review").length, [employees])
  const pendingPaymentCount = useMemo(() => employees.filter((e) => e.status !== "paid").length, [employees])

  const lastProcessedDate = useMemo(() => {
    if (history.length === 0) return "—"
    return new Date(history[0].date).toLocaleDateString("es-VE", { day: "numeric", month: "short" })
  }, [history])

  const daysSinceLastProcess = useMemo(() => {
    if (history.length === 0) return null
    const diff = Date.now() - new Date(history[0].date).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }, [history])

  const payrollStatus = useMemo((): "pending" | "processing" | "completed" => {
    if (pendingCount > 0) return "pending"
    if (reviewCount > 0) return "processing"
    return "completed"
  }, [pendingCount, reviewCount])

  const patchEmployee = useCallback(
    (updated: PayrollEmployee) => {
      queryClient.setQueryData<PayrollEmployee[]>(["payroll", "employees"], (prev) =>
        (prev ?? []).map((e) => (e.memberId === updated.memberId ? updated : e)),
      )
    },
    [queryClient],
  )

  const handleUpdateBonuses = useCallback(
    async (memberId: number, amount: number) => {
      try {
        const updated = await payrollService.adjustBonus(memberId, amount)
        patchEmployee(updated)
      } catch {
        toast.error("No se pudo registrar la bonificación.")
      }
    },
    [patchEmployee],
  )

  const handleUpdateDeductions = useCallback(
    async (memberId: number, amount: number) => {
      try {
        const updated = await payrollService.adjustDeduction(memberId, amount)
        patchEmployee(updated)
      } catch {
        toast.error("No se pudo registrar la deducción.")
      }
    },
    [patchEmployee],
  )

  const handleUpdateCurrency = useCallback(
    async (memberId: number, payCurrency: PayrollCurrency) => {
      try {
        const updated = await payrollService.updateCurrency(memberId, payCurrency)
        patchEmployee(updated)
        toast.success(`Moneda actualizada a ${payCurrency === "VES" ? "Bs" : "USD"}`)
      } catch {
        toast.error("No se pudo cambiar la moneda.")
      }
    },
    [patchEmployee],
  )

  const handleProcessPayroll = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await payrollService.processPayroll()
      invalidatePayroll()
      if (result.errors.length > 0) {
        toast.warning(`Nómina parcial: ${result.created} pagos, ${result.errors.length} fallidos.`)
      } else {
        toast.success(`Nómina procesada: ${result.created} pagos registrados.`)
      }
    } catch {
      toast.error("Error al procesar la nómina.")
      throw new Error("process failed")
    } finally {
      setIsProcessing(false)
    }
  }, [invalidatePayroll])

  useEffect(() => {
    if (!canManageTeam) router.replace("/dashboard")
  }, [canManageTeam, router])

  if (!canManageTeam) {
    return null
  }

  return (
    <AdminPageShell
      eyebrow="Recursos Humanos"
      title={
        <span className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </span>
          Nómina
        </span>
      }
      subtitle="Gestiona los pagos de tu equipo. Cada empleado puede cobrar en USD o Bs."
      maxWidth="wide"
      loading={isLoading}
      actions={
        <Button
          onClick={() => setShowProcessModal(true)}
          disabled={employees.length === 0 || isProcessing}
          className="h-11 min-h-[44px] w-full cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-500 sm:w-auto"
        >
          <Play className="h-4 w-4" />
          Procesar nómina
        </Button>
      }
    >
      {loadError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No se pudo cargar la nómina. Verifica tu conexión.
        </div>
      )}

      <div className="mb-6">
        <PayrollKpiCards
          employees={employees}
          totals={payrollTotals}
          pendingPayments={pendingPaymentCount}
          lastProcessedDate={lastProcessedDate}
          daysSinceLastProcess={daysSinceLastProcess}
          status={payrollStatus}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="rounded-xl border bg-card/60 p-1.5 shadow-sm">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="employees"
              className={cn(
                "min-h-[44px] shrink-0 cursor-pointer gap-2 rounded-lg px-4 py-2.5",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              )}
            >
              <Users className="h-4 w-4" />
              Empleados
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold data-[state=active]:bg-primary-foreground/20">
                {employees.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className={cn(
                "min-h-[44px] shrink-0 cursor-pointer gap-2 rounded-lg px-4 py-2.5",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              )}
            >
              <Receipt className="h-4 w-4" />
              Pagos
              {pendingPaymentCount > 0 && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {pendingPaymentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={cn(
                "min-h-[44px] shrink-0 cursor-pointer gap-2 rounded-lg px-4 py-2.5",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              )}
            >
              <History className="h-4 w-4" />
              Historial
              {history.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{history.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employees" className="mt-4">
          {employees.length === 0 ? (
            <AdminCard>
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay miembros activos en la organización.
              </p>
            </AdminCard>
          ) : (
            <EmployeeList
              employees={employees}
              onUpdateBonuses={handleUpdateBonuses}
              onUpdateDeductions={handleUpdateDeductions}
              onUpdateCurrency={handleUpdateCurrency}
            />
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-2.5">
          {employees
            .filter((e) => e.status !== "paid")
            .map((employee) => {
              const currency = employee.payCurrency ?? "USD"
              return (
                <AdminCard
                  key={employee.memberId}
                  bodyClassName="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.role} · {currency === "VES" ? "Bs" : "USD"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {formatPayrollMoney(calculateEmployeeSalary(employee), currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.status === "pending" ? "Pendiente" : "En revisión"}
                    </p>
                  </div>
                </AdminCard>
              )
            })}
          {pendingPaymentCount === 0 && (
            <AdminCard>
              <div className="py-10 text-center">
                <Receipt className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                <h3 className="font-medium">Todos los pagos completados</h3>
                <p className="mt-1 text-sm text-muted-foreground">No hay pagos pendientes</p>
              </div>
            </AdminCard>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {history.length === 0 ? (
            <AdminCard>
              <p className="py-8 text-center text-sm text-muted-foreground">
                El historial aparecerá tras procesar la primera nómina.
              </p>
            </AdminCard>
          ) : (
            history.map((entry) => (
              <AdminCard key={entry.id} bodyClassName="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{entry.employeeName}</p>
                  <p className="text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("es-VE")}
                    {entry.periodLabel ? ` · ${entry.periodLabel}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatPayrollMoney(entry.amount, entry.payCurrency ?? "USD")}
                </p>
              </AdminCard>
            ))
          )}
        </TabsContent>
      </Tabs>

      <PayrollModal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        employees={employees}
        onProcess={handleProcessPayroll}
        isProcessing={isProcessing}
      />
    </AdminPageShell>
  )
}
