'use client';

import { Loader2 } from 'lucide-react';
import { AdminChartCard } from '@/components/admin/admin-card';
import { CHART_HEIGHT, CHART_TOOLTIP_STYLE, DONUT_COLORS } from './chart-theme';
import type { DashboardHealth } from './types';
import {
  LazyResponsiveContainer as ResponsiveContainer,
  LazyPieChart as PieChart,
  LazyPie as Pie,
  LazyCell as Cell,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
} from '@/components/charts/recharts-lazy';

interface TopMarginDonutChartProps {
  data: DashboardHealth['topProductsByMargin'];
  loading: boolean;
  formatForDisplay: (value: number) => string;
}

export function TopMarginDonutChart({ data, loading, formatForDisplay }: TopMarginDonutChartProps) {
  const chartData = data.map((p) => ({
    name: p.productName.length > 16 ? `${p.productName.slice(0, 16)}…` : p.productName,
    fullName: p.productName,
    value: Math.max(0, p.margin),
  }));

  return (
    <AdminChartCard title="Top 5 por margen" description="Distribución de ganancia neta por producto">
      {loading ? (
        <div className={`flex items-center justify-center ${CHART_HEIGHT} min-h-[200px]`}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 sm:py-12">Sin ventas en el último mes</p>
      ) : (
        <div className={`${CHART_HEIGHT} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [
                  formatForDisplay(value),
                  props.payload?.fullName ?? 'Margen',
                ]}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminChartCard>
  );
}
