'use client';

import { useMemo } from 'react';
import { HYBRID_NAV_ITEMS } from '@/config/hybrid-nav';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import { usePermission } from '@/hooks/usePermission';
import { isHybridEnabledForOrganization } from '@/lib/hybrid/feature';
import { useAuthStore } from '@/store/useAuthStore';

/** Ítems de navegación Hybrid (orgs fundadoras), filtrados por org y rol. */
export function useHybridNavItems() {
  const permissions = usePermission();
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);
  const user = useAuthStore((s) => s.user);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  return useMemo(() => {
    if (!_hasHydrated) return [];

    const currentOrg = getCurrentOrganization();
    if (!isHybridEnabledForOrganization(currentOrg)) return [];

    return HYBRID_NAV_ITEMS.filter((item) =>
      canShowNavItem(item as NavItem, permissions, currentOrg),
    );
  }, [
    _hasHydrated,
    getCurrentOrganization,
    user,
    superAdminOrganizations,
    selectedOrganizationId,
    selectedCompanyId,
    permissions,
  ]);
}
