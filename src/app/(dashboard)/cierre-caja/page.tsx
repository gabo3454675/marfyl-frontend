'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import {
  Loader2,
  Wallet,
  Receipt,
  DoorOpen,
  DoorClosed,
  History,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { cierreCajaService, type CierreAbierto, type CierreCerrado } from '@/lib/api/cierre-caja';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useAuthStore } from '@/store/useAuthStore';

export default function CierreCajaPage() {
  const { formatForDisplay, formatUsdAmount, formatBsAmount } = useDisplayCurrency();
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.selectedOrganizationId || s.selectedCompanyId);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successClose, setSuccessClose] = useState<CierreCerrado | null>(null);
  const [montoInicial, setMontoInicial] = useState('0');
  const [montoFisicoUsd, setMontoFisicoUsd] = useState('');
  const [montoFisicoVes, setMontoFisicoVes] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: abierto, isLoading: loadingAbierto } = useQuery({
    queryKey: ['cierre-caja', 'abierto', orgId],
    queryFn: () => cierreCajaService.getAbierto(),
    staleTime: 15_000,
  });

  const { data: historial = [], isLoading: loadingHistorial } = useQuery({
    queryKey: ['cierre-caja', 'historial', orgId],
    queryFn: () => cierreCajaService.listHistorial(20),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['cierre-caja'] });
  }, [queryClient]);

  const handleApertura = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const num = parseFloat(montoInicial) || 0;
    if (num < 0) {
      setError('El monto inicial no puede ser negativo.');
      setSending(false);
      return;
    }
    try {
      await cierreCajaService.apertura({ montoInicial: num });
      setMontoInicial('0');
      invalidate();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al abrir turno';
      setError(String(msg));
    } finally {
      setSending(false);
    }
  };

  const handleCerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccessClose(null);
    try {
      const closed = await cierreCajaService.cerrar({
        montoFisicoUsd: parseFloat(montoFisicoUsd) || 0,
        montoFisicoVes: parseFloat(montoFisicoVes) || 0,
        observaciones: observaciones.trim() || undefined,
      });
      setSuccessClose(closed);
      setMontoFisicoUsd('');
      setMontoFisicoVes('');
      setObservaciones('');
      invalidate();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Error al cerrar turno';
      setError(String(msg));
    } finally {
      setSending(false);
    }
  };

  const handleImprimir = async (cierreId: number) => {
    try {
      const ticket = await cierreCajaService.getTicket(cierreId, 80);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(
          `<pre style="font-family: monospace; white-space: pre-wrap; padding: 8px;">${ticket.ticketText}</pre>` +
          (ticket.resumenUrl ? `<p><a href="${ticket.resumenUrl}" target="_blank">Ver resumen digital</a></p>` : ''),
        );
        w.document.close();
      }
      await cierreCajaService.marcarImpreso(cierreId);
      invalidate();
    } catch {
      setError('No se pudo generar el ticket.');
    }
  };

  const loading = loadingAbierto || loadingHistorial;

  if (loading && abierto === undefined) {
    return (
      <AdminPageShell eyebrow="Ventas" title="Cierre de caja" subtitle="Abre o cierra tu turno de caja." loading />
    );
  }

  return (
    <AdminPageShell
      eyebrow="Ventas"
      title="Cierre de caja"
      subtitle="Abre o cierra tu turno. Sincronizado con el switch de caja del topbar."
      maxWidth="wide"
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {successClose && (
        <AdminCard
          className="mb-4 border-green-500/30"
          title={
            <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <DoorClosed className="h-5 w-5" />
              Turno cerrado correctamente
            </span>
          }
          description={
            <>
              Diferencia USD: {formatUsdAmount(successClose.diferenciaUsd ?? successClose.diferencia ?? 0)} · Diferencia Bs:{' '}
              {formatBsAmount(successClose.diferenciaVes ?? 0)}
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleImprimir(successClose.id)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir ticket
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSuccessClose(null)}>
              Cerrar aviso
            </Button>
          </div>
        </AdminCard>
      )}

      {abierto ? (
        <TurnoAbiertoCard
          abierto={abierto}
          formatForDisplay={formatForDisplay}
          montoFisicoUsd={montoFisicoUsd}
          montoFisicoVes={montoFisicoVes}
          observaciones={observaciones}
          sending={sending}
          onMontoFisicoUsdChange={setMontoFisicoUsd}
          onMontoFisicoVesChange={setMontoFisicoVes}
          onObservacionesChange={setObservaciones}
          onCerrar={handleCerrar}
        />
      ) : (
        <AdminCard
          title={
            <span className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Abrir turno
            </span>
          }
          description="Monto inicial en USD. También puedes abrir desde el switch del topbar."
        >
          <form onSubmit={handleApertura} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px] space-y-2">
              <Label htmlFor="montoInicial">Monto inicial (USD)</Label>
              <Input
                id="montoInicial"
                type="number"
                step="0.01"
                min="0"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DoorOpen className="mr-2 h-4 w-4" />}
              Abrir caja
            </Button>
          </form>
        </AdminCard>
      )}

      <AdminCard
        className="mt-4"
        title={
          <span className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Últimos cierres
          </span>
        }
        description="Turnos cerrados. Imprime el ticket Z-Report desde aquí."
      >
        {historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay cierres recientes.</p>
        ) : (
          <ul className="space-y-2">
            {historial.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {new Date(c.fechaCierre).toLocaleString('es')} · {c.user?.fullName || c.user?.email || '—'} · Dif. USD:{' '}
                    {formatForDisplay(c.diferenciaUsd ?? c.diferencia ?? 0)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleImprimir(c.id)}>
                  <Printer className="mr-1 h-4 w-4" />
                  Ticket
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminPageShell>
  );
}

function TurnoAbiertoCard({
  abierto,
  formatForDisplay,
  montoFisicoUsd,
  montoFisicoVes,
  observaciones,
  sending,
  onMontoFisicoUsdChange,
  onMontoFisicoVesChange,
  onObservacionesChange,
  onCerrar,
}: {
  abierto: CierreAbierto;
  formatForDisplay: (n: number) => string;
  montoFisicoUsd: string;
  montoFisicoVes: string;
  observaciones: string;
  sending: boolean;
  onMontoFisicoUsdChange: (v: string) => void;
  onMontoFisicoVesChange: (v: string) => void;
  onObservacionesChange: (v: string) => void;
  onCerrar: (e: React.FormEvent) => void;
}) {
  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Turno abierto (X-Report)
        </span>
      }
      description={
        <>
          Cajero: {abierto.user?.fullName || abierto.user?.email || '—'} · Apertura:{' '}
          {new Date(abierto.fechaApertura).toLocaleString('es')}
        </>
      }
      bodyClassName="space-y-4"
    >
      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Monto inicial', abierto.montoInicial],
          ['Efectivo USD', abierto.ventasEfectivoUsd ?? 0],
          ['Efectivo Bs', abierto.ventasEfectivoBs ?? 0],
          ['Pago móvil Bs', abierto.ventasPagoMovil ?? 0],
          ['POS / Zelle USD', abierto.ventasPos ?? 0],
          ['Autoconsumos', abierto.autoconsumos ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border bg-muted/30 p-3">
            <span className="text-muted-foreground">{label}</span>
            <p className="font-medium">{formatForDisplay(Number(value))}</p>
          </div>
        ))}
      </div>
      {abierto.notaAutoconsumos && (
        <p className="text-xs text-muted-foreground">{abierto.notaAutoconsumos}</p>
      )}
      <form onSubmit={onCerrar} className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Cerrar turno (Z-Report)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="montoFisicoUsd">Monto físico USD</Label>
            <Input id="montoFisicoUsd" type="number" step="0.01" min="0" placeholder="0.00" value={montoFisicoUsd} onChange={(e) => onMontoFisicoUsdChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="montoFisicoVes">Monto físico Bs</Label>
            <Input id="montoFisicoVes" type="number" step="0.01" min="0" placeholder="0.00" value={montoFisicoVes} onChange={(e) => onMontoFisicoVesChange(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones (opcional)</Label>
          <Input id="observaciones" placeholder="Ej: faltante por..." value={observaciones} onChange={(e) => onObservacionesChange(e.target.value)} maxLength={500} />
        </div>
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DoorClosed className="mr-2 h-4 w-4" />}
          Cerrar turno
        </Button>
      </form>
    </AdminCard>
  );
}
