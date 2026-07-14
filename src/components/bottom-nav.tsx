'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Grid2x2, ShoppingCart, Box, MoreVertical, LogOut, ExternalLink } from 'lucide-react';
import { FISCAL_NAV_ITEMS } from '@/config/fiscal-nav';
import {
  APP_NAV_SECTIONS,
  getNavItem,
  getQuickAccessItems,
  getSectionIdForNavItem,
  resolveAppNavId,
} from '@/config/app-nav';
import { resolveConcertNavId } from '@/config/concert-nav';
import { CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';
import { useConcertNavItems } from '@/hooks/useConcertNavItems';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { NavSectionCollapsible } from '@/components/layout/sidebar-nav-parts';
import { useNavSectionsOpen } from '@/hooks/useNavSectionsOpen';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { canShowNavItem, type NavItem } from '@/hooks/useNavByRole';
import { useAuthStore } from '@/store/useAuthStore';
import { markExplicitLogout } from '@/lib/fiscal-preview';

const bottomBarItems = [
  { id: 'dashboard', label: 'Inicio', icon: Grid2x2, href: '/dashboard', permission: 'canViewDashboard' as const },
  { id: 'pos', label: 'POS', icon: ShoppingCart, href: '/pos', permission: 'canManageInvoices' as const },
  { id: 'products', label: 'Inventario', icon: Box, href: '/products', permission: 'canManageProducts' as const },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const permissions = usePermission();
  const { logout } = useAuthStore();
  const concertNavItems = useConcertNavItems();

  const activeItem = (() => {
    if (resolveConcertNavId(pathname ?? '')) return 'more';
    const appId = resolveAppNavId(pathname ?? '');
    if (appId === 'dashboard' || appId === 'pos' || appId === 'products') return appId;
    return 'more';
  })();

  const activeSectionId = getSectionIdForNavItem(resolveAppNavId(pathname ?? ''));
  const { isOpen: isSectionOpen, toggle: toggleSection } = useNavSectionsOpen(activeSectionId);

  const visibleMainNav = bottomBarItems.filter((item) => canShowNavItem(item, permissions));

  const handleMenuItemClick = (href: string) => {
    router.push(href);
    setIsSheetOpen(false);
  };

  const handleLogout = async () => {
    setIsSheetOpen(false);
    markExplicitLogout();
    await logout();
    window.location.assign('/login');
  };

  return (
    <nav className="bottom-nav-fixed" aria-label="Navegación principal">
      <div className="bottom-nav-inner">
        {visibleMainNav.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={activeItem === item.id ? 'true' : 'false'}
            className="admin-bottom-nav-item cursor-pointer"
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            aria-current={activeItem === item.id ? 'page' : undefined}
          >
            <item.icon aria-hidden />
            <span className="truncate w-full text-center leading-tight">{item.label}</span>
          </button>
        ))}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              data-active={activeItem === 'more' ? 'true' : 'false'}
              className={cn('admin-bottom-nav-item admin-bottom-nav-more cursor-pointer')}
              aria-label="Más opciones"
              aria-expanded={isSheetOpen}
            >
              <MoreVertical aria-hidden />
              <span className="truncate w-full text-center leading-tight">Más</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[min(85dvh,36rem)] pb-[calc(var(--app-bottom-chrome)+0.75rem)] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Organización activa</p>
              <OrganizationSwitcher variant="menu-list" onBeforeSwitch={() => setIsSheetOpen(false)} />
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                Acceso rápido
              </p>
              <div className="grid grid-cols-2 gap-2">
                {getQuickAccessItems()
                  .filter((item) => canShowNavItem(item, permissions))
                  .map((item) => {
                    const isActive = resolveAppNavId(pathname ?? '') === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? 'default' : 'outline'}
                        className="h-11 justify-start gap-2 cursor-pointer"
                        onClick={() => handleMenuItemClick(item.href)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{item.label}</span>
                      </Button>
                    );
                  })}
              </div>
            </div>

            <div className="mt-4 space-y-0">
              {APP_NAV_SECTIONS.map((section) => {
                const items = section.itemIds
                  .map((id) => getNavItem(id))
                  .filter(Boolean)
                  .filter((item) => canShowNavItem(item as NavItem, permissions));
                if (items.length === 0) return null;
                const hasActiveChild = items.some(
                  (item) => resolveAppNavId(pathname ?? '') === item!.id,
                );
                return (
                  <NavSectionCollapsible
                    key={section.id}
                    id={section.id}
                    label={section.label}
                    open={isSectionOpen(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    hasActiveChild={hasActiveChild}
                    variant="sheet"
                  >
                    {items.map((item) => {
                      const isActive = pathname.startsWith(item!.href) && item!.href !== '/dashboard';
                      const Icon = item!.icon;
                      return (
                        <Button
                          key={item!.id}
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-3 h-11 pl-4 cursor-pointer',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-foreground hover:bg-secondary',
                          )}
                          onClick={() => handleMenuItemClick(item!.href)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm truncate">{item!.label}</span>
                        </Button>
                      );
                    })}
                  </NavSectionCollapsible>
                );
              })}

              {permissions.canManageFiscal && (
                <NavSectionCollapsible
                  id="fiscal"
                  label="Fiscal MARFYL"
                  open={isSectionOpen('fiscal')}
                  onToggle={() => toggleSection('fiscal')}
                  variant="sheet"
                >
                  {FISCAL_NAV_ITEMS.map((item) => {
                    const isActive =
                      pathname.startsWith(item.href) &&
                      (item.href !== '/fiscal' || pathname === '/fiscal');
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 h-11 pl-4 cursor-pointer',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-foreground hover:bg-secondary',
                        )}
                        onClick={() => handleMenuItemClick(item.href)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm truncate">{item.label}</span>
                      </Button>
                    );
                  })}
                </NavSectionCollapsible>
              )}

              {concertNavItems.length > 0 && (
                <NavSectionCollapsible
                  id="concierto"
                  label="Evento Monddy"
                  open={isSectionOpen('concierto')}
                  onToggle={() => toggleSection('concierto')}
                  variant="sheet"
                >
                  {concertNavItems.map((item) => {
                    const isActive = resolveConcertNavId(pathname ?? '') === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 h-11 pl-4 cursor-pointer',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-foreground hover:bg-secondary',
                        )}
                        onClick={() => handleMenuItemClick(item.href)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm truncate">{item.label}</span>
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 pl-4 cursor-pointer text-foreground hover:bg-secondary"
                    onClick={() => handleMenuItemClick(`/evento/${CONCERT_DEFAULT_SLUG}`)}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">Página pública de entradas</span>
                  </Button>
                </NavSectionCollapsible>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <ThemeToggle variant="full" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Cerrar Sesión</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
