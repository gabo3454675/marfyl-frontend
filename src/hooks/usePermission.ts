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
  /** Rol normalizado (uppercase) */
  role: string;
  /** true si el usuario es Super Admin (plataforma o de la org) */
  isSuperAdmin: boolean;
  /** true si el rol es exactamente ADMIN */
  isAdmin: boolean;
  /** true si el rol es exactamente MANAGER */
  isManager: boolean;
  /** true si el rol es exactamente SELLER */
  isSeller: boolean;
  /** true si el rol es exactamente WAREHOUSE */
  isWarehouse: true | false;
  /** true si el rol es exactamente FISCAL */
  isFiscal: boolean;
  /** true si el rol es exactamente POS_OPERATOR */
  isPosOperator: boolean;
  /** Cajero (SELLER): solo POS a pantalla completa */
  isPosOnlySeller: boolean;

  // ── Aliases legacy (backward compatibility) ──
  /** @deprecated Usa canDeleteInvoices o canManageTeam según contexto */
  canDelete: boolean;
  /** @deprecated Usa canManageInvoices directamente */
  canManageInvoices: boolean;
  /** @deprecated Usa canManageCierreCaja directamente */
  canManageCierreCaja: boolean;
  /** @deprecated Usa canManageCustomers directamente */
  canManageCustomers: boolean;
  /** @deprecated Usa canManageProducts directamente */
  canManageProducts: boolean;
  /** @deprecated Usa canManageInventory directamente */
  canManageInventory: boolean;
  /** @deprecated Usa canViewDashboard directamente */
  canViewDashboard: boolean;
  /** @deprecated Usa canViewFinancialCharts directamente */
  canViewFinancialCharts: boolean;
  /** @deprecated Usa canViewReports directamente */
  canViewReports: boolean;
  /** @deprecated Usa canManageSettings directamente */
  canManageSettings: boolean;
  /** @deprecated Usa canAnulateInvoices directamente */
  canAnulateInvoices: boolean;
  /** @deprecated Usa canDeleteInvoices directamente */
  canDeleteInvoices: boolean;
  /** @deprecated Usa canAssignTasks directamente */
  canAssignTasks: boolean;
  /** @deprecated Usa canInviteMembers directamente */
  canInviteMembers: boolean;
  /** @deprecated Usa canCreateOrganization directamente */
  canCreateOrganization: boolean;
  /** @deprecated Usa canManageFiscal directamente */
  canManageFiscal: boolean;
  /** @deprecated Usa canManageExpenses directamente */
  canManageExpenses: boolean;
  /** @deprecated Usa canManageTeam directamente */
  canManageTeam: boolean;
  /** @deprecated Usa canViewCredits directamente */
  canViewCredits: boolean;
  /** @deprecated Usa canManageCredits directamente */
  canManageCredits: boolean;
};

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
 *
 * Consume la matriz centralizada de `@/config/permissions` para derivar
 * todos los permisos a partir del rol. Mantiene aliases legacy para
 * backward compatibility con componentes existentes.
 */
export function usePermission(): UsePermissionReturn {
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
    // ── Fiscal Preview Mode (demo / preview) ──
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
      isPosOnlySeller: false,
      // Legacy aliases
      canDelete: true,
    } satisfies UsePermissionReturn;
    }

    // ── Normal path ──
    const roleString = currentOrg?.role?.toString() ?? '';
    const role = roleString.toUpperCase().trim();

    const isSuperAdmin = isPlatformSuperAdmin || role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'MANAGER';
    const isSeller = role === 'SELLER';
    const isWarehouse = role === 'WAREHOUSE';
    const isFiscal = role === 'FISCAL';
    const isPosOperator = role === 'POS_OPERATOR';

    // Derivar permisos desde la matriz centralizada.
    // Si el rol es desconocido, getPermissionsForRole retorna todo en false.
    const rolePerms = getPermissionsForRole(role);

    // Para Super Admin de plataforma, forzar todos los permisos en true
    // independientemente de la matriz (puede estar en una org donde su rol
    // es distinto o no tiene rol asignado).
    const base: PermissionMap = isSuperAdmin
      ? {
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
        }
      : rolePerms;

    return {
      ...base,
      // Identity strings
      role,
      isSuperAdmin,
      isAdmin,
      isManager,
      isSeller,
      isWarehouse,
      isFiscal,
      isPosOperator,
      /** Cajero (SELLER): solo POS a pantalla completa, sin menú ni dashboard. */
      isPosOnlySeller: isSeller && !isSuperAdmin && !isAdmin && !isManager,
      // Legacy aliases (backward compatibility)
      canDelete: base.canManageTeam || base.canDeleteInvoices,
    } satisfies UsePermissionReturn;
  }, [currentOrg, isPlatformSuperAdmin]);

  return permissions;
}
