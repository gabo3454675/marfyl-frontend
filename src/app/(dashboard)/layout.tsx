'use client';

import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isFiscalPreviewMode, seedFiscalPreviewAuth } from '@/lib/fiscal-preview';
import { readSessionCookieFromDocument, setSessionCookie } from '@/lib/auth-session-cookie';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import BottomNav from '@/components/bottom-nav';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { NotificationFeedProvider } from '@/hooks/useNotificationFeed';
import { RateConfigModal } from '@/components/rate-config-modal';
import { AssistantProvider } from '@/components/assistant/assistant-provider';
import { MarfylAssistant } from '@/components/assistant/marfyl-assistant';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';
import { DevAppSwitcher } from '@/components/marketing/dev-app-switcher';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const isAssistantRoute = pathname === '/assistant' || pathname.startsWith('/assistant/');
  const devPreview = isFiscalPreviewMode();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const selectedOrganizationId = useAuthStore((state) => state.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((state) => state.selectedCompanyId);
  const hasOrganizations = useAuthStore((state) => state.hasOrganizations());
  const getOrganizations = useAuthStore((state) => state.getOrganizations);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  // Usar organizationId o companyId como fallback
  const selectedId = selectedOrganizationId || selectedCompanyId;
  // Super Admin sin orgs en BD: no bloquear con loading infinito
  const orgsList = getOrganizations();
  const isSuperAdminWithNoOrgs = user?.isSuperAdmin === true && orgsList.length === 0;
  const [rateConfigModalOpen, setRateConfigModalOpen] = useState(false);

  // Sincronizar facturas pendientes al volver online
  useSync();

  // Sincronizar tasa de cambio desde el servidor: todos ven la misma tasa por organización
  const syncOrganizationRate = useCallback(() => {
    const id = useAuthStore.getState().selectedOrganizationId || useAuthStore.getState().selectedCompanyId;
    if (!id) return;
    apiClient
      .get<{ exchangeRate?: number; rateUpdatedAt?: string | null; rateUpdatedBy?: string | null; currencyCode?: string; currencySymbol?: string }>('/tenants/organization')
      .then((res) => {
        const d = res.data;
        useAuthStore.getState().setOrganizationConfig(id, {
          exchangeRate: d.exchangeRate,
          rateUpdatedAt: d.rateUpdatedAt ?? undefined,
          rateUpdatedBy: d.rateUpdatedBy ?? undefined,
          currencyCode: d.currencyCode,
          currencySymbol: d.currencySymbol,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated || !selectedId) return;
    syncOrganizationRate();
  }, [mounted, hasHydrated, isAuthenticated, selectedId, syncOrganizationRate]);

  /** Campanita / feed: abrir modal de tasa desde recordatorio */
  useEffect(() => {
    const openRate = () => setRateConfigModalOpen(true);
    window.addEventListener('open-rate-config-modal', openRate);
    return () => window.removeEventListener('open-rate-config-modal', openRate);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !selectedId) return;
    const onSync = () => syncOrganizationRate();
    const onVisibility = () => { if (document.visibilityState === 'visible') onSync(); };
    window.addEventListener('focus', onSync);
    window.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onSync);
      window.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated, selectedId, syncOrganizationRate]);

  // Cliente montado + auth lista (useLayoutEffect evita pantalla congelada en SSR)
  useLayoutEffect(() => {
    setMounted(true);
    if (devPreview) seedFiscalPreviewAuth();
    if (!useAuthStore.getState()._hasHydrated) {
      useAuthStore.getState().setHasHydrated(true);
    }
  }, [devPreview]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        useAuthStore.getState().setHasHydrated(true);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted && hasHydrated && isAuthenticated && !readSessionCookieFromDocument()) {
      setSessionCookie();
    }
  }, [mounted, hasHydrated, isAuthenticated]);

  useEffect(() => {
    // Solo redirigir después de que el estado se haya hidratado y montado
    if (mounted && hasHydrated) {
      if (!isAuthenticated && !devPreview) {
        if (pathname === '/' || pathname === '') {
          router.replace('/empresa');
        } else {
          router.push('/login');
        }
        return;
      }
      if (devPreview) return;

      // requiresPasswordChange: bloquear acceso hasta actualizar clave temporal
      if (user?.requiresPasswordChange) {
        router.push(`/reset-password?email=${encodeURIComponent(user.email)}`);
        return;
      }

      // Org guardada inválida (p. ej. tras cambio de cuenta): elegir la primera disponible
      if (hasOrganizations && selectedId && user && !user.isSuperAdmin) {
        const orgIds = user.organizations?.map((o) => o.id) ?? [];
        const companyIds = user.companies?.map((c) => c.id) ?? [];
        const valid = orgIds.includes(selectedId) || companyIds.includes(selectedId);
        if (!valid) {
          if (orgIds.length > 0) {
            useAuthStore.getState().selectOrganization(orgIds[0]);
          } else if (companyIds.length > 0) {
            useAuthStore.getState().selectCompany(companyIds[0]);
          }
        }
      }

      // Validar que hay organizaciones disponibles
      if (hasOrganizations && !selectedId) {
        // Priorizar organizations sobre companies
        if (user?.organizations && user.organizations.length > 0) {
          useAuthStore.getState().selectOrganization(user.organizations[0].id);
        } else if (user?.companies && user.companies.length > 0) {
          useAuthStore.getState().selectCompany(user.companies[0].id);
        } else if (user?.isSuperAdmin) {
          // Super Admin sin org seleccionada: fetch y asignar la primera disponible (o dejar [] si no hay ninguna)
          apiClient.get<{ id: number; name: string; slug: string; plan: string }[]>('/tenants/organizations-all')
            .then((res) => {
              const orgs = res.data || [];
              useAuthStore.getState().setSuperAdminOrganizations(orgs.map((o) => ({
                id: o.id,
                name: o.name,
                slug: o.slug,
                plan: o.plan,
                role: 'SUPER_ADMIN',
                currencyCode: 'USD',
                currencySymbol: '$',
                exchangeRate: 1,
                rateUpdatedAt: null,
              })));
              if (orgs.length > 0) {
                useAuthStore.getState().selectOrganization(orgs[0].id);
              }
            })
            .catch(() => {
              useAuthStore.getState().setSuperAdminOrganizations([]);
            });
        }
      }
    }
  }, [mounted, hasHydrated, isAuthenticated, selectedId, hasOrganizations, user, router, pathname, devPreview]);

  // Mientras se carga o hidrata, mostrar un estado de carga
  if (!mounted || !hasHydrated) {
    return (
      <div className="admin-loading-shell dm-app-shell min-h-screen bg-background">
        <div className="admin-loading-ring" aria-hidden />
        <p className="text-sm text-muted-foreground">Cargando MARFYL…</p>
      </div>
    );
  }

  // Si no está autenticado después de hidratar, mostrar carga mientras redirige
  if (!isAuthenticated && !devPreview) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Validar que hay una organización seleccionada antes de mostrar el contenido
  if (hasOrganizations && !selectedId) {
    // Super Admin con 0 orgs en BD: mensaje claro en lugar de loading infinito
    if (isSuperAdminWithNoOrgs) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md px-4 space-y-4">
            <p className="text-muted-foreground">
              No hay organizaciones en el sistema. Crea una desde Configuración para comenzar.
            </p>
            <Button variant="default" onClick={() => router.push('/settings')}>
              Ir a Configuración
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Seleccionando organización...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationFeedProvider>
      <AssistantProvider>
      <>
      <div className="dm-app-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden md:flex-row md:gap-0">
        <DmAmbientMotion palette="a" intensity="subtle" />
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="admin-main-pane flex flex-1 flex-col min-h-0 min-w-0 w-full bg-background">
          <AdminTopbar onOpenRateConfig={() => setRateConfigModalOpen(true)} />
          {devPreview && <DevAppSwitcher />}
          <div
            className={
              isAssistantRoute
                ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden'
                : 'app-main-scroll'
            }
          >
            <div className={isAssistantRoute ? 'flex flex-1 flex-col min-h-0 min-w-0' : 'app-page-shell'}>
              {children}
            </div>
          </div>
        </main>

        {/* Modal de configuración de tasa (abierto desde el indicador o la campanita) */}
        <RateConfigModal open={rateConfigModalOpen} onOpenChange={setRateConfigModalOpen} />

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Fuera del flex shell: evita recorte por overflow-hidden en desktop */}
      {!isAssistantRoute && <MarfylAssistant />}
      </>
      </AssistantProvider>
    </NotificationFeedProvider>
  );
}
