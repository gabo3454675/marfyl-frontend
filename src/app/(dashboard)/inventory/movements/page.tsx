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
import apiClient from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { Download, FileSpreadsheet, Loader2, Package, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

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

interface AutoconsumoImportPreview {
  confirm: boolean;
  total: number;
  ready: number;
  errors: number;
  lines: {
    rowNum: number;
    sku: string;
    productName: string;
    quantity: number;
    type: string;
    ok: boolean;
    issues: string[];
  }[];
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
  const importRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<AutoconsumoImportPreview | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importConfirming, setImportConfirming] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);

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

  const refreshMovements = () => {
    apiClient.get<Movement[]>('/inventory/movements').then((res) => setMovements(res.data ?? [])).catch(() => {});
  };

  const downloadTemplate = async () => {
    setDownloadingTpl(true);
    try {
      const res = await apiClient.get('/inventory/movements/template-autoconsumo', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MARFYL-plantilla-AUTOCONSUMO.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally {
      setDownloadingTpl(false);
    }
  };

  const runImportPreview = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('confirm', 'false');
      const res = await apiClient.post<AutoconsumoImportPreview>(
        '/inventory/movements/import-autoconsumo',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setImportPreview(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al analizar el Excel');
    } finally {
      setImportLoading(false);
    }
  };

  const runImportConfirm = async () => {
    if (!importFile) return;
    setImportConfirming(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('confirm', 'true');
      const res = await apiClient.post<{ applied: number }>(
        '/inventory/movements/import-autoconsumo',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      toast.success(`${res.data.applied} salidas registradas`);
      setImportFile(null);
      setImportPreview(null);
      if (importRef.current) importRef.current.value = '';
      refreshMovements();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al importar');
    } finally {
      setImportConfirming(false);
    }
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

      <AdminCard title="Importar Excel (autoconsumo / merma)">
        <p className="text-sm text-muted-foreground mb-4">
          Descargue la plantilla, llénela y súbala. Cada fila descuenta stock.
        </p>
        <input
          ref={importRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            setImportFile(e.target.files?.[0] ?? null);
            setImportPreview(null);
          }}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Button type="button" variant="secondary" onClick={downloadTemplate} disabled={downloadingTpl}>
            {downloadingTpl ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Descargar plantilla
          </Button>
          <Button type="button" variant="outline" onClick={() => importRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Elegir Excel
          </Button>
          {importFile && (
            <span className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {importFile.name}
            </span>
          )}
          <Button type="button" disabled={!importFile || importLoading} onClick={runImportPreview}>
            {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Analizar
          </Button>
          <Button
            type="button"
            disabled={!importFile || !importPreview || importPreview.errors > 0 || importPreview.ready === 0 || importConfirming}
            onClick={runImportConfirm}
          >
            {importConfirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar importación
          </Button>
        </div>
        {importPreview && (
          <div className="mt-4 text-sm space-y-2">
            <p>
              {importPreview.ready} listas · {importPreview.errors} con error · {importPreview.total} total
            </p>
            {importPreview.lines.filter((l) => !l.ok).slice(0, 8).map((l) => (
              <p key={l.rowNum} className="text-red-600 dark:text-red-400">
                Fila {l.rowNum} ({l.sku}): {l.issues.join(', ')}
              </p>
            ))}
          </div>
        )}
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
    </AdminPageShell>
  );
}
