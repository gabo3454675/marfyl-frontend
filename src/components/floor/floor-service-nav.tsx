'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  ChefHat,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { FLOOR_COPY } from '@/lib/floor-ui';
import { cn } from '@/lib/utils';

type StationId = 'host' | 'kitchen' | 'audit' | 'pos';

const STATIONS: {
  id: StationId;
  href: string;
  label: string;
  step: string;
  icon: typeof UtensilsCrossed;
  permission:
    | 'canTakeFloorOrder'
    | 'canViewKitchenQueue'
    | 'canViewFloorHistory'
    | 'canAccessPOS';
  match: (path: string) => boolean;
}[] = [
  {
    id: 'host',
    href: '/comanda',
    label: FLOOR_COPY.host.short,
    step: '1',
    icon: UtensilsCrossed,
    permission: 'canTakeFloorOrder',
    match: (p) =>
      p === '/comanda' ||
      (p.startsWith('/comanda') &&
        !p.startsWith('/comanda/cocina') &&
        !p.startsWith('/comanda/historial')),
  },
  {
    id: 'kitchen',
    href: '/comanda/cocina',
    label: FLOOR_COPY.kitchen.short,
    step: '2',
    icon: ChefHat,
    permission: 'canViewKitchenQueue',
    match: (p) => p.startsWith('/comanda/cocina'),
  },
  {
    id: 'pos',
    href: '/pos',
    label: FLOOR_COPY.pos.short,
    step: '3',
    icon: ShoppingCart,
    permission: 'canAccessPOS',
    match: (p) => p.startsWith('/pos'),
  },
  {
    id: 'audit',
    href: '/comanda/historial',
    label: FLOOR_COPY.audit.short,
    step: '4',
    icon: ClipboardList,
    permission: 'canViewFloorHistory',
    match: (p) => p.startsWith('/comanda/historial'),
  },
];

/**
 * Subnavegación del módulo piso: deja claro en qué estación estás
 * y el orden lógico del servicio.
 */
export function FloorServiceNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const permissions = usePermission();

  const visible = STATIONS.filter((s) => permissions[s.permission] === true);
  if (visible.length < 2) return null;

  const activeId = visible.find((s) => s.match(pathname))?.id;

  return (
    <nav
      aria-label="Estaciones del servicio en piso"
      className={cn(
        'floor-service-nav overflow-hidden rounded-2xl border border-border/60',
        'bg-gradient-to-br from-card/90 via-card/70 to-background/80',
        className,
      )}
    >
      <div className="border-b border-border/50 px-3.5 py-2 sm:px-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {FLOOR_COPY.module}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">
          Anfitrión toma → cocina/barra prepara → caja cobra → auditoría revisa
        </p>
      </div>

      <ol className="flex gap-1 overflow-x-auto p-2 sm:gap-1.5 sm:p-2.5">
        {visible.map((s, idx) => {
          const active = s.id === activeId;
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
              {idx > 0 && (
                <span
                  aria-hidden
                  className="mx-0.5 hidden h-px w-3 bg-border/80 sm:mx-1 sm:block sm:w-4"
                />
              )}
              <Link
                href={s.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 transition',
                  'border touch-manipulation',
                  active
                    ? 'border-primary/45 bg-primary/12 text-foreground shadow-sm'
                    : 'border-transparent bg-background/40 text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/80 text-muted-foreground group-hover:bg-muted',
                  )}
                >
                  {s.step}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="whitespace-nowrap text-sm font-medium">
                  {s.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
