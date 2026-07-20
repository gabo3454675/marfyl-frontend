'use client';

import {
  AlertCircle,
  Banknote,
  FileText,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { EnhancedMetricCard } from './enhanced-metric-card';
import { generateSparkline, pctChange } from './demo-data';
import type { DashboardHealth, DashboardSummary } from './types';

interface OperationalKpiGridProps {
  summary: DashboardSummary;
  health: DashboardHealth;
  formatForDisplay: (value: number) => string;
  loadingSummary: boolean;
  loadingHealth: boolean;
  isDemo: boolean;
  canViewFinancialCharts: boolean;
}

export function OperationalKpiGrid({
  summary,
  health,
  formatForDisplay,
  loadingSummary,
  loadingHealth,
  isDemo,
  canViewFinancialCharts,
}: OperationalKpiGridProps) {
  const salesChange = pctChange(summary.totalSalesToday, summary.totalSalesYesterday);
  const ticketChange = pctChange(health.ticketPromedio, health.ticketPromedioPrev);
  const profitChange = pctChange(health.estimatedNetProfit, health.estimatedNetProfitPrev);

  return (
    <div className="admin-dash-kpi-primary">
      <EnhancedMetricCard
        title="Ventas de Hoy"
        value={formatForDisplay(summary.totalSalesToday)}
        change={`${salesChange >= 0 ? '+' : ''}${salesChange}%`}
        changeType={salesChange >= 0 ? 'positive' : 'negative'}
        icon={TrendingUp}
        sparklineData={generateSparkline(summary.totalSalesToday)}
        progress={{
          current: summary.totalSalesToday,
          goal:
            health.dailySalesGoal > 0
              ? health.dailySalesGoal
              : Math.max(summary.totalSalesToday, 1),
          label: 'Meta diaria',
        }}
        isDemo={isDemo && summary.totalSalesToday === 0}
        loading={loadingSummary}
        size="large"
        accent
      />
      {canViewFinancialCharts && (
        <>
      <EnhancedMetricCard
        title="Ticket Promedio de Compra"
        value={loadingHealth ? '—' : formatForDisplay(health.ticketPromedio)}
        change={`${ticketChange >= 0 ? '+' : ''}${ticketChange}%`}
        changeType={ticketChange >= 0 ? 'positive' : 'negative'}
        icon={Receipt}
        sparklineData={generateSparkline(health.ticketPromedio)}
        isDemo={isDemo && health.ticketPromedio === 0}
        loading={loadingHealth}
      />
      <EnhancedMetricCard
        title="Ganancia Neta Estimada"
        value={loadingHealth ? '—' : formatForDisplay(health.estimatedNetProfit)}
        change={`${profitChange >= 0 ? '+' : ''}${profitChange}%`}
        changeType={profitChange >= 0 ? 'positive' : 'negative'}
        icon={Banknote}
        sparklineData={generateSparkline(health.estimatedNetProfit)}
        isDemo={isDemo && health.estimatedNetProfit === 0}
        loading={loadingHealth}
      />
        </>
      )}
      <EnhancedMetricCard
        title="Total Productos"
        value={summary.productsCount.toString()}
        change={`${summary.lowStockCount} bajo stock`}
        changeType={summary.lowStockCount > 0 ? 'negative' : 'positive'}
        icon={FileText}
        sparklineData={generateSparkline(summary.productsCount)}
        loading={loadingSummary}
        size="small"
      />
      <EnhancedMetricCard
        title="Productos en Stock Bajo"
        value={summary.lowStockCount.toString()}
        change={summary.lowStockCount > 0 ? 'Requiere atención' : 'Todo OK'}
        changeType={summary.lowStockCount > 0 ? 'negative' : 'positive'}
        icon={AlertCircle}
        sparklineData={generateSparkline(summary.lowStockCount)}
        loading={loadingSummary}
        size="small"
      />
      <EnhancedMetricCard
        title="Facturas Recientes"
        value={summary.recentTransactions.length.toString()}
        change="Últimas operaciones"
        changeType="neutral"
        icon={Users}
        sparklineData={generateSparkline(summary.recentTransactions.length)}
        loading={loadingSummary}
        size="small"
      />
    </div>
  );
}

export function HealthKpiGrid({
  health,
  formatForDisplay,
  loadingHealth,
  isDemo,
}: {
  health: DashboardHealth;
  formatForDisplay: (value: number) => string;
  loadingHealth: boolean;
  isDemo: boolean;
}) {
  return (
    <div className="admin-dash-kpi-secondary">
      <EnhancedMetricCard
        title="Venta promedio por factura"
        value={loadingHealth ? '—' : formatForDisplay(health.ticketPromedio)}
        change={
          health.crecimientoMensual >= 0
            ? `+${health.crecimientoMensual}%`
            : `${health.crecimientoMensual}%`
        }
        changeType={health.crecimientoMensual >= 0 ? 'positive' : 'negative'}
        icon={Receipt}
        sparklineData={generateSparkline(health.ticketPromedio)}
        isDemo={isDemo}
      />
      <EnhancedMetricCard
        title="Crecimiento mensual"
        value={loadingHealth ? '—' : `${health.crecimientoMensual >= 0 ? '+' : ''}${health.crecimientoMensual}%`}
        change="vs mes anterior"
        changeType={health.crecimientoMensual >= 0 ? 'positive' : 'negative'}
        icon={ShoppingCart}
        sparklineData={generateSparkline(Math.max(0, health.crecimientoMensual))}
        isDemo={isDemo}
      />
      <EnhancedMetricCard
        title="Ventas del mes"
        value={loadingHealth ? '—' : formatForDisplay(health.totalVentasMes)}
        change="Mes en curso"
        changeType="positive"
        icon={Banknote}
        sparklineData={generateSparkline(health.totalVentasMes)}
        isDemo={isDemo}
      />
    </div>
  );
}
