'use client';

import { useMemo } from 'react';
import { HYBRID_NAV_ITEMS } from '@/config/hybrid-nav';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import { usePermission } from '@/hooks/usePermission';
import { isHybridEnabledForOrganization } from '@/lib/hybrid/feature';
import { useAuthStore } from '@/store/useAuthStore';

/** Ítems de navegación Hybrid (solo Monddy), filtrados por org y rol. */
export function useHybridNavItems() {
  const permissions = usePermission();
  const user = useAuthStore((s) => s.user);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  return useMemo(() => {
    if (!_hasHydrated) return [];

    const selectedId = selectedOrganizationId ?? selectedCompanyId;
    let currentOrg: { slug: string } | null = null;

    if (user?.isSuperAdmin && superAdminOrganizations.length > 0 && selectedId) {
      currentOrg = superAdminOrganizations.find((o) => o.id === selectedId) ?? null;
    } else if (selectedId && user?.organizations?.length) {
      currentOrg = user.organizations.find((o) => o.id === selectedId) ?? null;
    }

    if (!isHybridEnabledForOrganization(currentOrg)) return [];

    return HYBRID_NAV_ITEMS.filter((item) =>
      canShowNavItem(item as NavItem, permissions),
    );
  }, [
    _hasHydrated,
    user,
    superAdminOrganizations,
    selectedOrganizationId,
    selectedCompanyId,
    permissions,
  ]);
}
