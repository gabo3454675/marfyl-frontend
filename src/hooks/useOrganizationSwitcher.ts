'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useOrganizationSwitcher() {
  const {
    user,
    selectedCompanyId,
    selectedOrganizationId,
    selectCompany,
    selectOrganization,
    setToken,
    setRefreshToken,
    setSuperAdminOrganizations,
    getOrganizations,
    getCurrentOrganization,
  } = useAuthStore();

  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    apiClient
      .get<
        {
          id: number;
          name: string;
          slug: string;
          plan: string;
          currencyCode?: string;
          currencySymbol?: string;
          exchangeRate?: number;
          rateUpdatedAt?: string | null;
        }[]
      >('/tenants/organizations-all')
      .then((res) => {
        const orgs = (res.data || []).map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          plan: o.plan ?? 'FREE',
          role: 'SUPER_ADMIN',
          currencyCode: o.currencyCode ?? 'USD',
          currencySymbol: o.currencySymbol ?? '$',
          exchangeRate: o.exchangeRate ?? 1,
          rateUpdatedAt: o.rateUpdatedAt ?? null,
        }));
        setSuperAdminOrganizations(orgs);
      })
      .catch(() => {});
  }, [user?.isSuperAdmin, setSuperAdminOrganizations]);

  const organizations = getOrganizations();
  const currentOrg = getCurrentOrganization();
  const selectedId = selectedOrganizationId || selectedCompanyId;
  const hasMultipleOrganizations =
    user?.isSuperAdmin === true ? true : organizations.length > 1;

  const [isSwitching, setIsSwitching] = useState(false);

  const switchOrganization = useCallback(
    async (organizationId: number) => {
      if (organizationId === selectedId) return;

      setIsSwitching(true);
      try {
        if (
          user?.isSuperAdmin ||
          (user?.organizations && user.organizations.length > 0)
        ) {
          try {
            const data = await authService.switchOrganization(organizationId);
            if (data?.access_token) {
              setToken(data.access_token);
              if (data.refreshToken) {
                setRefreshToken(data.refreshToken);
              }
              selectOrganization(data.organizationId ?? organizationId);
            } else {
              selectOrganization(organizationId);
            }
          } catch {
            selectOrganization(organizationId);
          }
        } else {
          selectCompany(organizationId);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('organization-changed'));
          window.location.href = '/dashboard';
        }
      } finally {
        setIsSwitching(false);
      }
    },
    [
      user,
      selectedId,
      setToken,
      setRefreshToken,
      selectOrganization,
      selectCompany,
    ],
  );

  return {
    organizations,
    currentOrg,
    selectedId,
    hasMultipleOrganizations,
    switchOrganization,
    isSwitching,
  };
}
