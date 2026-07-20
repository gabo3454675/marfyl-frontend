'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface TasaHistorica {
  id: number;
  rate: number;
  source: string;
  effectiveAt: string;
  createdAt: string;
}

interface ResumenDia {
  date: string;
  tasaPromedio: number;
  tasaMin: number;
  tasaMax: number;
  totalUsd: number;
  totalBs: number;
  numFacturas: number;
}

interface ReporteDiferencial {
  desde: string;
  hasta: string;
  resumenPorDia: ResumenDia[];
  totalFacturas: number;
  tasasEnRango: number;
}

function getDefaultRange(): { desde: string; hasta: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    desde: start.toISOString().slice(0, 10),
    hasta: end.toISOString().slice(0, 10),
  };
}

export default function TasasPage() {
  const { formatUsdAmount, formatBsAmount } = useDisplayCurrency();
  const defaultRange = getDefaultRange();
  const [tasas, setTasas] = useState<TasaHistorica[]>([]);
  const [reporte, setReporte] = useState<ReporteDiferencial | null>(null);
  const [desde, setDesde] = useState(defaultRange.desde);
  const [hasta, setHasta] = useState(defaultRange.hasta);
  const [loadingTasas, setLoadingTasas] = useState(true);
  const [loadingReporte, setLoadingReporte] = useState(false);

  const fetchTasas = useCallback(async () => {
    setLoadingTasas(true);
    try {
      const res = await apiClient.get<TasaHistorica[]>('/tenants/organization/tasas-historicas', {
        params: { limit: 100 },
      });
      setTasas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTasas([]);
    } finally {
      setLoadingTasas(false);
    }
  }, []);

  const fetchReporte = useCallback(async () => {
    if (!desde || !hasta) return;
    setLoadingReporte(true);
    setReporte(null);
    try {
      const res = await apiClient.get<ReporteDiferencial>(
        '/tenants/organization/reporte-diferencial-cambiario',
        { params: { desde, hasta } },
      );
      setReporte(res.data);
    } catch {
      setReporte(null);
    } finally {
      setLoadingReporte(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchTasas();
  }, [fetchTasas]);

  return (
    <AdminPageShell
      eyebrow="Finanzas"
      title="Tasas Euro BCV y diferencial cambiario"
      subtitle="Historial de la cotización Euro BCV (factor USD↔Bs) y reporte de diferencial cambiario por período."
    >
      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Historial de tasas
          </span>
        }
        description="Últimas tasas Euro BCV usadas en facturas y cierres de caja (auditoría)."
      >
          {loadingTasas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tasas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay registros de tasas aún.</p>
          ) : (
            <AdminTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha / hora</TableHead>
                    <TableHead className="text-right">Tasa Euro BCV (Bs/USD)</TableHead>
                    <TableHead>Fuente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasas.slice(0, 50).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">
                        {new Date(t.effectiveAt).toLocaleString('es')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {t.rate.toFixed(4)}
                      </TableCell>
                      <TableCell>{t.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tasas.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mostrando las últimas 50 de {tasas.length} registros.
                </p>
              )}
            </AdminTableWrap>
          )}
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchTasas} disabled={loadingTasas} className="cursor-pointer">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
      </AdminCard>

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reporte ganancia/pérdida por diferencial cambiario
          </span>
        }
        description="Resumen por día: tasa utilizada y totales facturados en USD y Bs."
        bodyClassName="space-y-4"
      >
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="desde">Desde</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hasta">Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
            <Button onClick={fetchReporte} disabled={loadingReporte || !desde || !hasta} className="cursor-pointer">
              {loadingReporte ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Generar reporte
            </Button>
          </div>

          {loadingReporte && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {reporte && !loadingReporte && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Período: {reporte.desde} a {reporte.hasta} · {reporte.totalFacturas} facturas · {reporte.tasasEnRango} tasas en rango.
              </p>
              <AdminTableWrap>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Tasa prom.</TableHead>
                      <TableHead className="text-right">Tasa min</TableHead>
                      <TableHead className="text-right">Tasa max</TableHead>
                      <TableHead className="text-right">Total USD</TableHead>
                      <TableHead className="text-right">Total Bs</TableHead>
                      <TableHead className="text-right">Facturas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporte.resumenPorDia.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No hay datos para este período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reporte.resumenPorDia.map((r) => (
                        <TableRow key={r.date}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell className="text-right font-mono">{r.tasaPromedio.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono">{r.tasaMin.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono">{r.tasaMax.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{formatUsdAmount(r.totalUsd)}</TableCell>
                          <TableCell className="text-right">{formatBsAmount(r.totalBs)}</TableCell>
                          <TableCell className="text-right">{r.numFacturas}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </AdminTableWrap>
            </div>
          )}
      </AdminCard>
    </AdminPageShell>
  );
}
