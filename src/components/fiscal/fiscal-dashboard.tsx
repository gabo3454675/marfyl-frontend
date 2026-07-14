'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fiscalService, type FiscalDashboardData } from '@/lib/api';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import { FiscalKpiCard } from '@/components/fiscal/v2/kpi-card';
import { FiscalAgenda, type AgendaItem } from '@/components/fiscal/v2/agenda-fiscal';
import { FiscalEstadoPeriodo } from '@/components/fiscal/v2/estado-periodo';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, AlertTriangle, TrendingUp, FileText, ShoppingCart, Percent } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

export function FiscalDashboard() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const [data, setData] = useState<FiscalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fiscalService.getDashboard();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageFiscal) {
      router.replace('/dashboard');
      return;
    }
    load();
  }, [canManageFiscal, router, load]);

  const agendaItems: AgendaItem[] = useMemo(
    () =>
      (data?.agenda ?? []).map((a, i) => ({
        id: String(i),
        title: a.title,
        dateLabel: a.dayLabel,
        urgency: (a.urgency === 'high' ? 'high' : a.urgency === 'medium' ? 'medium' : 'low') as AgendaItem['urgency'],
      })),
    [data?.agenda],
  );

  const periodProgress = useMemo(() => {
    if (!data) return 0;
    const steps = 4;
    let done = 0;
    if (data.metrics.salesCount > 0) done++;
    if (data.metrics.purchasesCount > 0) done++;
    if (data.profile.taxId) done++;
    if (data.agenda.length > 0) done++;
    return Math.round((done / steps) * 100);
  }, [data]);

  if (!canManageFiscal) return null;

  const m = data?.metrics;

  return (
    <FiscalShell
      title="Panel Fiscal"
      subtitle={
        data
          ? `Período ${data.period.label} · Tasa BCV ${data.exchangeRate.toFixed(2)} Bs/USD · Integrado con POS y facturas`
          : 'Motor fiscal MARFYL — cumplimiento SENIAT'
      }
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pos">Ir al POS</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/invoices">Facturas</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/fiscal/libro-ventas" className="inline-flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Exportar período
            </Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="fiscal-v0-panel border-dashed p-8 text-center fiscal-v0-muted">
          <p>No se pudo cargar el panel. Verifique backend y perfil fiscal (RIF).</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/fiscal/perfil">Configurar perfil</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="fiscal-kpi-grid">
            <div className="admin-kpi-grid">
              <FiscalKpiCard
                label="Ventas brutas"
                valor={m?.grossSalesUsd ?? 0}
                icono={<TrendingUp className="h-5 w-5" />}
                descripcion={`${m?.salesCount ?? 0} ops. en libro`}
              />
              <FiscalKpiCard
                label="Débito fiscal"
                valor={m?.debitFiscalUsd ?? 0}
                variant="warning"
                icono={<Percent className="h-5 w-5" />}
                descripcion={`${(m?.debitFiscalBs ?? 0).toLocaleString('es-VE')} Bs`}
              />
              <FiscalKpiCard
                label="Crédito fiscal"
                valor={m?.creditFiscalUsd ?? 0}
                variant="success"
                icono={<ShoppingCart className="h-5 w-5" />}
              />
              <FiscalKpiCard
                label="Cuota IVA neta"
                valor={m?.netIvaUsd ?? 0}
                variant="danger"
                icono={<AlertTriangle className="h-5 w-5" />}
                descripcion={`${(m?.netIvaBs ?? 0).toLocaleString('es-VE')} Bs`}
              />
            </div>
          </div>

          <div className="admin-grid-charts">
            <div className="lg:col-span-1">
              <FiscalEstadoPeriodo
                porcentaje={periodProgress}
                label={data.period.label}
                descripcion={
                  m?.purchasesCount === 0
                    ? 'Registre compras en Gastos para acreditar IVA antes del cierre.'
                    : data.alerts[0]?.message
                }
              />
            </div>
            <div className="lg:col-span-2">
              <FiscalAgenda items={agendaItems} />
            </div>
          </div>

          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-800 dark:text-red-200"
                >
                  <strong>Validación:</strong> {a.message}
                </div>
              ))}
            </div>
          )}

          <div className="admin-grid-charts-2">
            <div className="fiscal-v0-summary-card fiscal-v0-hover-lift">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-primary to-blue-600 rounded" />
                Resumen rápido
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between fiscal-v0-muted">
                  <span>Facturas en libro</span>
                  <span className="fiscal-v0-stat">{m?.salesCount ?? 0}</span>
                </li>
                <li className="flex justify-between fiscal-v0-muted">
                  <span>Compras registradas</span>
                  <span className="fiscal-v0-stat">{m?.purchasesCount ?? 0}</span>
                </li>
                <li className="flex justify-between fiscal-v0-muted">
                  <span>IVA neto (Bs)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(m?.netIvaBs ?? 0).toLocaleString('es-VE')}
                  </span>
                </li>
                <li className="flex justify-between border-t border-border pt-3">
                  <span className="fiscal-v0-muted">Estado período</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
                    {data.period.statusLabel}
                  </span>
                </li>
              </ul>
            </div>
            <div className="fiscal-v0-summary-card fiscal-v0-hover-lift">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded" />
                Acciones recomendadas
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">1</span>
                  Revisar calendario SENIAT y vencimientos del mes
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">2</span>
                  Conciliar libro de compras con gastos del período
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">3</span>
                  Exportar libros antes del cierre fiscal
                </li>
              </ul>
            </div>
          </div>

          <div className="admin-grid-charts">
            <Link
              href="/fiscal/libro-ventas"
              className="fiscal-v0-summary-card fiscal-v0-hover-lift group p-4"
            >
              <FileText className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Libro de ventas</p>
              <p className="text-xs fiscal-v0-muted mt-1">Desde facturas y POS</p>
            </Link>
            <Link
              href="/fiscal/libro-compras"
              className="fiscal-v0-summary-card fiscal-v0-hover-lift group p-4"
            >
              <ShoppingCart className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Libro de compras</p>
              <p className="text-xs fiscal-v0-muted mt-1">Desde módulo Gastos</p>
            </Link>
            <Link
              href="/expenses"
              className="fiscal-v0-summary-card fiscal-v0-hover-lift group p-4"
            >
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Cargar compra</p>
              <p className="text-xs fiscal-v0-muted mt-1">Alimenta crédito fiscal</p>
            </Link>
          </div>
        </div>
      )}
    </FiscalShell>
  );
}
