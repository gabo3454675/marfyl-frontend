import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { isFiscalPreviewMode } from '@/lib/fiscal-preview';

/**
 * Lista de organizaciones para el usuario actual (igual lógica que el switcher).
 * Super Admin: superAdminOrganizations; resto: user.organizations o user.companies.
 */
function useOrganizationsList() {
  const user = useAuthStore((s) => s.user);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
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

/**
 * Hook para verificar permisos basados en el rol del usuario en la organización actual.
 * Para Super Admin usa la misma fuente que el switcher (superAdminOrganizations) así
 * el rol es correcto aunque no sea miembro de la org seleccionada.
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const organizations = useOrganizationsList();
  const isPlatformSuperAdmin = user?.isSuperAdmin === true;
  const selectedId = selectedOrganizationId ?? selectedCompanyId;

  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === selectedId) ?? null,
    [organizations, selectedId]
  );

  const permissions = useMemo(() => {
    if (isFiscalPreviewMode()) {
      return {
        role: 'ADMIN' as const,
        isSuperAdmin: false,
        isAdmin: true,
        isManager: true,
        isSeller: true,
        isWarehouse: true,
        isFiscal: true,
        canManageFiscal: true,
        canManageExpenses: true,
        canManageTeam: true,
        canDelete: true,
        canInviteMembers: true,
        canAssignTasks: true,
        canCreateOrganization: false,
        canViewReports: true,
        canManageSettings: true,
        canAnulateInvoices: true,
        canDeleteInvoices: true,
        canManageProducts: true,
        canManageInventory: true,
        canManageCustomers: true,
        canViewDashboard: true,
        canViewFinancialCharts: true,
      };
    }
    const roleString = currentOrg?.role?.toString() ?? '';
    const role = roleString.toUpperCase().trim() as
      | 'SUPER_ADMIN'
      | 'ADMIN'
      | 'MANAGER'
      | 'SELLER'
      | 'WAREHOUSE'
      | 'FISCAL'
      | string;

    const isSuperAdmin = isPlatformSuperAdmin || role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'MANAGER';
    const isSeller = role === 'SELLER';
    const isWarehouse = role === 'WAREHOUSE';
    const isFiscal = role === 'FISCAL';

    return {
      role,
      isSuperAdmin,
      isAdmin,
      isManager,
      isSeller,
      isWarehouse,
      isFiscal,
      canManageFiscal: isSuperAdmin || isAdmin || isFiscal,
      canManageExpenses: isSuperAdmin || isAdmin || isManager,
      canManageTeam: isSuperAdmin || isAdmin,
      canDelete: isSuperAdmin || isAdmin,
      canInviteMembers: isSuperAdmin || isAdmin,
      canAssignTasks: isSuperAdmin || isAdmin || isManager,
      canCreateOrganization: isSuperAdmin,
      canViewReports: isSuperAdmin || isAdmin || isManager,
      canManageSettings: isSuperAdmin || isAdmin,
      canAnulateInvoices: isSuperAdmin || isAdmin,
      canDeleteInvoices: isSuperAdmin || isAdmin,
      canManageProducts: isSuperAdmin || isAdmin || isManager || isWarehouse,
      canManageInventory: isSuperAdmin || isAdmin || isManager || isWarehouse,
      canManageCustomers: isSuperAdmin || isAdmin || isManager || isSeller,
      canViewDashboard: true,
      canViewFinancialCharts: isSuperAdmin || isAdmin || isManager,
    };
  }, [currentOrg, isPlatformSuperAdmin]);

  return permissions;
}
