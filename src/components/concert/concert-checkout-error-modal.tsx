'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ConcertSupportLink } from '@/components/concert/concert-support-link';
import { buildConcertSupportWhatsAppUrl } from '@/lib/concert/support.constants';

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  onRetry: () => void;
  onBackToSeats: () => void;
  supportMessage?: string;
}

export function ConcertCheckoutErrorModal({
  open,
  onOpenChange,
  error,
  onRetry,
  onBackToSeats,
  supportMessage,
}: ErrorModalProps) {
  const waHref = buildConcertSupportWhatsAppUrl(
    supportMessage ??
      'Hola, tuve un problema al comprar entradas en MARFYL y necesito ayuda para completar mi pago.',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              No se pudo completar
            </DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground text-center">
            {error || 'Ocurrió un error inesperado. Su reserva sigue activa: puede reintentar sin volver a elegir asientos.'}
          </p>

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={onRetry} className="w-full">
              Reintentar envío
            </Button>
            <Button onClick={onBackToSeats} variant="outline" className="w-full">
              Volver a asientos
            </Button>
            <Button asChild variant="secondary" className="w-full gap-2">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                Ayuda por WhatsApp
              </a>
            </Button>
          </div>
          <ConcertSupportLink className="text-xs" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
