/** Tipos compartidos de nómina (frontend). */
export type PayrollEmployeeType = 'fixed' | 'commission' | 'hourly';
export type PayrollStatus = 'paid' | 'pending' | 'review';
export type PayrollCurrency = 'USD' | 'VES';

export interface PayrollEmployee {
  id: number;
  memberId: number;
  profileId?: number;
  name: string;
  avatar: string | null;
  role: string;
  type: PayrollEmployeeType;
  payCurrency: PayrollCurrency;
  baseSalary: number;
  commission?: number;
  hoursWorked?: number;
  bonuses: number;
  deductions: number;
  status: PayrollStatus;
}

export interface PayrollHistoryEntry {
  id: number;
  runId?: number;
  date: string;
  amount: number;
  payCurrency?: PayrollCurrency;
  description: string;
  employeeName: string;
  periodLabel?: string;
}

export function formatPayrollMoney(amount: number, currency: PayrollCurrency): string {
  if (currency === 'VES') {
    return `Bs ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  }
  return `$ ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

export function calculateEmployeeSalary(
  emp: Pick<
    PayrollEmployee,
    'type' | 'baseSalary' | 'commission' | 'hoursWorked' | 'bonuses' | 'deductions'
  >,
): number {
  let base = emp.baseSalary;
  if (emp.type === 'hourly' && emp.hoursWorked) {
    base = base * emp.hoursWorked;
  } else if (emp.type === 'commission') {
    base = base + emp.baseSalary * ((emp.commission ?? 0) / 100);
  }
  return base + emp.bonuses - emp.deductions;
}

export function calculateTotalPayroll(employees: PayrollEmployee[]): {
  usd: number;
  ves: number;
} {
  return employees.reduce(
    (acc, emp) => {
      const net = calculateEmployeeSalary(emp);
      if (emp.payCurrency === 'VES') acc.ves += net;
      else acc.usd += net;
      return acc;
    },
    { usd: 0, ves: 0 },
  );
}

export function formatPayrollTotals(totals: { usd: number; ves: number }): string {
  const parts: string[] = [];
  if (totals.usd > 0) parts.push(formatPayrollMoney(totals.usd, 'USD'));
  if (totals.ves > 0) parts.push(formatPayrollMoney(totals.ves, 'VES'));
  if (parts.length === 0) return formatPayrollMoney(0, 'USD');
  return parts.join(' · ');
}
