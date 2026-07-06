'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { expenseService } from '@/lib/api/expenses';
import { formatCurrency } from '../helpers';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: { id: number; amount: number; amountPaid: number } | null;
  history: { id: number; amount: number; paidAt: string; notes: string | null }[];
  loading: boolean;
  onPaymentRegistered: () => void;
}

export function PaymentDialog({ open, onOpenChange, target, history, loading, onPaymentRegistered }: PaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      const remaining = target.amount - target.amountPaid;
      setPaymentAmount(remaining > 0 ? String(remaining.toFixed(2)) : '');
      setPaymentNotes('');
    }
  }, [target]);

  const handleRegisterPayment = async () => {
    if (!target || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSubmitting(true);
    try {
      await expenseService.registerPayment(target.id, {
        amount,
        notes: paymentNotes || undefined,
      });
      onOpenChange(false);
      onPaymentRegistered();
    } catch (error) {
      console.error('Error registering payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = target ? target.amount - target.amountPaid : 0;
  const isFullyPaid = remaining <= 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando información…</p>
          </div>
        ) : target ? (
          isFullyPaid ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-green-500">Factura Completamente Pagada</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Esta factura ya fue pagada en su totalidad.
                </p>
              </div>
              {history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs font-medium">Registro de pagos ({history.length})</span>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {history.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                        <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        {p.notes && <span className="text-muted-foreground italic truncate max-w-[120px]">{p.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Registrar Abono</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-col gap-1 mt-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">{formatCurrency(target.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pagado</span>
                      <span className="font-semibold text-green-500">{formatCurrency(target.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo</span>
                      <span className="font-semibold text-red-500">{formatCurrency(remaining)}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Monto a abonar</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentNotes">Notas (opcional)</Label>
                  <Input
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Referencia de pago, banco, etc."
                  />
                </div>
              </div>
              {history.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <span className="text-muted-foreground text-xs font-medium">Pagos anteriores ({history.length})</span>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {history.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                        <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString('es-VE')}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        {p.notes && <span className="text-muted-foreground italic text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">{p.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegisterPayment}
                  disabled={submitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Pago
                </Button>
              </DialogFooter>
            </>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
