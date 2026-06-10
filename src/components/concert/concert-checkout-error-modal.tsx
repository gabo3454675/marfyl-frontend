'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  onRetry: () => void;
  onBackToSeats: () => void;
}

export function ConcertCheckoutErrorModal({
  open,
  onOpenChange,
  error,
  onRetry,
  onBackToSeats,
}: ErrorModalProps) {
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
            {error || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
          </p>

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={onRetry} variant="outline" className="w-full">
              Reintentar
            </Button>
            <Button onClick={onBackToSeats} className="w-full">
              Volver a asientos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
