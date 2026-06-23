'use client';

import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { AdminPanel } from '@/components/admin/admin-panel';
import { cn } from '@/lib/utils';
import type { TrendDirection } from './types';

interface EnhancedMetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: TrendDirection;
  icon: LucideIcon;
  sparklineData: number[];
  progress?: {
    current: number;
    goal: number;
    label?: string;
  };
  isDemo?: boolean;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        fill="none"
        stroke={positive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        className="opacity-90"
      />
    </svg>
  );
}

export function EnhancedMetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  sparklineData,
  progress,
  isDemo,
}: EnhancedMetricCardProps) {
  const progressPct =
    progress && progress.goal > 0
      ? Math.min(100, Math.round((progress.current / progress.goal) * 100))
      : 0;

  return (
    <AdminPanel className="admin-metric-card group h-full hover-lift relative overflow-hidden" elevation="sm">
      {isDemo && (
        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-amber-400/80 font-medium">
          demo
        </span>
      )}
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
          <div className="min-w-0 flex-1 pr-1">
            <p className="admin-metric-title">{title}</p>
            <p className="admin-metric-value mt-2">{value}</p>
          </div>
          <div className="admin-metric-icon shrink-0 transition-colors duration-200">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>

        {progress && (
          <div className="mb-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.label ?? 'Meta diaria'}</span>
              <span className="tabular-nums font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progressPct >= 100
                    ? 'bg-emerald-500'
                    : progressPct >= 60
                      ? 'bg-primary'
                      : 'bg-amber-500',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mb-3 h-9 sm:h-10 opacity-90">
          <Sparkline data={sparklineData} positive={changeType === 'positive'} />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {changeType === 'positive' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />
          ) : changeType === 'negative' ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden />
          ) : null}
          <span
            className={cn(
              'text-xs sm:text-sm font-medium tabular-nums',
              changeType === 'positive'
                ? 'text-emerald-600 dark:text-emerald-400'
                : changeType === 'negative'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground',
            )}
          >
            {change}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">vs período anterior</span>
        </div>
      </div>
    </AdminPanel>
  );
}
