'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fiscalService, type PredeclaracionData } from '@/lib/api';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import { FiscalToolbar } from '@/components/fiscal/fiscal-toolbar';
import { NumberTicker } from '@/components/magic-ui/number-ticker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

export default function PredeclaracionPage() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<PredeclaracionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fiscalService.getPredeclaracion({ year, month });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (!canManageFiscal) {
      router.replace('/dashboard');
      return;
    }
    load();
  }, [canManageFiscal, router, load]);

  const handleClose = async () => {
    setClosing(true);
    try {
      await fiscalService.closePeriod(year, month);
      toast.success('Período cerrado correctamente');
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'No se pudo cerrar el período');
    } finally {
      setClosing(false);
    }
  };

  if (!canManageFiscal) return null;

  return (
    <FiscalShell
      title="Pre-declaración IVA"
      subtitle="Asistente de cierre, conciliación y exportación del período."
      actions={
        data?.period?.status !== 'CLOSED' ? (
          <Button size="sm" onClick={handleClose} disabled={closing}>
            {closing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cerrar período
          </Button>
        ) : null
      }
    >
      <FiscalToolbar>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Año</label>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mes</label>
          <Input type="number" min={1} max={12} className="w-20" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        </div>
        <Button variant="outline" onClick={load}>Actualizar</Button>
      </FiscalToolbar>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-fiscal-accent" /></div>
      ) : !data ? (
        <p className="text-muted-foreground">No se pudo cargar la pre-declaración.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="fiscal-v0-panel">
                <p className="text-sm text-muted-foreground">Cuota IVA neta estimada</p>
                <p className="text-3xl font-bold mt-1 text-foreground">
                  $<NumberTicker value={data.netIvaUsd} />
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Débito: ${data.ventas.ivaAmount.toFixed(2)} · Crédito: ${data.compras.ivaAmount.toFixed(2)} ·{' '}
                  {data.retencionesCount} retenciones
                </p>
          </div>
          <div className="fiscal-v0-panel">
              <h3 className="font-semibold mb-4">Pasos del asistente</h3>
              <ul className="space-y-3">
                {data.steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    {s.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    {s.title}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 mt-6">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/fiscal/libro-ventas">Libro ventas</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/fiscal/libro-compras">Libro compras</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/fiscal/retenciones">Retenciones</Link>
                </Button>
              </div>
          </div>
        </div>
      )}
    </FiscalShell>
  );
}
