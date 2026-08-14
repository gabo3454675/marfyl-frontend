export const OPERATIONAL_ROLES = [
  'SELLER',
  'WAREHOUSE',
  'POS_OPERATOR',
  'WAITER',
  'KITCHEN',
] as const;

export type OperationalRole = (typeof OPERATIONAL_ROLES)[number];

export function isOperationalRole(role: string | undefined | null): boolean {
  return OPERATIONAL_ROLES.includes(String(role ?? '').toUpperCase() as OperationalRole);
}
