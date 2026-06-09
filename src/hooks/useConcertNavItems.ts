'use client';

import { useMemo } from 'react';
import { CONCERT_NAV_ITEMS } from '@/config/concert-nav';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import { usePermission } from '@/hooks/usePermission';
import {
  isConcertAdminEnabledForOrganization,
  isConcertFeatureEnabled,
} from '@/lib/concert/feature';
import { useAuthStore } from '@/store/useAuthStore';

/** Ítems de navegación del módulo temporal de concierto (Monddy), filtrados por org y rol. */
export function useConcertNavItems() {
  const permissions = usePermission();
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);

  return useMemo(() => {
    const currentOrg = getCurrentOrganization();
    const enabled =
      isConcertFeatureEnabled() &&
      isConcertAdminEnabledForOrganization(
        currentOrg && 'slug' in currentOrg
          ? (currentOrg as { slug: string; concertModuleEnabled?: boolean })
          : null,
      );
    if (!enabled) return [];
    return CONCERT_NAV_ITEMS.filter((item) => canShowNavItem(item as NavItem, permissions));
  }, [getCurrentOrganization, permissions, selectedOrganizationId, selectedCompanyId]);
}
