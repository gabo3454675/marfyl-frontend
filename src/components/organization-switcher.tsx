'use client';

import { Building2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useOrganizationSwitcher } from '@/hooks/useOrganizationSwitcher';

type OrganizationSwitcherProps = {
  variant: 'topbar' | 'menu-list' | 'dropdown' | 'gallery';
  className?: string;
  onBeforeSwitch?: () => void;
};

export function OrganizationSwitcher({
  variant,
  className,
  onBeforeSwitch,
}: OrganizationSwitcherProps) {
  const {
    organizations,
    currentOrg,
    selectedId,
    hasMultipleOrganizations,
    switchOrganization,
    isSwitching,
  } = useOrganizationSwitcher();

  const handleSwitch = (organizationId: number) => {
    onBeforeSwitch?.();
    void switchOrganization(organizationId);
  };

  const orgName = currentOrg?.name || 'Mi organización';

  if (!hasMultipleOrganizations) {
    if (variant === 'topbar' || variant === 'gallery') {
      return (
        <span
          className={cn(
            variant === 'gallery' ? 'gallery-org-chip' : 'admin-org-chip',
            className,
          )}
          title={orgName}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          <span className="truncate">{orgName}</span>
        </span>
      );
    }

    return (
      <div
        className={cn(
          'w-full rounded-md border border-border bg-secondary/30 px-3 py-3 text-sm min-h-[44px] flex items-center',
          className,
        )}
      >
        {orgName}
      </div>
    );
  }

  if (variant === 'menu-list') {
    return (
      <div className={cn('space-y-1.5', className)}>
        {organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-2">
            Cargando organizaciones…
          </p>
        ) : (
          organizations.map((org) => {
            const isActive = selectedId === org.id;
            return (
              <button
                key={org.id}
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitch(org.id)}
                className={cn(
                  'flex w-full min-h-[44px] touch-manipulation items-center justify-between rounded-md border px-3 py-3 text-left text-base transition-colors',
                  isActive
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/30 hover:bg-secondary/60',
                )}
              >
                <span className="font-medium truncate pr-2">{org.name}</span>
                {isActive ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </button>
            );
          })
        )}
      </div>
    );
  }

  const triggerClassName =
    variant === 'topbar'
      ? cn(
          'admin-org-chip touch-manipulation cursor-pointer hover:bg-muted/80 active:scale-[0.98] transition-transform',
          className,
        )
      : variant === 'gallery'
        ? cn(
            'gallery-org-chip touch-manipulation cursor-pointer active:scale-[0.98] transition-transform',
            className,
          )
      : cn(
          'admin-org-switcher w-full justify-between text-sidebar-foreground min-h-[44px] py-3 cursor-pointer',
          className,
        );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'topbar' || variant === 'gallery' ? (
          <button
            type="button"
            className={triggerClassName}
            aria-label="Cambiar organización"
            disabled={isSwitching}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">{orgName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          </button>
        ) : (
          <Button
            variant="outline"
            className={triggerClassName}
            disabled={isSwitching}
          >
            <span className="text-sm truncate">{orgName}</span>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        collisionPadding={10}
        className="min-w-[14rem] w-[var(--radix-dropdown-menu-trigger-width)] max-w-[calc(100vw-20px)] z-[120]"
      >
        <DropdownMenuLabel>Empresa / organización</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            Cargando organizaciones…
          </div>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className="cursor-pointer min-h-[44px] py-3 touch-manipulation"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium truncate">{org.name}</span>
                  {org.role ? (
                    <span className="text-xs text-muted-foreground">{org.role}</span>
                  ) : null}
                </div>
                {selectedId === org.id ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : null}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
