'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isHybridEnabledForOrganization } from '@/lib/hybrid/feature';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Gate de páginas Hybrid: solo Monddy.
 * Si la org activa no es elegible, redirige a `/` sin filtrar el nombre del módulo.
 */
export function useHybridPageGate(): {
  ready: boolean;
  allowed: boolean;
} {
  const router = useRouter();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId);
  const superAdminOrganizations = useAuthStore((s) => s.superAdminOrganizations);
  const user = useAuthStore((s) => s.user);
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);

  const allowed = useMemo(() => {
    if (!_hasHydrated) return false;
    const org = getCurrentOrganization();
    const slug =
      org && 'slug' in org && typeof org.slug === 'string' ? org.slug : null;
    return isHybridEnabledForOrganization(slug ? { slug } : null);
  }, [
    _hasHydrated,
    selectedOrganizationId,
    selectedCompanyId,
    superAdminOrganizations,
    user,
    getCurrentOrganization,
  ]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!allowed) {
      router.replace('/');
    }
  }, [_hasHydrated, allowed, router]);

  return {
    ready: _hasHydrated,
    allowed,
  };
}
