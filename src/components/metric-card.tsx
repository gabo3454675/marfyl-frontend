'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { AdminPanel } from '@/components/admin/admin-panel';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  sparklineData: number[];
}

function Sparkline({ data }: { data: number[] }) {
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
        stroke="hsl(210, 100%, 50%)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  sparklineData,
}: MetricCardProps) {
  return (
    <AdminPanel className="admin-metric-card group h-full hover-lift" elevation="sm">
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

        <div className="mb-3 h-9 sm:h-10 opacity-90">
          <Sparkline data={sparklineData} />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {changeType === 'positive' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden />
          )}
          <span
            className={cn(
              'text-xs sm:text-sm font-medium tabular-nums',
              changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
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
