'use client';

import { Loader2 } from 'lucide-react';
import { AdminChartCard } from '@/components/admin/admin-card';
import { CHART_COLORS, CHART_HEIGHT, CHART_TOOLTIP_STYLE } from './chart-theme';
import type { DashboardHealth } from './types';
import {
  LazyResponsiveContainer as ResponsiveContainer,
  LazyLineChart as LineChart,
  LazyLine as Line,
  LazyCartesianGrid as CartesianGrid,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
} from '@/components/charts/recharts-lazy';

interface SalesDualLineChartProps {
  data: DashboardHealth['salesChartLastMonth'];
  loading: boolean;
  formatForDisplay: (value: number) => string;
}

export function SalesDualLineChart({ data, loading, formatForDisplay }: SalesDualLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fecha: new Date(d.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
  }));

  return (
    <AdminChartCard
      className="lg:col-span-2"
      title="Ventas: USD esperadas vs Bs reales"
      description="Comparación dual interactiva por día — último mes"
    >
      {loading ? (
        <div className={`flex items-center justify-center ${CHART_HEIGHT} min-h-[200px]`}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 sm:py-12">Sin datos del último mes</p>
      ) : (
        <div className={`${CHART_HEIGHT} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.4} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [formatForDisplay(value), name]}
                labelFormatter={(label: string) => `Fecha: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ventasUsd"
                name="USD esperadas"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="ventasBs"
                name="Bs reales"
                stroke={CHART_COLORS.success}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminChartCard>
  );
}
