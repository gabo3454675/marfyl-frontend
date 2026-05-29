'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  sparklineData,
}: MetricCardProps) {
  const changeData = sparklineData.map((val) => ({ value: val }));
  const strokeColor = changeType === 'positive' ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)';

  return (
    <AdminPanel className="admin-metric-card group h-full" elevation="sm">
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={changeData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
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
