'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pctChange } from './demo-data';
import type { DashboardHealth, DashboardSummary } from './types';

interface CommandHeroProps {
  summary: DashboardSummary;
  health: DashboardHealth;
  formatForDisplay: (value: number) => string;
  loading?: boolean;
  isDemo?: boolean;
}

export function CommandHero({
  summary,
  health,
  formatForDisplay,
  loading,
  isDemo,
}: CommandHeroProps) {
  const salesChange = pctChange(summary.totalSalesToday, summary.totalSalesYesterday);
  const goal =
    health.dailySalesGoal > 0
      ? health.dailySalesGoal
      : Math.max(summary.totalSalesToday, 1);
  const progressPct = Math.min(100, Math.round((summary.totalSalesToday / goal) * 100));
  const positive = salesChange >= 0;
  const goalMet = progressPct >= 100;

  return (
    <section
      aria-label="Ventas de hoy"
      className={cn(
        'admin-command-hero relative overflow-hidden',
        'rounded-2xl sm:rounded-[1.35rem]',
        'border border-border/70 dark:border-white/[0.1]',
        'bg-gradient-to-br from-primary/[0.12] via-card/90 to-background',
        'px-4 py-5 min-[390px]:px-5 sm:px-8 sm:py-9',
        'shadow-sm dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_20px_50px_-28px_rgba(0,0,0,0.55)]',
      )}
    >
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/20 dark:bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-500/[0.07] dark:bg-emerald-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      {isDemo && (
        <span className="absolute top-3.5 right-4 rounded-md border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-300/90 font-medium">
          demo
        </span>
      )}

      <div className="relative">
        <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/90 pr-14">
          Ventas de hoy
        </p>

        <div className="mt-3 sm:mt-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between min-[420px]:gap-6">
          <div className="min-w-0 space-y-2.5">
            <p
              className={cn(
                'admin-command-hero-value font-semibold tracking-tight text-foreground tabular-nums break-all',
                'text-[2rem] leading-[0.95] min-[390px]:text-[2.5rem] sm:text-[3.25rem]',
                loading && 'h-11 w-44 sm:h-14 sm:w-56 animate-pulse rounded-lg bg-muted/80',
              )}
            >
              {loading ? '' : formatForDisplay(summary.totalSalesToday)}
            </p>

            {!loading && (
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:text-sm font-medium tabular-nums',
                  'border backdrop-blur-sm',
                  positive
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
                )}
                <span>
                  {positive ? '+' : ''}
                  {salesChange}%{' '}
                  <span className="opacity-70 font-normal">vs ayer</span>
                </span>
              </div>
            )}
          </div>

          {!loading && (
            <div className="shrink-0 text-left min-[420px]:text-right pb-0.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Meta</p>
              <p className="mt-1 text-sm sm:text-base font-medium tabular-nums text-foreground/90">
                {formatForDisplay(goal)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 sm:mt-7 max-w-2xl space-y-2">
          <div className="flex justify-between gap-3 text-[11px] sm:text-xs text-muted-foreground">
            <span>Progreso del día</span>
            <span
              className={cn(
                'tabular-nums font-semibold',
                goalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
              )}
            >
              {loading ? '—' : `${progressPct}%`}
            </span>
          </div>
          <div className="h-2 sm:h-2.5 rounded-full bg-secondary/80 overflow-hidden ring-1 ring-inset ring-white/5">
            <div
              className={cn(
                'admin-command-hero-progress h-full rounded-full transition-all duration-700 ease-out',
                goalMet
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                  : progressPct >= 60
                    ? 'bg-gradient-to-r from-primary to-sky-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400',
              )}
              style={{ width: loading ? '0%' : `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
