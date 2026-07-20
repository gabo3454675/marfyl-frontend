'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Landmark, Plus } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cashHoldsApi, type CashHold } from '@/lib/api/cash-holds';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { getApiErrorMessage } from '@/lib/api/get-error-message';

export default function CajaOficinaPage() {
  const { formatUsdAmount, formatBsAmount } = useDisplayCurrency();
  const [rows, setRows] = useState<CashHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('759');
  const [label, setLabel] = useState('Caja oficina en divisas');
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cashHoldsApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'No se pudo cargar caja oficina'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    const n = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      setError('Monto inválido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await cashHoldsApi.upsert({
        location: 'OFFICE',
        currency: 'USD',
        amount: n,
        asOf: `${asOf}T12:00:00.000Z`,
        label: label.trim() || 'Caja oficina',
        notes: notes.trim() || undefined,
      });
      setNotes('');
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (currency: string, value: string | number) => {
    const n = Number(value);
    return currency === 'VES' ? formatBsAmount(n) : formatUsdAmount(n);
  };

  return (
    <AdminPageShell
      eyebrow="Finanzas"
      title="Caja oficina"
      subtitle="Efectivo retenido en oficina. No es venta POS ni ingreso facturado."
    >
      <div className="space-y-6">
        <AdminCard title="Qué es esto">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            La caja oficina registra saldos de tesorería (p. ej. \$759 en divisas) separados del
            cierre de caja del turno. No suma a ventas del dashboard ni crea facturas.
          </p>
        </AdminCard>

        <AdminCard title="Registrar / actualizar saldo">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto USD</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asOf">Fecha</Label>
              <Input
                id="asOf"
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="label">Etiqueta</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => void onSave()}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </AdminCard>

        <AdminCard
          title={
            <span className="inline-flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Saldos registrados
            </span>
          }
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              Aún no hay saldos de caja oficina.
            </p>
          ) : (
            <AdminTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="tabular-nums">
                        {new Date(row.asOf).toLocaleDateString('es-VE')}
                      </TableCell>
                      <TableCell>
                        {row.location === 'OFFICE' ? 'Oficina' : 'Tienda'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.label}</div>
                        {row.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {row.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatAmount(row.currency, row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableWrap>
          )}
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
