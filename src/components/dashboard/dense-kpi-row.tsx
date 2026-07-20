'use client';

import { cn } from '@/lib/utils';
import { pctChange } from './demo-data';
import type { DashboardHealth, DashboardSummary, TrendDirection } from './types';

type DenseKpi = {
  id: string;
  label: string;
  shortLabel: string;
  value: string;
  change: string;
  changeType: TrendDirection;
};

interface DenseKpiRowProps {
  summary: DashboardSummary;
  health: DashboardHealth;
  formatForDisplay: (value: number) => string;
  loadingSummary: boolean;
  loadingHealth: boolean;
  canViewFinancialCharts: boolean;
}

export function DenseKpiRow({
  summary,
  health,
  formatForDisplay,
  loadingSummary,
  loadingHealth,
  canViewFinancialCharts,
}: DenseKpiRowProps) {
  const ticketChange = pctChange(health.ticketPromedio, health.ticketPromedioPrev);
  const profitChange = pctChange(health.estimatedNetProfit, health.estimatedNetProfitPrev);

  const items: DenseKpi[] = [];

  if (canViewFinancialCharts) {
    items.push(
      {
        id: 'ticket',
        label: 'Ticket promedio',
        shortLabel: 'Ticket',
        value: loadingHealth ? '—' : formatForDisplay(health.ticketPromedio),
        change: `${ticketChange >= 0 ? '+' : ''}${ticketChange}%`,
        changeType: ticketChange >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'profit',
        label: 'Ganancia neta est.',
        shortLabel: 'Ganancia',
        value: loadingHealth ? '—' : formatForDisplay(health.estimatedNetProfit),
        change: `${profitChange >= 0 ? '+' : ''}${profitChange}%`,
        changeType: profitChange >= 0 ? 'positive' : 'negative',
      },
    );
  }

  items.push(
    {
      id: 'products',
      label: 'Productos',
      shortLabel: 'Productos',
      value: loadingSummary ? '—' : summary.productsCount.toString(),
      change: `${summary.lowStockCount} bajo stock`,
      changeType: summary.lowStockCount > 0 ? 'negative' : 'positive',
    },
    {
      id: 'low-stock',
      label: 'Stock bajo',
      shortLabel: 'Stock bajo',
      value: loadingSummary ? '—' : summary.lowStockCount.toString(),
      change: summary.lowStockCount > 0 ? 'Atención' : 'OK',
      changeType: summary.lowStockCount > 0 ? 'negative' : 'positive',
    },
    {
      id: 'invoices',
      label: 'Facturas recientes',
      shortLabel: 'Facturas',
      value: loadingSummary ? '—' : summary.recentTransactions.length.toString(),
      change: 'Hoy',
      changeType: 'neutral',
    },
  );

  return (
    <section
      aria-label="Indicadores"
      className="admin-dense-kpi-row"
      data-count={items.length}
    >
      {items.map((item) => (
        <div key={item.id} className="admin-dense-kpi-cell group min-w-0">
          <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground truncate">
            <span className="sm:hidden">{item.shortLabel}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </p>
          <p className="mt-1.5 font-semibold text-base min-[390px]:text-lg sm:text-xl tabular-nums text-foreground truncate tracking-tight">
            {item.value}
          </p>
          <p
            className={cn(
              'mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium tabular-nums truncate max-w-full',
              item.changeType === 'positive' &&
                'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              item.changeType === 'negative' &&
                'bg-red-500/10 text-red-700 dark:text-red-400',
              item.changeType === 'neutral' &&
                'bg-muted/60 text-muted-foreground',
            )}
          >
            {item.change}
          </p>
        </div>
      ))}
    </section>
  );
}
