'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssignTaskModal } from '@/components/assign-task-modal';
import { TaskResolutionBar } from '@/components/task-resolution-bar';
import apiClient, { invoiceService } from '@/lib/api';
import { Loader2, UserPlus, Download, Pencil, Ban } from 'lucide-react';
import { isProductFeatureEnabled } from '@/lib/features';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  quantity?: number | string | null;
  effectiveQuantity?: number | string | null;
  displayQuantity?: number;
  unitPrice: number;
  subtotal: number;
  product: { id: number; name: string } | null;
  displayName?: string | null;
}

interface Customer {
  id: number;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface PaymentLine {
  method: string;
  amount: number;
  currency: string;
}

interface Invoice {
  id: number;
  consecutiveNumber?: number | null;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  montoUsd?: number | null;
  montoBs?: number | null;
  paymentLines?: PaymentLine[];
  notes?: string | null;
  /** Emisión/venta; null legacy → UI muestra "—". No colapsar con createdAt. */
  issueDate?: string | Date | null;
  /** Registro en sistema. */
  createdAt: string;
  customer: Customer | null;
  items: InvoiceItem[];
  publicUrl?: string;
}

interface InvoiceDetailSheetProps {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: number | null;
  onRefresh?: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo $',
  CASH_USD: 'Efectivo $',
  CASH_BS: 'Efectivo Bs',
  PAGO_MOVIL: 'Pago Móvil Bs',
  ZELLE: 'Zelle $',
  CARD: 'Tarjeta',
  CREDIT: 'Crédito',
  MIXED: 'Mixto',
};

const USD_METHODS = ['CASH_USD', 'ZELLE', 'CARD'] as const;
const VES_METHODS = ['CASH_BS', 'PAGO_MOVIL'] as const;

function isVesMethod(method: string) {
  return method === 'CASH_BS' || method === 'PAGO_MOVIL';
}

function normalizeMethod(method: string) {
  const u = (method || 'CASH').toUpperCase();
  if (u === 'CASH' || u === 'MIXED') return 'CASH_USD';
  return u;
}

function isCreditInvoice(inv: Invoice) {
  const method = (inv.paymentMethod || '').toUpperCase();
  return (
    method === 'CREDIT' ||
    inv.paymentStatus === 'pending_credit' ||
    (inv.paymentLines ?? []).some((p) => p.method === 'CREDIT')
  );
}

function getEditableLines(inv: Invoice): PaymentLine[] {
  if (inv.paymentLines && inv.paymentLines.length > 0) {
    return inv.paymentLines.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
      currency: p.currency,
    }));
  }
  const method = normalizeMethod(inv.paymentMethod);
  const ves = isVesMethod(method);
  return [
    {
      method,
      amount: ves ? Number(inv.montoBs ?? 0) : Number(inv.montoUsd ?? inv.totalAmount),
      currency: ves ? 'VES' : 'USD',
    },
  ];
}

function methodsForLine(method: string) {
  return isVesMethod(method) ? VES_METHODS : USD_METHODS;
}

function getPaymentDisplay(inv: Invoice): string {
  if (inv.paymentLines && inv.paymentLines.length > 0) {
    return inv.paymentLines
      .map((p) => {
        const label = PAYMENT_LABELS[p.method] ?? p.method;
        const sym = p.currency === 'VES' ? 'Bs' : '$';
        return `${label} ${Number(p.amount).toFixed(2)} ${sym}`;
      })
      .join(' + ');
  }
  const m = (inv.paymentMethod || 'CASH').toUpperCase();
  return PAYMENT_LABELS[m] ?? inv.paymentMethod ?? '—';
}

export function InvoiceDetailSheet({
  invoiceId,
  open,
  onOpenChange,
  taskId = null,
  onRefresh,
}: InvoiceDetailSheetProps) {
  const { canManageInvoices, canAnulateInvoices } = usePermission();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editMethods, setEditMethods] = useState<string[]>([]);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const tasksEnabled = isProductFeatureEnabled('tasks');

  useEffect(() => {
    if (!open || !invoiceId) {
      setInvoice(null);
      setEditing(false);
      setVoidOpen(false);
      setVoidReason('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setEditing(false);
    apiClient
      .get<Invoice>(`/invoices/${invoiceId}`)
      .then((res) => {
        if (!cancelled) setInvoice(res.data);
      })
      .catch(() => {
        if (!cancelled) setInvoice(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  const handleDownloadPDF = async () => {
    if (!invoiceId) return;
    try {
      const response = await invoiceService.getPdf(invoiceId);
      const contentType = String(response.headers?.['content-type'] ?? '');
      if (contentType.includes('application/json')) {
        const text = await (response.data as Blob).text();
        const data = JSON.parse(text);
        alert(data?.message ?? 'Error al descargar la factura');
        return;
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      const num = invoice?.consecutiveNumber ?? invoiceId;
      link.download = `factura-${num}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.message ?? 'Error al descargar la factura');
    }
  };

  const isCancelled = invoice?.status === 'CANCELLED';
  const canEdit = canManageInvoices && !!invoice && !isCancelled;
  const canVoid = canAnulateInvoices && !!invoice && !isCancelled;
  const creditSale = invoice ? isCreditInvoice(invoice) : false;

  const startEditing = () => {
    if (!invoice) return;
    setEditNotes(invoice.notes ?? '');
    setEditMethods(getEditableLines(invoice).map((line) => line.method));
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!invoiceId || !invoice) return;
    setSaving(true);
    try {
      const payload: { notes?: string; payments?: { method: string }[] } = {
        notes: editNotes,
      };
      if (!creditSale) {
        payload.payments = editMethods.map((method) => ({ method }));
      }
      await invoiceService.update(invoiceId, payload);
      const res = await apiClient.get<Invoice>(`/invoices/${invoiceId}`);
      setInvoice(res.data);
      setEditing(false);
      onRefresh?.();
      toast.success('Factura actualizada');
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'No se pudo guardar la factura');
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async () => {
    if (!invoiceId) return;
    const reason = voidReason.trim();
    if (!reason) {
      toast.error('Indica el motivo de la anulación');
      return;
    }
    setVoiding(true);
    try {
      await invoiceService.void(invoiceId, reason);
      toast.success('Factura anulada');
      setVoidOpen(false);
      setVoidReason('');
      onRefresh?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'No se pudo anular la factura');
    } finally {
      setVoiding(false);
    }
  };

  const statusLabel =
    invoice?.status === 'PAID' ? 'Pagada' : invoice?.status === 'PENDING' ? 'Pendiente' : 'Cancelada';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de la factura</SheetTitle>
            <SheetDescription>
              {invoice
                ? `Factura #${invoice.consecutiveNumber ?? invoice.id}`
                : invoiceId
                  ? 'Cargando...'
                  : '—'}
            </SheetDescription>
          </SheetHeader>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && invoice && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    invoice.status === 'PAID'
                      ? 'bg-green-500/20 text-green-400'
                      : invoice.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  }
                >
                  {statusLabel}
                </Badge>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>
                    Emisión:{' '}
                    {invoice.issueDate != null ? formatDate(invoice.issueDate) : '—'}
                  </p>
                  <p>Registro: {formatDate(invoice.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="font-medium">{invoice.customer?.name || 'Cliente general'}</p>
                {invoice.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Método de pago</p>
                {editing && !creditSale ? (
                  <div className="mt-2 space-y-2">
                    {getEditableLines(invoice).map((line, index) => (
                      <div key={`${line.method}-${index}`} className="flex items-center gap-2">
                        <Select
                          value={editMethods[index] ?? line.method}
                          onValueChange={(value) => {
                            setEditMethods((prev) => {
                              const next = [...prev];
                              next[index] = value;
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {methodsForLine(line.method).map((method) => (
                              <SelectItem key={method} value={method}>
                                {PAYMENT_LABELS[method] ?? method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {line.currency === 'VES' ? 'Bs' : '$'} {Number(line.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Solo se corrige el método. El monto y la moneda no cambian.
                    </p>
                  </div>
                ) : (
                  <p className="font-medium">{getPaymentDisplay(invoice)}</p>
                )}
                {editing && creditSale && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Una venta a crédito no cambia de método. Anúlala si hay que corregirla.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                {editing ? (
                  <textarea
                    className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    maxLength={2000}
                    placeholder="Notas internas de la factura"
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">
                    {invoice.notes?.trim() ? invoice.notes : '—'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => {
                      const qtyRaw =
                        item.displayQuantity ??
                        item.quantity ??
                        item.effectiveQuantity ??
                        0;
                      const qty = Number(qtyRaw);
                      const qtyDisplay = Number.isFinite(qty) ? qty : 0;
                      return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.displayName ?? item.product?.name ?? 'Producto'}
                        </TableCell>
                        <TableCell className="text-right">{qtyDisplay}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.subtotal))}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <p className="text-lg font-semibold">
                  Total: {formatCurrency(Number(invoice.totalAmount))}
                </p>
              </div>

              {taskId && (
                <TaskResolutionBar
                  taskId={taskId}
                  invoiceId={invoice.id}
                  customerPhone={invoice.customer?.phone ?? undefined}
                  onDownloadPDF={handleDownloadPDF}
                  onDone={onRefresh}
                />
              )}

              {!taskId && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Puede imprimir o guardar esta factura (ticket) en cualquier momento con el botón PDF.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      className="w-full sm:w-auto"
                      onClick={handleDownloadPDF}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                    {canEdit && !editing && (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={startEditing}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    {editing && (
                      <>
                        <Button
                          className="w-full sm:w-auto"
                          onClick={handleSaveEdit}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => setEditing(false)}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {canVoid && !editing && (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                        onClick={() => setVoidOpen(true)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Anular
                      </Button>
                    )}
                    {tasksEnabled && (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setAssignModalOpen(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Asignar revisión
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !invoice && invoiceId && (
            <p className="text-sm text-muted-foreground py-8">No se pudo cargar la factura.</p>
          )}
        </SheetContent>
      </Sheet>

      {tasksEnabled && (
        <AssignTaskModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          invoiceId={invoiceId ?? 0}
          onSuccess={() => {
            onRefresh?.();
            onOpenChange(false);
          }}
        />
      )}

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular factura</DialogTitle>
            <DialogDescription>
              La factura queda cancelada y se restaura el stock. No se borra. Indica el motivo
              para la auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="void-reason">Motivo</Label>
            <textarea
              id="void-reason"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej. cobro duplicado, método equivocado, mesa equivocada"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)} disabled={voiding}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={voiding || !voidReason.trim()}
            >
              {voiding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Anular factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
