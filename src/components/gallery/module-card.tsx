'use client';

import Link from 'next/link';
import { type GalleryModuleConfig, resolveModuleItems } from '@/config/modules';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

type ModuleCardProps = {
  module: GalleryModuleConfig;
};

export function ModuleCard({ module }: ModuleCardProps) {
  // Si el módulo tiene solo 1 item, navegar directamente a ese item
  const items = resolveModuleItems(module);
  const isSingleItem = items.length === 1;
  const href = module.directHref ?? (isSingleItem ? items[0].href : `/modules/${module.id}`);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border/60 p-5',
        'bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:shadow-black/10',
        'hover:border-border hover:-translate-y-0.5',
        module.bgGradient,
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          'bg-gradient-to-br shadow-md shadow-black/5',
          module.accentGradient,
          'transition-transform duration-300 group-hover:scale-110',
        )}
      >
        <module.icon className="h-6 w-6 text-white" />
      </div>

      <h3 className="mt-4 text-base font-bold text-foreground tracking-tight">
        {module.label}
      </h3>

      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {module.description}
      </p>

      <div className="mt-auto pt-4">
        {/* Indicadores de color de items */}
        {!isSingleItem && items.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
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
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
            {isSingleItem ? 'Acceso directo' : `${items.length} secciones`}
          </span>
          <ArrowRight className={cn(
            'h-4 w-4 text-muted-foreground/30',
            'group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300',
          )} />
        </div>
      </div>
    </Link>
  );
}
