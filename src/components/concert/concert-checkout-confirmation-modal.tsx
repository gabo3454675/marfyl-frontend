'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedSeats: Array<{ id: number; label: string; sectionName: string; priceUsd: number; priceBs: number }>;
  paymentMethod: string;
  paymentReference?: string;
  hasPaymentProof?: boolean;
  buyerName: string;
  buyerIdDocument: string;
  buyerPhone: string;
  buyerEmail: string;
  estimatedUsd: number;
  estimatedBs: number;
  submitting: boolean;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH_USD: 'Efectivo USD',
  PAGO_MOVIL: 'Pago Móvil',
  BANK_TRANSFER: 'Transferencia Bancaria',
};

export function ConcertCheckoutConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  selectedSeats,
  paymentMethod,
  paymentReference,
  hasPaymentProof,
  buyerName,
  buyerIdDocument,
  buyerPhone,
  buyerEmail,
  estimatedUsd,
  estimatedBs,
  submitting,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎫 Resumen de tu Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Comprador */}
          <div className="space-y-1">
            <p className="text-muted-foreground">👤 Comprador</p>
            <p className="font-medium">{buyerName}</p>
            <p className="text-muted-foreground">{buyerIdDocument} · {buyerPhone}</p>
            <p className="text-muted-foreground">{buyerEmail}</p>
          </div>

          {/* Asientos */}
          <div className="space-y-1">
            <p className="text-muted-foreground">🪑 Asientos</p>
            {selectedSeats.map((seat) => (
              <p key={seat.id} className="font-medium">
                {seat.label} ({seat.sectionName}) - ${seat.priceUsd}
              </p>
            ))}
          </div>

          {/* Pago */}
          <div className="space-y-1">
            <p className="text-muted-foreground">💳 Método de pago</p>
            <p className="font-medium">{PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}</p>
            {paymentReference && (
              <p className="text-muted-foreground">🔢 Referencia: {paymentReference}</p>
            )}
            {hasPaymentProof && (
              <p className="text-muted-foreground">
                📎 {paymentMethod === 'CASH_USD' ? 'Foto de billetes adjunta' : 'Comprobante adjunto'}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${estimatedUsd} / Bs {estimatedBs.toLocaleString('es-VE')}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Volver a editar
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar y enviar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
