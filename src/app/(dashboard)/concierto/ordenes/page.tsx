'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { concertService } from '@/lib/api';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard, AdminTableWrap } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isConcertFeatureEnabled } from '@/lib/concert/feature';
import type { ConcertAdminOrder } from '@/lib/concert/types';
import { getApiErrorMessage, isNetworkFailure } from '@/lib/api/get-error-message';
import { CONCERT_MOCK_ENABLED, getMockOrders } from '@/lib/concert/mock-data';
import { CONCERT_DEFAULT_SLUG } from '@/lib/concert/feature';
import { resolveConcertAssetUrl } from '@/lib/concert/asset-url';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH_USD: 'Efectivo USD',
  PAGO_MOVIL: 'Pago móvil',
  BANK_TRANSFER: 'Transferencia',
};

export default function ConciertoOrdenesPage() {
  const [orders, setOrders] = useState<ConcertAdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'PENDING_PAYMENT' | 'PAID'>('all');
  const [error, setError] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<{
    url: string;
    buyerName: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!isConcertFeatureEnabled()) return;
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await concertService.getOrders(status);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        const all = getMockOrders();
        setOrders(filter === 'all' ? all : all.filter((o) => o.status === filter));
        setError(null);
      } else {
        setError(getApiErrorMessage(err, 'No se pudieron cargar las órdenes'));
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = async (id: number) => {
    setConfirmingId(id);
    setError(null);
    try {
      await concertService.confirmOrder(id);
      await load();
    } catch (err) {
      if (CONCERT_MOCK_ENABLED && isNetworkFailure(err)) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: 'PAID' as const, paidAt: new Date().toISOString() } : o,
          ),
        );
      } else {
        setError(getApiErrorMessage(err, 'No se pudo confirmar el pago'));
      }
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Concierto"
      title="Órdenes de entradas"
      subtitle="Confirme pagos móvil, transferencia o efectivo para emitir los QR al comprador."
      loading={loading}
      actions={
        <Button variant="outline" size="sm" className="gap-2" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'PENDING_PAYMENT', 'PAID'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : STATUS_LABEL[f]}
          </Button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <AdminCard>
        <AdminTableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asientos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin órdenes
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{o.buyerName}</p>
                        <p className="text-xs text-muted-foreground">{o.buyerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      USD {o.amountUsd.toFixed(2)}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Bs {o.amountBs.toLocaleString('es-VE')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                      {o.paymentReference && (
                        <p className="text-xs text-muted-foreground">Ref: {o.paymentReference}</p>
                      )}
                      {o.paymentProofUrl && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto gap-1 px-0 text-xs text-primary"
                          onClick={() =>
                            setProofPreview({
                              url: resolveConcertAssetUrl(o.paymentProofUrl) ?? o.paymentProofUrl!,
                              buyerName: o.buyerName,
                            })
                          }
                        >
                          <ImageIcon className="h-3 w-3" />
                          Ver comprobante
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{STATUS_LABEL[o.status] ?? o.status}</TableCell>
                    <TableCell className="text-xs">
                      {o.tickets.map((t) => t.seatLabel).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {o.status === 'PENDING_PAYMENT' && (
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={confirmingId === o.id}
                            onClick={() => confirm(o.id)}
                          >
                            {confirmingId === o.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Confirmar
                          </Button>
                        )}
                        {o.status === 'PAID' && (
                          <Button asChild size="sm" variant="outline" className="gap-1">
                            <Link
                              href={`/evento/${CONCERT_DEFAULT_SLUG}/entrada/${o.publicToken}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Entrada
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminTableWrap>
      </AdminCard>

      <Dialog open={!!proofPreview} onOpenChange={(open) => !open && setProofPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprobante de pago</DialogTitle>
          </DialogHeader>
          {proofPreview && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{proofPreview.buyerName}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofPreview.url}
                alt={`Comprobante de ${proofPreview.buyerName}`}
                className="max-h-[70vh] w-full rounded-lg border object-contain"
              />
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={proofPreview.url} target="_blank" rel="noopener noreferrer">
                  Abrir en pestaña nueva
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
