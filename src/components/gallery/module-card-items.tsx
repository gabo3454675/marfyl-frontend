'use client';

import Link from 'next/link';
import { type AppNavItem } from '@/config/app-nav';
import { cn } from '@/lib/utils';

type ModuleCardItemsProps = {
  items: (AppNavItem & { hint?: string })[];
  accentColor: string;
};

export function ModuleCardItems({ items, accentColor }: ModuleCardItemsProps) {
  return (
    <div className="mt-3 space-y-1">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            'hover:bg-white/5 transition-colors group',
          )}
        >
          <item.icon className={cn('h-4 w-4 shrink-0', accentColor, 'opacity-70 group-hover:opacity-100')} />
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {item.label}
          </span>
          {item.hint && (
            <span className="ml-auto text-xs text-muted-foreground/50 hidden group-hover:inline">
              {item.hint}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
