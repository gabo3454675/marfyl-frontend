'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { Download, FileSpreadsheet, Loader2, Package, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AutoconsumoKpisCard } from './autoconsumo-kpis-card';

const MOVEMENT_TYPES = [
  { value: 'AUTOCONSUMO', label: 'Autoconsumo' },
  { value: 'MERMA_VENCIDO', label: 'Merma (vencido)' },
  { value: 'MERMA_DANADO', label: 'Merma (dañado)' },
] as const;

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  stock: number;
}

interface Movement {
  id: number;
  type: string;
  quantity: number;
  reason: string | null;
  productId: number;
  createdAt: string;
  product?: { id: number; name: string; sku: string | null };
  user?: { id: number; email: string; fullName: string | null };
}

export default function InventoryMovementsPage() {
  const { canManageInventory } = usePermission();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    type: 'MERMA_VENCIDO' as (typeof MOVEMENT_TYPES)[number]['value'],
    productId: '',
    quantity: '1',
    reason: '',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importConfirming, setImportConfirming] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get<Product[]>('/products').then((res) => {
      setProducts(res.data ?? []);
    }).catch(() => setProducts([])).finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    apiClient.get<Movement[]>('/inventory/movements').then((res) => {
      setMovements(res.data ?? []);
    }).catch(() => setMovements([])).finally(() => setLoadingMovements(false));
  }, []);

  const handleDownloadConsumptionTemplate = async () => {
    try {
      const response = await apiClient.get('/inventory/movements/template', {
        responseType: 'blob',
      });
      const disposition = response.headers?.['content-disposition'] as string | undefined;
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || 'consumo-plantilla.xlsx';
      const blob = new Blob([response.data], {
        type:
          String(response.headers?.['content-type'] ?? '') ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Error downloading template:', error);
      alert(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'No se pudo descargar la plantilla.',
      );
    }
  };

  const refreshMovements = () => {
    apiClient.get<Movement[]>('/inventory/movements').then((res) => setMovements(res.data ?? [])).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const productId = parseInt(form.productId, 10);
    const quantity = parseInt(form.quantity, 10);
    if (!productId || quantity < 1) {
      setMessage({ type: 'error', text: 'Selecciona un producto y una cantidad válida.' });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/inventory/movements', {
        type: form.type,
        productId,
        quantity,
        reason: form.reason.trim() || undefined,
      });
      setMessage({ type: 'success', text: 'Salida registrada. Stock actualizado.' });
      setForm((prev) => ({ ...prev, quantity: '1', reason: '' }));
      refreshMovements();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage({ type: 'error', text: msg ?? 'Error al registrar la salida.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportPreview = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('confirm', 'false');
      const response = await apiClient.post('/inventory/movements/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportPreview(response.data);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error al analizar archivo';
      alert(msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;
    setImportConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('confirm', 'true');
      const response = await apiClient.post('/inventory/movements/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(response.data);
      setImportPreview(null);
      setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = '';
      refreshMovements();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Error al importar';
      alert(msg);
    } finally {
      setImportConfirming(false);
    }
  };

  if (!canManageInventory) {
    return (
      <AdminPageShell eyebrow="Inventario" title="Movimientos de inventario" subtitle="Acceso restringido" maxWidth="medium">
        <AdminCard>
          <p className="py-8 text-center text-muted-foreground">
            No tienes permisos para acceder a Movimientos de inventario.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Inventario"
      title="Movimientos de inventario"
      subtitle="Registra salidas por autoconsumo o mermas (vencido/dañado). El stock se descuenta al guardar."
      maxWidth="medium"
    >

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
              : 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'
          }`}
        >
          {message.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <AdminCard>
        <Button
          variant="outline"
          onClick={handleDownloadConsumptionTemplate}
          className="cursor-pointer"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar plantilla
        </Button>
      </AdminCard>

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nueva salida
          </span>
        }
      >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((prev) => ({ ...prev, type: v as typeof form.type }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Producto</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm((prev) => ({ ...prev, productId: v }))}
                disabled={loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingProducts ? 'Cargando...' : 'Seleccionar producto'} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (stock: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ej: Lote vencido, producto dañado"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <Button type="submit" className="cursor-pointer" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar salida
            </Button>
          </form>
      </AdminCard>

      <AdminCard
        title={
          <span className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar consumos desde Excel
          </span>
        }
        description="Sube un Excel con la plantilla de consumo para registrar múltiples salidas de inventario."
      >
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setImportFile(f ?? null);
            setImportPreview(null);
            setImportResult(null);
          }}
        />
        <div className="flex flex-wrap gap-3 items-center">
          <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Elegir Excel
          </Button>
          {importFile && (
            <span className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {importFile.name}
            </span>
          )}
          <Button type="button" disabled={!importFile || importLoading} onClick={handleImportPreview}>
            {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Analizar
          </Button>
          {importPreview?.canConfirm && (
            <Button type="button" disabled={importConfirming} onClick={handleImportConfirm}>
              {importConfirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar importación ({importPreview.matchedLines} líneas)
            </Button>
          )}
        </div>

        {importPreview && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total líneas</p>
                <p className="text-lg font-semibold">{importPreview.totalLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Coincidencias</p>
                <p className="text-lg font-semibold text-emerald-600">{importPreview.matchedLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Errores</p>
                <p className="text-lg font-semibold text-destructive">{importPreview.errorLines}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Costo total</p>
                <p className="text-lg font-semibold">${importPreview.totalCost?.toFixed(2)}</p>
              </div>
            </div>

            {importPreview.lines?.length > 0 && (
              <div className="rounded-md border overflow-x-auto max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.lines.map((line: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{line.originalCode}</TableCell>
                        <TableCell>{line.productName ?? '—'}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell>{line.responsible ?? '—'}</TableCell>
                        <TableCell>
                          {line.status === 'matched' && <Badge className="bg-emerald-600">OK</Badge>}
                          {line.status === 'unmatched' && <Badge variant="destructive">No encontrado</Badge>}
                          {line.status === 'error' && <Badge variant="destructive">{line.error}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {importPreview.errors?.length > 0 && (
              <div className="text-sm text-destructive">
                <p className="font-medium">Errores de parseo:</p>
                <ul className="list-disc pl-5">
                  {importPreview.errors.map((e: any, i: number) => (
                    <li key={i}>Fila {e.row}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {importResult && !importResult.dryRun && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
            ✅ {importResult.movementsCreated} movimientos registrados. Costo total: ${importResult.totalCost?.toFixed(2)}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Últimos movimientos">
          {loadingMovements ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay movimientos.</p>
          ) : (
            <ul className="space-y-2">
              {movements.slice(0, 20).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 text-sm border-b pb-2 last:border-0">
                  <span className="font-medium">{m.product?.name ?? `Producto #${m.productId}`}</span>
                  <span className="text-muted-foreground">{m.type}</span>
                  <span>{m.quantity < 0 ? m.quantity : `+${m.quantity}`}</span>
                  {m.reason && <span className="text-muted-foreground truncate max-w-[200px]">{m.reason}</span>}
                  <span className="text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
      </AdminCard>

      <AutoconsumoKpisCard />
    </AdminPageShell>
  );
}
