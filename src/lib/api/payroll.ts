import { apiClient } from './client';
import type { PayrollEmployee, PayrollHistoryEntry } from '@/types/payroll';

export interface PayrollEmployeeDto {
  id: number;
  memberId: number;
  profileId: number;
  name: string;
  avatar: string | null;
  role: string;
  type: 'fixed' | 'commission' | 'hourly';
  baseSalary: number;
  commission?: number;
  hoursWorked?: number;
  bonuses: number;
  deductions: number;
  status: 'paid' | 'pending' | 'review';
  netAmount: number;
  lastProcessedAt?: string | null;
}

export interface PayrollRunDto {
  id: number;
  periodLabel: string;
  totalAmount: number;
  employeeCount: number;
  status: string;
  createdAt: string;
  processedBy: string | null;
  lines: { id: number; employeeName: string; amount: number; date: string }[];
}

export interface ProcessPayrollResult {
  run: PayrollRunDto;
  created: number;
  errors: string[];
}

function dtoToEmployee(d: PayrollEmployeeDto): PayrollEmployee {
  return {
    id: d.memberId,
    memberId: d.memberId,
    profileId: d.profileId,
    name: d.name,
    avatar: d.avatar,
    role: d.role,
    type: d.type,
    baseSalary: d.baseSalary,
    commission: d.commission,
    hoursWorked: d.hoursWorked,
    bonuses: d.bonuses,
    deductions: d.deductions,
    status: d.status,
  };
}

function runsToHistory(runs: PayrollRunDto[]): PayrollHistoryEntry[] {
  const entries: PayrollHistoryEntry[] = [];
  for (const run of runs) {
    for (const line of run.lines) {
      entries.push({
        id: line.id,
        runId: run.id,
        date: line.date,
        amount: line.amount,
        description: `Nómina - ${line.employeeName} - ${run.periodLabel}`,
        employeeName: line.employeeName,
        periodLabel: run.periodLabel,
      });
    }
  }
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const payrollService = {
  async getEmployees(): Promise<PayrollEmployee[]> {
    const res = await apiClient.get<PayrollEmployeeDto[]>('/payroll/employees');
    return (Array.isArray(res.data) ? res.data : []).map(dtoToEmployee);
  },

  async adjustBonus(memberId: number, bonusAmount: number): Promise<PayrollEmployee> {
    const res = await apiClient.post<PayrollEmployeeDto>(
      `/payroll/profiles/${memberId}/adjust`,
      { bonusAmount },
    );
    return dtoToEmployee(res.data);
  },

  async adjustDeduction(memberId: number, deductionAmount: number): Promise<PayrollEmployee> {
    const res = await apiClient.post<PayrollEmployeeDto>(
      `/payroll/profiles/${memberId}/adjust`,
      { deductionAmount },
    );
    return dtoToEmployee(res.data);
  },

  async processPayroll(): Promise<ProcessPayrollResult> {
    const res = await apiClient.post<ProcessPayrollResult>('/payroll/process');
    return res.data;
  },

  async getRuns(limit = 20): Promise<PayrollRunDto[]> {
    const res = await apiClient.get<PayrollRunDto[]>('/payroll/runs', { params: { limit } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async getHistory(): Promise<PayrollHistoryEntry[]> {
    const runs = await this.getRuns(30);
    return runsToHistory(runs);
  },
};
