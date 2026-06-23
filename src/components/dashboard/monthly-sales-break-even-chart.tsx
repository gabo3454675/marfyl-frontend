'use client';

import { Loader2 } from 'lucide-react';
import { AdminChartCard } from '@/components/admin/admin-card';
import { CHART_COLORS, CHART_HEIGHT, CHART_TOOLTIP_STYLE } from './chart-theme';
import type { DashboardHealth } from './types';
import {
  LazyResponsiveContainer as ResponsiveContainer,
  LazyComposedChart as ComposedChart,
  LazyBar as Bar,
  LazyLine as Line,
  LazyCartesianGrid as CartesianGrid,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyTooltip as Tooltip,
  LazyReferenceLine as ReferenceLine,
  LazyLegend as Legend,
} from '@/components/charts/recharts-lazy';

interface MonthlySalesBreakEvenChartProps {
  data: DashboardHealth['monthlySalesChart'];
  breakEvenPoint: number;
  loading: boolean;
  formatForDisplay: (value: number) => string;
}

export function MonthlySalesBreakEvenChart({
  data,
  breakEvenPoint,
  loading,
  formatForDisplay,
}: MonthlySalesBreakEvenChartProps) {
  return (
    <AdminChartCard
      className="lg:col-span-2"
      title="Ventas Mensuales"
      description="Barras vs punto de equilibrio (costos fijos del mes)"
    >
      {loading ? (
        <div className={`flex items-center justify-center ${CHART_HEIGHT} min-h-[200px]`}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 sm:py-12">Sin datos mensuales</p>
      ) : (
        <div className={`${CHART_HEIGHT} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [formatForDisplay(value), '']}
              />
              <Legend />
              <Bar
                dataKey="ventas"
                name="Ventas"
                radius={[6, 6, 0, 0]}
                fill={CHART_COLORS.primary}
                fillOpacity={0.85}
              />
              {breakEvenPoint > 0 && (
                <ReferenceLine
                  y={breakEvenPoint}
                  stroke={CHART_COLORS.warning}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: `Equilibrio: ${formatForDisplay(breakEvenPoint)}`,
                    position: 'insideTopRight',
                    fill: CHART_COLORS.warning,
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="ventas"
                name="Tendencia"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminChartCard>
  );
}
