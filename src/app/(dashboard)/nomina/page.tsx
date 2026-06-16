"use client"

import { useState } from "react"
import { Users, Receipt, History, Play, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PayrollKpiCards } from "@/components/admin/payroll/kpi-cards"
import { EmployeeList, Employee } from "@/components/admin/payroll/employee-list"
import { PayrollModal } from "@/components/admin/payroll/payroll-modal"

const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "María López",
    avatar: null,
    role: "Cajera",
    type: "fixed",
    baseSalary: 450,
    bonuses: 0,
    deductions: 0,
    status: "paid",
  },
  {
    id: 2,
    name: "Carlos Pérez",
    avatar: null,
    role: "Vendedor",
    type: "commission",
    baseSalary: 150,
    commission: 5,
    bonuses: 0,
    deductions: 0,
    status: "pending",
  },
  {
    id: 3,
    name: "Ana Martínez",
    avatar: null,
    role: "Supervisora",
    type: "fixed",
    baseSalary: 600,
    bonuses: 50,
    deductions: 25,
    status: "review",
  },
  {
    id: 4,
    name: "Luis Rodríguez",
    avatar: null,
    role: "Bodeguero",
    type: "fixed",
    baseSalary: 380,
    bonuses: 0,
    deductions: 0,
    status: "paid",
  },
  {
    id: 5,
    name: "Sofia Hernández",
    avatar: null,
    role: "Vendedora",
    type: "commission",
    baseSalary: 120,
    commission: 5,
    bonuses: 100,
    deductions: 0,
    status: "pending",
  },
  {
    id: 6,
    name: "Miguel Torres",
    avatar: null,
    role: "Contador",
    type: "fixed",
    baseSalary: 800,
    bonuses: 0,
    deductions: 50,
    status: "paid",
  },
  {
    id: 7,
    name: "Laura Jiménez",
    avatar: null,
    role: "Auxiliar",
    type: "hourly",
    baseSalary: 5,
    hoursWorked: 160,
    bonuses: 0,
    deductions: 0,
    status: "review",
  },
  {
    id: 8,
    name: "Roberto Díaz",
    avatar: null,
    role: "Seguridad",
    type: "fixed",
    baseSalary: 350,
    bonuses: 0,
    deductions: 0,
    status: "paid",
  },
]

export default function NominaPage() {
  const [activeTab, setActiveTab] = useState("employees")
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateTotalPayroll = () => {
    return employees.reduce((total, emp) => {
      let base = emp.baseSalary
      if (emp.type === "hourly" && emp.hoursWorked) {
        base = base * emp.hoursWorked
      } else if (emp.type === "commission") {
        base = base + (emp.baseSalary * ((emp.commission || 0) / 100))
      }
      return total + base + emp.bonuses - emp.deductions
    }, 0)
  }

  const activeEmployees = employees.filter((e) => e.status !== "paid").length

  const handleUpdateBonuses = (employeeId: number, amount: number) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, bonuses: emp.bonuses + amount, status: "review" }
          : emp
      )
    )
  }

  const handleUpdateDeductions = (employeeId: number, amount: number) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, deductions: emp.deductions + amount, status: "review" }
          : emp
      )
    )
  }

  const handleProcessPayroll = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setEmployees((prev) =>
      prev.map((emp) => ({ ...emp, status: "paid" as const }))
    )

    setIsProcessing(false)
  }

  const pendingCount = employees.filter((e) => e.status === "pending").length
  const reviewCount = employees.filter((e) => e.status === "review").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-grid-pattern opacity-30" />

      <div className="relative container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-emerald-500/20 to-blue-500/20",
                  "border border-emerald-500/30"
                )}
              >
                <Calculator className="w-5 h-5 text-emerald-400" />
              </div>
              Nómina
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestiona los pagos de tu equipo
            </p>
          </div>

          <Button
            onClick={() => setShowProcessModal(true)}
            disabled={employees.length === 0}
            className={cn(
              "h-11 px-6 transition-all duration-300",
              "bg-gradient-to-r from-emerald-500 to-emerald-600",
              "hover:from-emerald-400 hover:to-emerald-500",
              "shadow-lg shadow-emerald-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            <Play className="w-4 h-4" />
            Procesar Nómina
          </Button>
        </div>

        <div className="mb-8">
          <PayrollKpiCards
            totalPayroll={calculateTotalPayroll()}
            activeEmployees={activeEmployees}
            lastProcessedDate="15 May"
            status={pendingCount > 0 ? "pending" : reviewCount > 0 ? "processing" : "completed"}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl"
          >
            <TabsTrigger
              value="employees"
              className={cn(
                "data-[active]:bg-slate-700 data-[active]:text-slate-100",
                "data-[active]:shadow-sm"
              )}
            >
              <Users className="w-4 h-4 mr-2" />
              Empleados
              <span
                className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-xs font-medium",
                  employees.length > 0
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-700 text-slate-400"
                )}
              >
                {employees.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className={cn(
                "data-[active]:bg-slate-700 data-[active]:text-slate-100",
                "data-[active]:shadow-sm"
              )}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Pagos
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={cn(
                "data-[active]:bg-slate-700 data-[active]:text-slate-100",
                "data-[active]:shadow-sm"
              )}
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-6">
            <EmployeeList
              employees={employees}
              onUpdateBonuses={handleUpdateBonuses}
              onUpdateDeductions={handleUpdateDeductions}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <div className="space-y-4">
              {employees
                .filter((e) => e.status !== "paid")
                .map((employee) => (
                  <div
                    key={employee.id}
                    className={cn(
                      "rounded-xl p-4",
                      "bg-gradient-to-br from-slate-800/60 to-slate-900/80",
                      "border border-slate-700/50",
                      "flex items-center justify-between"
                    )}
                  >
                    <div>
                      <p className="font-medium text-slate-100">{employee.name}</p>
                      <p className="text-sm text-slate-400">{employee.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-400">
                        Bs{" "}
                        {(
                          employee.baseSalary +
                          employee.bonuses -
                          employee.deductions
                        ).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {employee.status === "pending"
                          ? "Pendiente"
                          : "En Revisión"}
                      </p>
                    </div>
                  </div>
                ))}

              {employees.filter((e) => e.status !== "paid").length === 0 && (
                <div
                  className={cn(
                    "rounded-xl p-12 text-center",
                    "bg-slate-800/30 border border-slate-700/50"
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">
                    Todos los pagos completados
                  </h3>
                  <p className="text-sm text-slate-400">
                    No hay pagos pendientes por procesar
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div
              className={cn(
                "rounded-xl p-12 text-center",
                "bg-slate-800/30 border border-slate-700/50"
              )}
            >
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                Historial de nóminas
              </h3>
              <p className="text-sm text-slate-400">
                Aquí aparecerán las nóminas procesadas anteriormente
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PayrollModal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        employees={employees}
        onProcess={handleProcessPayroll}
      />
    </div>
  )
}
