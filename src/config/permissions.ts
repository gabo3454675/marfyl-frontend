/**
 * PermissionMap — Fuente de verdad de permisos en el frontend.
 *
 * Cada permiso es un booleano derivado del rol del usuario.
 * El hook usePermission() consume este mapa.
 */

export type PermissionKey =
  // Dashboard
  | 'canViewDashboard'
  | 'canAccessPOS'
  | 'canViewFinancialCharts'
  // Reportes
  | 'canViewReports'
  // Productos
  | 'canManageProducts'
  | 'canManageInventory'
  // Clientes y Ventas
  | 'canManageCustomers'
  | 'canManageInvoices'
  | 'canAnulateInvoices'
  | 'canDeleteInvoices'
  // Créditos
  | 'canViewCredits'
  | 'canManageCredits'
  // Caja
  | 'canManageCierreCaja'
  // Gastos
  | 'canManageExpenses'
  // Equipo
  | 'canManageTeam'
  | 'canManageSettings'
  | 'canInviteMembers'
  | 'canAssignTasks'
  | 'canCreateOrganization'
  // Fiscal
  | 'canManageFiscal';

export type PermissionMap = Record<PermissionKey, boolean>;

/**
 * Matriz de permisos por rol.
 * Usado por usePermission() para computar permisos desde el rol.
 */
export const ROLE_PERMISSIONS: Record<string, PermissionMap> = {
  SUPER_ADMIN: {
    canViewDashboard: true,
    canAccessPOS: true,
    canViewFinancialCharts: true,
    canViewReports: true,
    canManageProducts: true,
    canManageInventory: true,
    canManageCustomers: true,
    canManageInvoices: true,
    canAnulateInvoices: true,
    canDeleteInvoices: true,
    canViewCredits: true,
    canManageCredits: true,
    canManageCierreCaja: true,
    canManageExpenses: true,
    canManageTeam: true,
    canManageSettings: true,
    canInviteMembers: true,
    canAssignTasks: true,
    canCreateOrganization: true,
    canManageFiscal: true,
  },
  ADMIN: {
    canViewDashboard: true,
    canAccessPOS: true,
    canViewFinancialCharts: true,
    canViewReports: true,
    canManageProducts: true,
    canManageInventory: true,
    canManageCustomers: true,
    canManageInvoices: true,
    canAnulateInvoices: true,
    canDeleteInvoices: true,
    canViewCredits: true,
    canManageCredits: true,
    canManageCierreCaja: true,
    canManageExpenses: true,
    canManageTeam: true,
    canManageSettings: true,
    canInviteMembers: true,
    canAssignTasks: true,
    canCreateOrganization: false,
    canManageFiscal: true,
  },
  MANAGER: {
    canViewDashboard: true,
    canAccessPOS: true,
    canViewFinancialCharts: true,
    canViewReports: true,
    canManageProducts: true,
    canManageInventory: true,
    canManageCustomers: true,
    canManageInvoices: true,
    canAnulateInvoices: false,
    canDeleteInvoices: false,
    canViewCredits: true,
    canManageCredits: false,
    canManageCierreCaja: true,
    canManageExpenses: true,
    canManageTeam: false,
    canManageSettings: false,
    canInviteMembers: false,
    canAssignTasks: true,
    canCreateOrganization: false,
    canManageFiscal: false,
  },
  SELLER: {
    canViewDashboard: true,
    canAccessPOS: true,
    canViewFinancialCharts: false,
    canViewReports: false,
    canManageProducts: false,
    canManageInventory: false,
    canManageCustomers: true,
    canManageInvoices: true,
    canAnulateInvoices: false,
    canDeleteInvoices: false,
    canViewCredits: true,
    canManageCredits: false,
    canManageCierreCaja: true,
    canManageExpenses: false,
    canManageTeam: false,
    canManageSettings: false,
    canInviteMembers: false,
    canAssignTasks: false,
    canCreateOrganization: false,
    canManageFiscal: false,
  },
  WAREHOUSE: {
    canViewDashboard: true,
    canAccessPOS: false,
    canViewFinancialCharts: false,
    canViewReports: false,
    canManageProducts: true,
    canManageInventory: true,
    canManageCustomers: false,
    canManageInvoices: false,
    canAnulateInvoices: false,
    canDeleteInvoices: false,
    canViewCredits: false,
    canManageCredits: false,
    canManageCierreCaja: false,
    canManageExpenses: false,
    canManageTeam: false,
    canManageSettings: false,
    canInviteMembers: false,
    canAssignTasks: false,
    canCreateOrganization: false,
    canManageFiscal: false,
  },
  POS_OPERATOR: {
    canViewDashboard: false,
    canAccessPOS: true,
    canViewFinancialCharts: false,
    canViewReports: false,
    canManageProducts: false,
    canManageInventory: false,
    canManageCustomers: false,
    canManageInvoices: false,
    canAnulateInvoices: false,
    canDeleteInvoices: false,
    canViewCredits: false,
    canManageCredits: false,
    canManageCierreCaja: true,
    canManageExpenses: false,
    canManageTeam: false,
    canManageSettings: false,
    canInviteMembers: false,
    canAssignTasks: false,
    canCreateOrganization: false,
    canManageFiscal: false,
  },
  FISCAL: {
    canViewDashboard: true,
    canAccessPOS: false,
    canViewFinancialCharts: false,
    canViewReports: false,
    canManageProducts: false,
    canManageInventory: false,
    canManageCustomers: false,
    canManageInvoices: false,
    canAnulateInvoices: false,
    canDeleteInvoices: false,
    canViewCredits: false,
    canManageCredits: false,
    canManageCierreCaja: false,
    canManageExpenses: false,
    canManageTeam: false,
    canManageSettings: false,
    canInviteMembers: false,
    canAssignTasks: false,
    canCreateOrganization: false,
    canManageFiscal: true,
  },
};

/**
 * Obtiene los permisos para un rol dado.
 * Si el rol no existe, retorna un objeto con todos los permisos en false.
 */
export function getPermissionsForRole(role: string): PermissionMap {
  const normalizedRole = role.toUpperCase().trim();
  return (
    ROLE_PERMISSIONS[normalizedRole] ?? {
      canViewDashboard: false,
      canAccessPOS: false,
      canViewFinancialCharts: false,
      canViewReports: false,
      canManageProducts: false,
      canManageInventory: false,
      canManageCustomers: false,
      canManageInvoices: false,
      canAnulateInvoices: false,
      canDeleteInvoices: false,
      canViewCredits: false,
      canManageCredits: false,
      canManageCierreCaja: false,
      canManageExpenses: false,
      canManageTeam: false,
      canManageSettings: false,
      canInviteMembers: false,
      canAssignTasks: false,
      canCreateOrganization: false,
      canManageFiscal: false,
    }
  );
}
