import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';
import {
  getPermissionsForRole,
  type PermissionMap,
} from '@/config/permissions';

/**
 * Tipo de retorno del hook usePermission.
 * Incluye los permisos del PermissionMap, strings de identidad del rol,
 * y aliases legacy para backward compatibility.
 */
export type UsePermissionReturn = PermissionMap & {
  role: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSeller: boolean;
  isWarehouse: boolean;
  isFiscal: boolean;
  isPosOperator: boolean;
  isWaiter: boolean;
  isKitchen: boolean;
  /** Cajero (SELLER o POS_OPERATOR): solo POS a pantalla completa */
  isPosOnlySeller: boolean;
  /** Anfitrión: solo pantalla tomar pedido */
  isWaiterOnly: boolean;
  /** Cocina: solo cola KDS */
  isKitchenOnly: boolean;

  // ── Aliases legacy (backward compatibility) ──
  /** @deprecated */
  canDelete: boolean;
  canManageInvoices: boolean;
  canManageCierreCaja: boolean;
  canManageCustomers: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canViewDashboard: boolean;
  canViewFinancialCharts: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canAnulateInvoices: boolean;
  canDeleteInvoices: boolean;
  canAssignTasks: boolean;
  canInviteMembers: boolean;
  canCreateOrganization: boolean;
  canManageFiscal: boolean;
  canManageExpenses: boolean;
  canManageTeam: boolean;
  canViewCredits: boolean;
  canManageCredits: boolean;
};

function useOrganizationsList() {
  const user = useAuthStore((s) => s.user);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  return useMemo(() => {
    if (user?.isSuperAdmin && superAdminOrganizations.length > 0) {
      return superAdminOrganizations;
    }
    if (user?.organizations?.length) return user.organizations;
    if (user?.companies?.length) {
      return user.companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        plan: 'FREE',
        role: c.role,
      }));
    }
    return [];
  }, [user, superAdminOrganizations]);
}

const ALL_TRUE: PermissionMap = getPermissionsForRole('SUPER_ADMIN');

export function usePermission(): UsePermissionReturn {
  const user = useAuthStore((s) => s.user);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const organizations = useOrganizationsList();
  const isPlatformSuperAdmin = user?.isSuperAdmin === true;
  const selectedId = selectedOrganizationId ?? selectedCompanyId;

  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === selectedId) ?? null,
    [organizations, selectedId],
  );

  const permissions = useMemo(() => {
    if (isFiscalPreviewMode()) {
      const previewPerms = getPermissionsForRole('ADMIN');
      return {
        ...previewPerms,
        role: 'ADMIN' as const,
        isSuperAdmin: false,
        isAdmin: true,
        isManager: true,
        isSeller: true,
        isWarehouse: true,
        isFiscal: true,
        isPosOperator: false,
        isWaiter: false,
        isKitchen: false,
        isPosOnlySeller: false,
        isWaiterOnly: false,
        isKitchenOnly: false,
        canDelete: true,
      } satisfies UsePermissionReturn;
    }

    const roleString = currentOrg?.role?.toString() ?? '';
    const role = roleString.toUpperCase().trim();

    const isSuperAdmin = isPlatformSuperAdmin || role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'MANAGER';
    const isSeller = role === 'SELLER';
    const isWarehouse = role === 'WAREHOUSE';
    const isFiscal = role === 'FISCAL';
    const isPosOperator = role === 'POS_OPERATOR';
    const isWaiter = role === 'WAITER';
    const isKitchen = role === 'KITCHEN';

    const rolePerms = getPermissionsForRole(role);
    const base: PermissionMap = isSuperAdmin ? { ...ALL_TRUE } : rolePerms;

    const isPosOnlySeller =
      (isSeller || isPosOperator) && !isSuperAdmin && !isAdmin && !isManager;
    const isWaiterOnly = isWaiter && !isSuperAdmin && !isAdmin && !isManager;
    const isKitchenOnly = isKitchen && !isSuperAdmin && !isAdmin && !isManager;

    return {
      ...base,
      role,
      isSuperAdmin,
      isAdmin,
      isManager,
      isSeller,
      isWarehouse,
      isFiscal,
      isPosOperator,
      isWaiter,
      isKitchen,
      isPosOnlySeller,
      isWaiterOnly,
      isKitchenOnly,
      canDelete: base.canManageTeam || base.canDeleteInvoices,
    } satisfies UsePermissionReturn;
  }, [currentOrg, isPlatformSuperAdmin]);

  return permissions;
}
