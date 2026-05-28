'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  valor: number;
  variacion?: number;
  descripcion?: string;
  currency?: boolean;
  prefix?: string;
  icono?: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

const variantStyles = {
  default:
    'border-blue-500/25 bg-card hover:border-blue-500/40 dark:border-blue-500/30 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-blue-900/20 dark:to-slate-800/40',
  warning:
    'border-amber-500/30 bg-card hover:border-amber-500/45 dark:border-amber-500/35 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-amber-900/15 dark:to-slate-800/40',
  success:
    'border-emerald-500/30 bg-card hover:border-emerald-500/45 dark:border-emerald-500/35 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-emerald-900/15 dark:to-slate-800/40',
  danger:
    'border-red-500/30 bg-card hover:border-red-500/45 dark:border-red-500/35 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-red-900/15 dark:to-slate-800/40',
};

const iconStyles = {
  default: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  danger: 'text-red-500',
};

export function FiscalKpiCard({
  label,
  valor,
  variacion,
  descripcion,
  currency = true,
  prefix = '$',
  icono,
  variant = 'default',
}: KPICardProps) {
  const isPositive = variacion != null && variacion >= 0;

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4 sm:p-5 flex flex-col gap-2 overflow-hidden',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg backdrop-blur-sm fiscal-v2-fade-in',
        variantStyles[variant],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {icono && (
          <div className={cn('p-2 rounded-lg bg-muted/60', iconStyles[variant])}>{icono}</div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
        {currency && <span className="text-sm font-sans text-muted-foreground mr-1">{prefix}</span>}
        {valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {variacion !== undefined && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold',
              isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400',
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}
            {variacion.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs. período ant.</span>
        </div>
      )}
      {descripcion && <p className="text-xs text-muted-foreground">{descripcion}</p>}
    </div>
  );
}
