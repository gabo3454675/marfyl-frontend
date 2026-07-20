'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface RateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRateUpdatedAt(rateUpdatedAt: string | null | undefined): string {
  if (!rateUpdatedAt) return 'Sin registro';
  try {
    return new Date(rateUpdatedAt).toLocaleString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Sin registro';
  }
}

/** Solo lectura: la tasa BCV se actualiza sola en el servidor. */
export function RateConfigModal({ open, onOpenChange }: RateConfigModalProps) {
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);
  const currentOrg = getCurrentOrganization();
  const orgWithRate = currentOrg && 'exchangeRate' in currentOrg ? currentOrg : null;
  const rate = orgWithRate?.exchangeRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tasa BCV
          </DialogTitle>
          <DialogDescription>
            MARFYL actualiza la tasa Dólar BCV automáticamente (DolarApi /v1/dolares). Esa cotización
            es el factor de conversión USD ↔ Bs en POS, facturas y reportes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Tasa Dólar BCV vigente</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {rate != null && Number.isFinite(Number(rate))
                ? `${Number(rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Bs por USD`
                : '—'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Última actualización: {formatRateUpdatedAt(orgWithRate?.rateUpdatedAt)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fuente: Euro oficial BCV vía DolarApi. Se sincroniza al iniciar el servidor y varias
            veces al día. Un monto en USD se multiplica por esta tasa para obtener Bs.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
