'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronDown, LogOut, Check, Download, Landmark } from 'lucide-react';
import { isFiscalRoute, resolveFiscalNavId } from '@/config/fiscal-nav';
import {
  APP_NAV_SECTIONS,
  getNavItem,
  getQuickAccessItems,
  getSectionIdForNavItem,
  resolveAppNavId,
} from '@/config/app-nav';
import { resolveConcertNavId } from '@/config/concert-nav';
import { useConcertNavItems } from '@/hooks/useConcertNavItems';
import { FiscalNavCollapsible, NavSectionCollapsible, SidebarNavLink } from '@/components/layout/sidebar-nav-parts';
import { useNavSectionsOpen } from '@/hooks/useNavSectionsOpen';
import { MarfylLogo } from '@/components/brand/marfyl-logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient, authService } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ThemeToggle } from '@/components/theme-toggle';
import { markExplicitLogout } from '@/lib/fiscal-preview';

const SIDEBAR_COLLAPSED_KEY = 'marfyl-sidebar-collapsed';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === '1') setIsCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.sidebarCollapsed = isCollapsed ? 'true' : 'false';
    document.documentElement.style.setProperty(
      '--admin-sidebar-width',
      isCollapsed ? '4.75rem' : '17rem',
    );
  }, [isCollapsed]);
  const [fiscalOpen, setFiscalOpen] = useState(() => isFiscalRoute(pathname ?? ''));

  useEffect(() => {
    if (isFiscalRoute(pathname ?? '')) setFiscalOpen(true);
  }, [pathname]);
  const { 
    user, 
    logout, 
    selectedCompanyId, 
    selectedOrganizationId,
    selectCompany,
    selectOrganization,
    setToken,
    setSuperAdminOrganizations,
    getCurrentOrganization,
    getOrganizations,
  } = useAuthStore();

  // Hydration para Super Admin: cargar TODAS las organizaciones desde /tenants/organizations-all
  // (no solo las vinculadas al perfil). Si no hay org seleccionada, asignar la primera.
  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    apiClient
      .get<{ id: number; name: string; slug: string; plan: string; currencyCode?: string; currencySymbol?: string; exchangeRate?: number; rateUpdatedAt?: string | null; concertModuleEnabled?: boolean }[]>('/tenants/organizations-all')
      .then((res) => {
        const orgs = (res.data || []).map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          plan: o.plan,
          role: 'SUPER_ADMIN',
          currencyCode: o.currencyCode ?? 'USD',
          currencySymbol: o.currencySymbol ?? '$',
          exchangeRate: o.exchangeRate ?? 1,
          rateUpdatedAt: o.rateUpdatedAt ?? null,
          concertModuleEnabled: o.concertModuleEnabled,
        }));
        setSuperAdminOrganizations(orgs);
        const currentId = useAuthStore.getState().selectedOrganizationId || useAuthStore.getState().selectedCompanyId;
        if (orgs.length > 0 && !currentId) {
          useAuthStore.getState().selectOrganization(orgs[0].id);
          window.location.href = '/';
        }
      })
      .catch(() => {});
  }, [user?.isSuperAdmin, setSuperAdminOrganizations]);
  
  // Obtener permisos del usuario actual
  const permissions = usePermission();
  const { isInstallable, install } = usePWAInstall();
  const concertNavItems = useConcertNavItems();

  const getActiveItem = () => {
    const cid = resolveConcertNavId(pathname ?? '');
    if (cid) return cid;
    const fid = resolveFiscalNavId(pathname ?? '');
    if (fid) return fid;
    return resolveAppNavId(pathname ?? '');
  };

  const activeItem = getActiveItem();
  const activeSectionId = getSectionIdForNavItem(activeItem);
  const { isOpen: isSectionOpen, toggle: toggleSection } = useNavSectionsOpen(activeSectionId);

  const handleLogout = async () => {
    markExplicitLogout();
    await logout();
    window.location.assign('/login');
  };

  // Cambio de organización: obtener nuevo JWT con el tenantId (backend no confía en el frontend)
  const handleOrganizationChange = async (organizationId: number) => {
    if (user?.isSuperAdmin || (user?.organizations && user.organizations.length > 0)) {
      try {
        const data = await authService.switchOrganization(organizationId);
        if (data?.access_token) {
          setToken(data.access_token);
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
      window.location.href = '/';
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  // Obtener organización/empresa actual y tasa global (reactiva al guardar en Configuración)
  const currentOrg = getCurrentOrganization();
  const organizations = getOrganizations();
  // Super Admin: selector SIEMPRE visible (carga todas las orgs desde API, no solo membresías)
  const hasMultipleOrganizations = user?.isSuperAdmin === true
    ? true
    : organizations.length > 1;
  const displayRate = useExchangeRate();

  const organizationName = currentOrg?.name || 'Mi Organización';
  const organizationInitials = organizationName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ID seleccionado (priorizar organizationId)
  const selectedId = selectedOrganizationId || selectedCompanyId;

  return (
    <aside
      data-collapsed={isCollapsed ? 'true' : 'false'}
      className={cn(
        'admin-sidebar hidden md:flex flex-col transition-[width] duration-300 ease-out h-full min-h-0 shrink-0 overflow-hidden',
        isCollapsed ? 'w-[var(--admin-sidebar-width-collapsed)]' : 'w-[var(--admin-sidebar-width-expanded)]',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'admin-sidebar-brand flex border-b border-sidebar-border backdrop-blur-sm',
          isCollapsed
            ? 'flex-col items-center gap-2 py-3 px-2'
            : 'h-16 items-center justify-between gap-2 px-4',
        )}
      >
        {!isCollapsed ? (
          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <MarfylLogo href="/" priority className="min-w-0" />
            {displayRate !== 1 && (
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                Tasa: {displayRate.toFixed(2)}
              </span>
            )}
          </div>
        ) : (
          <MarfylLogo variant="icon" href="/" />
        )}
        <div
          className={cn(
            'flex items-center gap-1 flex-shrink-0',
            isCollapsed && 'flex-col w-full',
          )}
        >
          {!isCollapsed && isInstallable && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => install()}
            >
              <Download className="h-3.5 w-3.5" />
              Instalar App
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed && 'h-8 w-8',
            )}
            title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            <ChevronLeft
              className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* Organization switcher — un solo bloque (expandido o icono) */}
      <div
        className={cn(
          'border-b border-sidebar-border',
          isCollapsed ? 'p-2 flex justify-center' : 'p-3 sm:p-4',
        )}
      >
        {hasMultipleOrganizations ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isCollapsed ? (
                <button
                  type="button"
                  className="h-9 w-9 rounded-xl admin-org-switcher flex items-center justify-center text-xs font-semibold text-sidebar-foreground cursor-pointer"
                  title={organizationName}
                  aria-label={`Organización: ${organizationName}`}
                >
                  {organizationInitials}
                </button>
              ) : (
                <Button
                  variant="outline"
                  className="admin-org-switcher w-full justify-between text-sidebar-foreground min-h-[44px] py-3 cursor-pointer"
                >
                  <span className="text-sm truncate">{organizationName}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="bottom"
              collisionPadding={10}
              className="w-[--radix-dropdown-menu-trigger-width] min-w-[14rem] max-w-[calc(100vw-20px)]"
            >
              <DropdownMenuLabel>Seleccionar Organización</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  No hay organizaciones disponibles
                </div>
              ) : (
                organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleOrganizationChange(org.id)}
                    className="cursor-pointer min-h-[44px] py-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        {org.role && (
                          <span className="text-xs text-muted-foreground">
                            {org.role}
                          </span>
                        )}
                      </div>
                      {selectedId === org.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isCollapsed ? (
          <div
            className="h-8 w-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center text-xs font-semibold text-sidebar-foreground"
            title={organizationName}
          >
            {organizationInitials}
          </div>
        ) : (
          <div className="admin-org-switcher w-full px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center text-xs font-semibold text-sidebar-foreground">
                {organizationInitials}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {organizationName}
                </span>
                {currentOrg?.role && (
                  <span className="text-xs text-muted-foreground">
                    {currentOrg.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll [&::-webkit-scrollbar]:w-1.5">
        {!isCollapsed ? (
          <div className="p-3 pb-4 flex flex-col gap-0">
            {/* Accesos rápidos — siempre visibles */}
            <div className="flex flex-col gap-0.5 pb-2 mb-1 border-b border-sidebar-border/40">
              {getQuickAccessItems()
                .filter((item) => canShowNavItem(item, permissions))
                .map((item) => (
                  <SidebarNavLink
                    key={item.id}
                    item={item}
                    active={activeItem === item.id}
                  />
                ))}
            </div>

            {APP_NAV_SECTIONS.map((section) => {
              const items = section.itemIds
                .map((id) => getNavItem(id))
                .filter(Boolean)
                .filter((item) => canShowNavItem(item as NavItem, permissions));
              if (items.length === 0) return null;
              const hasActiveChild = items.some((item) => activeItem === item!.id);
              return (
                <NavSectionCollapsible
                  key={section.id}
                  id={section.id}
                  label={section.label}
                  open={isSectionOpen(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  hasActiveChild={hasActiveChild}
                >
                  {items.map((item) => (
                    <SidebarNavLink
                      key={item!.id}
                      item={item!}
                      active={activeItem === item!.id}
                      compact
                    />
                  ))}
                </NavSectionCollapsible>
              );
            })}

            {permissions.canManageFiscal && (
              <FiscalNavCollapsible
                pathname={pathname ?? ''}
                fiscalOpen={fiscalOpen}
                onToggle={() => setFiscalOpen((o) => !o)}
              />
            )}

            {concertNavItems.length > 0 && (
              <NavSectionCollapsible
                id="concierto"
                label="Evento Monddy"
                open={isSectionOpen('concierto')}
                onToggle={() => toggleSection('concierto')}
                hasActiveChild={!!resolveConcertNavId(pathname ?? '')}
              >
                {concertNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.id}
                    item={item}
                    active={activeItem === item.id}
                    compact
                  />
                ))}
              </NavSectionCollapsible>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {getQuickAccessItems()
              .filter((item) => canShowNavItem(item, permissions))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    asChild
                    variant="ghost"
                    data-active={activeItem === item.id ? 'true' : 'false'}
                    className="admin-nav-link-compact justify-center p-0 cursor-pointer"
                    title={item.label}
                  >
                    <Link href={item.href} prefetch>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                  </Button>
                );
              })}

            {APP_NAV_SECTIONS.map((section) => {
              const items = section.itemIds
                .map((id) => getNavItem(id))
                .filter(Boolean)
                .filter((item) => canShowNavItem(item as NavItem, permissions));
              if (items.length === 0) return null;
              const first = items[0]!;
              const HubIcon = section.icon;
              const hasActiveChild = items.some((item) => activeItem === item!.id);
              return (
                <Button
                  key={section.id}
                  asChild
                  variant="ghost"
                  data-active={hasActiveChild ? 'true' : 'false'}
                  className="admin-nav-link-compact justify-center p-0 cursor-pointer"
                  title={section.label}
                >
                  <Link
                    href={first.href}
                    prefetch
                    onClick={() => {
                      if (!isSectionOpen(section.id)) toggleSection(section.id);
                    }}
                  >
                    <HubIcon className="h-5 w-5 flex-shrink-0" />
                  </Link>
                </Button>
              );
            })}

            {permissions.canManageFiscal && (
              <Button
                asChild
                variant="ghost"
                data-active={isFiscalRoute(pathname ?? '') ? 'true' : 'false'}
                className="admin-nav-link-compact justify-center p-0 cursor-pointer"
                title="Fiscal MARFYL"
              >
                <Link
                  href="/fiscal"
                  prefetch
                  onClick={() => setFiscalOpen(true)}
                >
                  <Landmark className="h-5 w-5 flex-shrink-0" />
                </Link>
              </Button>
            )}

            {concertNavItems.length > 0 && (() => {
              const concertItem = concertNavItems[0];
              const ConcertIcon = concertItem.icon;
              return (
                <Button
                  asChild
                  variant="ghost"
                  data-active={resolveConcertNavId(pathname ?? '') ? 'true' : 'false'}
                  className="admin-nav-link-compact justify-center p-0 cursor-pointer"
                  title="Evento Monddy"
                >
                  <Link href={concertItem.href} prefetch>
                    <ConcertIcon className="h-5 w-5 flex-shrink-0" />
                  </Link>
                </Button>
              );
            })()}
          </div>
        )}
      </nav>

      {/* User footer — un solo bloque adaptativo */}
      <div
        className={cn(
          'border-t border-sidebar-border/60 flex-shrink-0 bg-sidebar/50 backdrop-blur-sm',
          isCollapsed ? 'p-2' : 'p-4',
        )}
      >
        <div className={cn('flex flex-col gap-3', isCollapsed && 'items-center gap-2')}>
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <Avatar className={cn('flex-shrink-0', isCollapsed ? 'h-8 w-8' : 'h-10 w-10')} title={`${user?.fullName || 'Usuario'} — ${user?.email || ''}`}>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-semibold text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user?.fullName || 'Usuario'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-xs text-sidebar-foreground/80">Modo oscuro</span>
                <ThemeToggle variant="compact" className="shrink-0" />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent text-sm h-8"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle variant="compact" />
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 justify-center text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
