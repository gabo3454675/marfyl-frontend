'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { isFiscalPreviewMode, seedFiscalPreviewAuth } from '@/lib/fiscal-preview';
import { readSessionCookieFromDocument, setSessionCookie } from '@/lib/auth-session-cookie';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/api';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { NotificationFeedProvider } from '@/hooks/useNotificationFeed';
import { RateConfigModal } from '@/components/rate-config-modal';
import { AssistantProvider } from '@/components/assistant/assistant-provider';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';
import { DevAppSwitcher } from '@/components/marketing/dev-app-switcher';
import { GalleryAppBar } from '@/components/gallery/gallery-app-bar';
import { useSync } from '@/hooks/useSync';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RouteGuard } from '@/components/RouteGuard';
import { isModuleGalleryEnabled } from '@/lib/gallery/feature';
import { Loader2 } from 'lucide-react';

const Sidebar = dynamic(() => import('@/components/sidebar'), { ssr: false });
const BottomNav = dynamic(() => import('@/components/bottom-nav'), { ssr: false });
const MarfylAssistant = dynamic(
  () => import('@/components/assistant/marfyl-assistant').then((m) => ({ default: m.MarfylAssistant })),
  { ssr: false },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const permissions = usePermission();
  const isPosOnlySeller = permissions.isPosOnlySeller;
  const isWaiterOnly = permissions.isWaiterOnly;
  const isKitchenOnly = permissions.isKitchenOnly;
  const isStationLocked = isPosOnlySeller || isWaiterOnly || isKitchenOnly;
  const isAssistantRoute = pathname === '/assistant' || pathname.startsWith('/assistant/');
  const isPosRoute = pathname === '/pos' || isPosOnlySeller;
  const isComandaRoute =
    pathname.startsWith('/comanda') || isWaiterOnly || isKitchenOnly;
  const devPreview = isFiscalPreviewMode();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const selectedOrganizationId = useAuthStore((state) => state.selectedOrganizationId);
  const selectedCompanyId = useAuthStore((state) => state.selectedCompanyId);
  const user = useAuthStore((state) => state.user);
  const orgsList = useMemo(() => useAuthStore.getState().getOrganizations(), [user]);
  const hasOrganizations = orgsList.length > 0;
  const isSuperAdminWithNoOrgs = user?.isSuperAdmin === true && orgsList.length === 0;
  const [rateConfigModalOpen, setRateConfigModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selectedId = selectedOrganizationId || selectedCompanyId;

  // Detectar rol de estación en la org actual
  const currentOrgForRole = user?.organizations?.find((o) => o.id === selectedId);
  const isPosOperator = currentOrgForRole?.role === 'POS_OPERATOR';
  const orgRole = String(currentOrgForRole?.role ?? '').toUpperCase();
  const isStationRole =
    isPosOperator || orgRole === 'WAITER' || orgRole === 'KITCHEN' || isStationLocked;

  // Sincronizar facturas pendientes al volver online
  useSync();

  // Sincronizar tasa de cambio desde el servidor: todos ven la misma tasa por organización
  const syncOrganizationRate = useCallback(() => {
    const id = useAuthStore.getState().selectedOrganizationId || useAuthStore.getState().selectedCompanyId;
    if (!id) return;
    apiClient
      .get<{ exchangeRate?: number; rateUpdatedAt?: string | null; rateUpdatedBy?: string | null; euroExchangeRate?: number | null; euroRateUpdatedAt?: string | null; currencyCode?: string; currencySymbol?: string }>('/tenants/organization')
      .then((res) => {
        const d = res.data;
        useAuthStore.getState().setOrganizationConfig(id, {
          exchangeRate: d.exchangeRate,
          rateUpdatedAt: d.rateUpdatedAt ?? undefined,
          rateUpdatedBy: d.rateUpdatedBy ?? undefined,
          euroExchangeRate: d.euroExchangeRate ?? null,
          euroRateUpdatedAt: d.euroRateUpdatedAt ?? null,
          currencyCode: d.currencyCode,
          currencySymbol: d.currencySymbol,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated || !selectedId || isStationRole) return;
    syncOrganizationRate();
  }, [mounted, hasHydrated, isAuthenticated, selectedId, syncOrganizationRate, isStationRole]);

  /** Refrescar tasa al volver a la pestaña + cada 15 min (backend cachea 60s) — no necesario para POS_OPERATOR */
  useEffect(() => {
    if (!isAuthenticated || !selectedId || isPosOperator) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncOrganizationRate();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(syncOrganizationRate, 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, selectedId, syncOrganizationRate, isPosOperator]);

  // Cliente montado + auth lista (useLayoutEffect evita pantalla congelada en SSR)
  useLayoutEffect(() => {
    setMounted(true);
    if (devPreview) seedFiscalPreviewAuth();
    if (!useAuthStore.getState()._hasHydrated) {
      useAuthStore.getState().setHasHydrated(true);
    }
  }, [devPreview]);

  /** Campanita: abrir modal informativo de tasa */
  useEffect(() => {
    const openRate = () => setRateConfigModalOpen(true);
    window.addEventListener('open-rate-config-modal', openRate);
    return () => window.removeEventListener('open-rate-config-modal', openRate);
  }, []);

  useEffect(() => {
    if (mounted && hasHydrated && isAuthenticated && !readSessionCookieFromDocument()) {
      setSessionCookie();
    }
  }, [mounted, hasHydrated, isAuthenticated]);

  useEffect(() => {
    // Solo redirigir después de que el estado se haya hidratado y montado
    if (mounted && hasHydrated) {
      console.log('[dashboard-layout] auth redirect check:', { isAuthenticated, devPreview, pathname });
      if (!isAuthenticated && !devPreview) {
        if (pathname === '/' || pathname === '') {
          console.log('[dashboard-layout] REDIRECT: not authenticated, root path -> /empresa');
          router.replace('/empresa');
        } else {
          console.log('[dashboard-layout] REDIRECT: not authenticated, other path -> /login');
          router.push('/login');
        }
        return;
      }
      if (devPreview) return;

      // Estaciones: home → su pantalla operativa
      if (isPosOperator && (pathname === '/' || pathname === '')) {
        router.replace('/pos');
        return;
      }
      if (currentOrgForRole?.role === 'WAITER' && (pathname === '/' || pathname === '')) {
        router.replace('/comanda');
        return;
      }
      if (currentOrgForRole?.role === 'KITCHEN' && (pathname === '/' || pathname === '')) {
        router.replace('/comanda/cocina');
        return;
      }

      if (
        isAuthenticated &&
        user &&
        !user.isSuperAdmin &&
        !hasOrganizations
      ) {
        router.replace('/onboarding');
        return;
      }

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

  /** Cajero: solo POS */
  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated || devPreview) return;
    if (!isPosOnlySeller) return;
    if (pathname !== '/pos') {
      router.replace('/pos');
    }
  }, [mounted, hasHydrated, isAuthenticated, isPosOnlySeller, pathname, router, devPreview]);

  /** Anfitrión: solo pantalla tomar pedido (+ historial propio) */
  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated || devPreview) return;
    if (!isWaiterOnly) return;
    const allowed =
      pathname === '/comanda' ||
      pathname.startsWith('/comanda/historial');
    if (!allowed) {
      router.replace('/comanda');
    }
  }, [mounted, hasHydrated, isAuthenticated, isWaiterOnly, pathname, router, devPreview]);

  /** Cocina: solo cola */
  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated || devPreview) return;
    if (!isKitchenOnly) return;
    if (pathname !== '/comanda/cocina') {
      router.replace('/comanda/cocina');
    }
  }, [mounted, hasHydrated, isAuthenticated, isKitchenOnly, pathname, router, devPreview]);

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

  // Estaciones (caja / anfitrión / cocina): layout ligero
  if (isStationRole) {
    return (
      <NotificationFeedProvider>
        <div
          className={cn(
            'dm-app-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden md:flex-row md:gap-0',
            isPosOnlySeller && 'dm-app-shell--pos-only',
          )}
        >
          <DmAmbientMotion palette="a" intensity="subtle" />
          {!isModuleGalleryEnabled() && <Sidebar />}
          <main className="admin-main-pane flex flex-1 flex-col min-h-0 min-w-0 w-full bg-background">
            {isModuleGalleryEnabled() ? (
              <GalleryAppBar />
            ) : (
              <AdminTopbar onOpenRateConfig={() => setRateConfigModalOpen(true)} />
            )}
            <div
              className={cn(
                'app-main-scroll',
                (isPosRoute || isComandaRoute) && 'app-main-scroll--pos',
                isPosRoute && 'flex flex-col',
              )}
            >
              <div className={cn('app-page-shell', isPosRoute && 'app-page-shell--pos')}>
                <RouteGuard pathname={pathname}>
                  {children}
                </RouteGuard>
              </div>
            </div>
          </main>
          {!isModuleGalleryEnabled() && <BottomNav />}
        </div>
      </NotificationFeedProvider>
    );
  }

  // Layout completo para otros roles
  return (
    <NotificationFeedProvider>
      <AssistantProvider>
      <>
      <div
        className={cn(
          'dm-app-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden md:flex-row md:gap-0',
          isPosOnlySeller && 'dm-app-shell--pos-only',
        )}
      >
        {!isPosOnlySeller && !isModuleGalleryEnabled() && <DmAmbientMotion palette="a" intensity="subtle" />}
        {!isPosOnlySeller && !isModuleGalleryEnabled() && <Sidebar />}
        <main className="admin-main-pane flex flex-1 flex-col min-h-0 min-w-0 w-full bg-background">
          {isModuleGalleryEnabled() ? (
            <GalleryAppBar />
          ) : (
            !isPosOnlySeller && (
              <AdminTopbar onOpenRateConfig={() => setRateConfigModalOpen(true)} />
            )
          )}
          {devPreview && !isPosOnlySeller && !isModuleGalleryEnabled() && <DevAppSwitcher />}
          <div
            className={
              isAssistantRoute
                ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden'
                : cn(
                  'app-main-scroll',
                  isPosRoute && 'app-main-scroll--pos flex flex-col',
                )
            }
          >
            <div
              className={
                isAssistantRoute
                  ? 'flex flex-1 flex-col min-h-0 min-w-0'
                  : cn('app-page-shell', isPosRoute && 'app-page-shell--pos')
              }
            >
              <RouteGuard pathname={pathname}>
                {children}
              </RouteGuard>
            </div>
          </div>
        </main>
        {!isPosOnlySeller && (
          <RateConfigModal open={rateConfigModalOpen} onOpenChange={setRateConfigModalOpen} />
        )}

        {!isPosOnlySeller && !isModuleGalleryEnabled() && <BottomNav />}
      </div>

      {!isAssistantRoute && !isPosOnlySeller && (
        <MarfylAssistant hideOnMobile={pathname === '/pos'} />
      )}
      </>
      </AssistantProvider>
    </NotificationFeedProvider>
  );
}
