'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderToken: string;
  eventSlug: string;
}

export function ConcertCheckoutSuccessModal({
  open,
  onOpenChange,
  orderToken,
  eventSlug,
}: SuccessModalProps) {
  const router = useRouter();

  const handleViewOrder = () => {
    router.push(`/evento/${eventSlug}/entrada/${orderToken}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
          
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              ¡Compra Registrada!
            </DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground text-center">
            Tu orden está en revisión. Recibirás un email cuando tu pago sea confirmado.
          </p>

          <Button onClick={handleViewOrder} className="w-full">
            Ver mi entrada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
