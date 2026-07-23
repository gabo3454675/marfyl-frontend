'use client';

import { Loader2, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import { AdminSection } from '@/components/admin/admin-page-header';
import { AdminChartCard } from '@/components/admin/admin-card';
import { FiscalHealthAlerts } from './fiscal-health-alerts';
import { HealthKpiGrid } from './operational-kpi-grid';
import { MarginErosionRiskList } from './margin-erosion-risk-list';
import { FrictionFunnelStepper } from './friction-funnel-stepper';
import { CHART_HEIGHT, CHART_TOOLTIP_STYLE } from './chart-theme';
import type { DashboardDiagnosis, DashboardHealth, DashboardStrategy, DashboardSummary } from './types';
import {
  LazyResponsiveContainer as ResponsiveContainer,
  LazyBarChart as BarChart,
  LazyBar as Bar,
  LazyCartesianGrid as CartesianGrid,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
} from '@/components/charts/recharts-lazy';

interface DashboardHealthSectionProps {
  summary: DashboardSummary;
  health: DashboardHealth;
  diagnosis: DashboardDiagnosis;
  strategy: DashboardStrategy;
  loadingHealth: boolean;
  loadingDiagnosis: boolean;
  loadingStrategy: boolean;
  formatForDisplay: (value: number) => string;
  isDemo: boolean;
  onProductClick?: (productId: number) => void;
}

export function DashboardHealthSection({
  summary,
  health,
  diagnosis,
  strategy,
  loadingHealth,
  loadingDiagnosis,
  loadingStrategy,
  formatForDisplay,
  isDemo,
  onProductClick,
}: DashboardHealthSectionProps) {
  return (
    <AdminSection
      title="Salud General"
      description="Visión estratégica de ventas, márgenes y operación en Venezuela"
    >
      <HealthKpiGrid
        health={health}
        formatForDisplay={formatForDisplay}
        loadingHealth={loadingHealth}
        isDemo={isDemo}
      />

      <FiscalHealthAlerts />

      <AdminSection
        title="Diagnóstico"
        description="Detecta erosión de margen y prioriza cobranza"
      >
        <div className="admin-dash-panels">
          <MarginErosionRiskList
            products={diagnosis.marginErosion}
            loading={loadingDiagnosis}
            formatForDisplay={formatForDisplay}
            onProductClick={onProductClick}
          />

          <AdminChartCard
            title="Antigüedad de deuda"
            description="Cuentas por cobrar: a tiempo, vencidas y críticas +30 días"
          >
            {loadingDiagnosis ? (
              <div className={`flex items-center justify-center ${CHART_HEIGHT} min-h-[200px]`}>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : diagnosis.debtAgeByCustomer.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 sm:py-12">
                No hay facturas pendientes de cobro
              </p>
            ) : (
              <div className={`${CHART_HEIGHT} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={diagnosis.debtAgeByCustomer.slice(0, 10).map((c) => ({
                      ...c,
                      name:
                        c.customerName.length > 12
                          ? `${c.customerName.slice(0, 12)}…`
                          : c.customerName,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => formatForDisplay(v)}
                    />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [formatForDisplay(v), '']} />
                    <Legend />
                    <Bar dataKey="aTiempo" name="A tiempo" stackId="deuda" fill="#22c55e" />
                    <Bar dataKey="vencidas1_15" name="Vencidas 1-15 días" stackId="deuda" fill="#eab308" />
                    <Bar dataKey="criticas30" name="Críticas +30 días" stackId="deuda" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminChartCard>
        </div>
      </AdminSection>

      <AdminSection
        title="Estrategia"
        description="Fricción operativa e insights automáticos"
      >
        <FrictionFunnelStepper funnel={strategy.frictionFunnel} loading={loadingStrategy} />

        <AdminChartCard
          title="Insights para tu negocio"
          description="Recomendaciones según ventas, márgenes y cobranza"
        >
          {loadingStrategy ? (
            <div className="flex items-center justify-center py-6 min-h-[120px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : strategy.insights.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">
              Genera ventas y márgenes para recibir recomendaciones.
            </p>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {strategy.insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex gap-2 sm:gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50 min-w-0"
                >
                  {insight.tipo === 'producto_margen' && (
                    <span className="flex-shrink-0 rounded-full bg-amber-500/20 p-1.5">
                      <FileText className="h-4 w-4 text-amber-400" />
                    </span>
                  )}
                  {insight.tipo === 'cuello_botella' && (
                    <span className="flex-shrink-0 rounded-full bg-red-500/20 p-1.5">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </span>
                  )}
                  {!['producto_margen', 'cuello_botella'].includes(insight.tipo) && (
                    <span className="flex-shrink-0 rounded-full bg-primary/20 p-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words min-w-0">
                    {insight.texto}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminChartCard>
      </AdminSection>
    </AdminSection>
  );
}
