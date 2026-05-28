'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Scale, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'pos' | 'invoices' | 'expenses';

const copy: Record<Variant, { icon: typeof Scale; text: string; href: string; cta: string }> = {
  pos: {
    icon: ShoppingCart,
    text: 'Al emitir aquí se asigna N° de control y se proyecta al libro de ventas SENIAT.',
    href: '/fiscal/libro-ventas',
    cta: 'Libro de ventas',
  },
  invoices: {
    icon: FileText,
    text: 'Cada factura emitida alimenta el módulo fiscal y el TXT de exportación.',
    href: '/fiscal',
    cta: 'Ver panel fiscal',
  },
  expenses: {
    icon: Scale,
    text: 'Los gastos con IVA se reflejan en el libro de compras y pueden generar retenciones.',
    href: '/fiscal/libro-compras',
    cta: 'Libro de compras',
  },
};

export function FiscalIntegrationStrip({ variant, className }: { variant: Variant; className?: string }) {
  const c = copy[variant];
  const Icon = c.icon;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm',
        'dark:border-blue-500/25 dark:bg-blue-500/10',
        className,
      )}
    >
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="text-muted-foreground flex-1 min-w-[200px]">{c.text}</span>
      <Link
        href={c.href}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors duration-200 dark:text-blue-300 dark:hover:bg-blue-500/20"
      >
        {c.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
