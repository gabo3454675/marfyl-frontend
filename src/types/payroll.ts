/** Tipos compartidos de nómina (frontend). */
export type PayrollEmployeeType = 'fixed' | 'commission' | 'hourly';
export type PayrollStatus = 'paid' | 'pending' | 'review';

export interface PayrollEmployee {
  id: number;
  memberId: number;
  profileId?: number;
  name: string;
  avatar: string | null;
  role: string;
  type: PayrollEmployeeType;
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
  description: string;
  employeeName: string;
  periodLabel?: string;
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

export function calculateTotalPayroll(employees: PayrollEmployee[]): number {
  return employees.reduce((sum, emp) => sum + calculateEmployeeSalary(emp), 0);
}
