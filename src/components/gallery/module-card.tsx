'use client';

import Link from 'next/link';
import { type GalleryModuleConfig, resolveModuleItems } from '@/config/modules';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

type ModuleCardProps = {
  module: GalleryModuleConfig;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const permissions = usePermission();
  const currentOrg = useAuthStore((s) => {
    void s.selectedOrganizationId;
    void s.selectedCompanyId;
    void s.superAdminOrganizations;
    void s.user;
    return s.getCurrentOrganization();
  });
  const items = resolveModuleItems(module, permissions, currentOrg);
  const isSingleItem = items.length === 1;
  const href = module.directHref ?? (isSingleItem ? items[0].href : `/modules/${module.id}`);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex min-h-[3.5rem] items-center gap-3 rounded-2xl border border-border/60 p-3',
        'bg-card/80 backdrop-blur-sm touch-manipulation',
        'transition-all duration-300 ease-out',
        'active:scale-[0.99] sm:active:scale-100',
        'hover:shadow-lg hover:shadow-black/10',
        'hover:border-border sm:hover:-translate-y-0.5',
        'sm:min-h-0 sm:flex-col sm:items-stretch sm:p-5',
        module.bgGradient,
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br shadow-md shadow-black/5',
          module.accentGradient,
          'transition-transform duration-300 group-hover:scale-110',
          'sm:h-12 sm:w-12',
        )}
      >
        <module.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:flex-none sm:w-full">
        <h3 className="truncate text-[15px] font-bold tracking-tight text-foreground sm:mt-4 sm:text-base">
          {module.label}
        </h3>

        <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-muted-foreground sm:mt-1.5 sm:line-clamp-2 sm:text-sm sm:leading-relaxed">
          {module.description}
        </p>

        <div className="mt-1 hidden sm:mt-auto sm:flex sm:flex-col sm:items-stretch sm:pt-4">
          {!isSingleItem && items.length > 0 && (
            <div className="mb-3 hidden items-center gap-1.5 sm:flex">
              {items.map((item, idx) => (
                <div
                  key={item.id ?? idx}
                  className={cn(
                    'h-2 w-2 rounded-full bg-gradient-to-br shadow-sm',
                    item.itemAccentGradient || module.accentGradient,
                  )}
                />
              ))}
            </div>
          )}
          <div className="flex w-full items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 sm:text-xs sm:text-muted-foreground/50">
              {isSingleItem ? 'Acceso directo' : `${items.length} secciones`}
            </span>
            <ArrowRight
              className={cn(
                'hidden h-4 w-4 text-muted-foreground/30 sm:block',
                'transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary',
              )}
            />
          </div>
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 sm:hidden" />
    </Link>
  );
}
