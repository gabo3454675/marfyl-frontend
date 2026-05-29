'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Landmark } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermission } from '@/hooks/usePermission';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface PayableRow {
  id: number;
  date: string;
  amount: number;
  description: string;
  referenceNumber?: string | null;
  supplier?: { id: number; name: string } | null;
  amountPaid?: number;
  balanceDue?: number;
}

export default function AccountsPayablePage() {
  const { selectedCompanyId } = useAuthStore();
  const { canManageExpenses } = usePermission();
  const { formatForDisplay } = useDisplayCurrency();
  const [rows, setRows] = useState<PayableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<PayableRow | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayables = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      const res = await apiClient.get<PayableRow[]>('/expenses/accounts-payable');
      setRows(res.data);
    } catch (e) {
      console.error(e);
      alert('No se pudo cargar cuentas por pagar');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId && canManageExpenses) fetchPayables();
  }, [selectedCompanyId, canManageExpenses, fetchPayables]);

  const openPay = (row: PayableRow) => {
    setSelected(row);
    setPayAmount(row.balanceDue != null ? String(row.balanceDue) : '');
    setPayNotes('');
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!selected) return;
    const amt = parseFloat(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert('Indique un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/expenses/${selected.id}/payments`, {
        amount: amt,
        notes: payNotes || undefined,
      });
      setPayOpen(false);
      setSelected(null);
      await fetchPayables();
    } catch (error: any) {
      alert(error.response?.data?.message ?? 'Error al registrar el abono');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageExpenses) {
    return (
      <AdminPageShell eyebrow="Finanzas" title="Cuentas por pagar" subtitle="Acceso restringido">
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            No tienes permisos para ver esta sección.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Finanzas"
      title={
        <span className="flex items-center gap-2">
          <Landmark className="h-8 w-8 shrink-0" />
          Cuentas por pagar
        </span>
      }
      subtitle="Facturas de proveedor con saldo pendiente. Registre abonos sin salir del flujo de gastos."
    >
      <AdminCard
        title="Pendientes con proveedor"
        description="Los abonos también se pueden registrar al crear o editar un gasto (campo abono inicial o desde el historial en Gastos)."
      >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay obligaciones pendientes.</p>
          ) : (
            <AdminTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Ref.</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Abonado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.date).toLocaleDateString('es-VE')}</TableCell>
                      <TableCell>{r.supplier?.name ?? '—'}</TableCell>
                      <TableCell>{r.referenceNumber ?? '—'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                      <TableCell className="text-right font-medium">{formatForDisplay(r.amount)}</TableCell>
                      <TableCell className="text-right">{formatForDisplay(r.amountPaid ?? 0)}</TableCell>
                      <TableCell className="text-right text-amber-700 dark:text-amber-400 font-semibold">
                        {formatForDisplay(r.balanceDue ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openPay(r)}>
                          Abonar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableWrap>
          )}
      </AdminCard>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar abono</DialogTitle>
            <DialogDescription>
              Gasto #{selected?.id}
              {selected?.supplier ? ` · ${selected.supplier.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Monto (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={submitPay} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar abono'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
