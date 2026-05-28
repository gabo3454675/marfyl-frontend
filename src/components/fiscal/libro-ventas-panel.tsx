'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import { AnimatedShinyText } from '@/components/magic-ui/animated-shiny-text';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { ShineBorder } from '@/components/magic-ui/shine-border';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Filter, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/lib/config/api-config';

interface LibroRow {
  id: number;
  opNumber: string;
  issueDate: string;
  customerTaxId?: string | null;
  customerName?: string | null;
  invoiceNumber?: string | null;
  controlNumber?: string | null;
  baseExempt: number;
  baseGeneral: number;
  ivaAmount: number;
  totalAmount: number;
  source?: string;
  validationErrors?: string[];
  validationWarnings?: string[];
}

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LibroVentasPanel() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const token = useAuthStore((s) => s.token);
  const orgId = useAuthStore((s) => s.selectedOrganizationId ?? s.selectedCompanyId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<LibroRow[]>([]);
  const [backfilling, setBackfilling] = useState(false);
  const [totals, setTotals] = useState({
    baseExempt: 0,
    baseGeneral: 0,
    ivaAmount: 0,
    totalAmount: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        lines: LibroRow[];
        totals: typeof totals;
        year: number;
        month: number;
      }>('/fiscal/libro-ventas', { params: { year, month } });
      setLines(res.data.lines ?? []);
      setTotals(res.data.totals ?? { baseExempt: 0, baseGeneral: 0, ivaAmount: 0, totalAmount: 0 });
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (!canManageFiscal) {
      router.replace('/');
      return;
    }
    load();
  }, [canManageFiscal, router, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (r) =>
        (r.customerTaxId ?? '').toLowerCase().includes(q) ||
        (r.customerName ?? '').toLowerCase().includes(q) ||
        (r.invoiceNumber ?? '').toLowerCase().includes(q) ||
        r.opNumber.includes(q),
    );
  }, [lines, search]);

  const downloadExport = (kind: 'xlsx' | 'txt') => {
    const url = `${API_BASE_URL}/fiscal/libro-ventas/export.${kind}?year=${year}&month=${month}`;
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (orgId) headers['x-tenant-id'] = String(orgId);
    fetch(url, { headers })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `libro-ventas-${year}-${String(month).padStart(2, '0')}.${kind === 'xlsx' ? 'xlsx' : 'txt'}`;
        a.click();
      });
  };

  const monthLabel = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ][month - 1];

  if (!canManageFiscal) return null;

  return (
    <FiscalShell
      title={<AnimatedShinyText>Libro de Ventas</AnimatedShinyText>}
      subtitle={`Formato SENIAT artículo 76 — Período ${monthLabel} ${year}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => downloadExport('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar XLS
          </Button>
          <ShimmerButton className="h-9" onClick={() => downloadExport('txt')}>
            <FileText className="h-4 w-4" />
            Generar TXT
          </ShimmerButton>
        </>
      }
    >
      <ShineBorder borderRadius={14} className="mb-4">
      <div className="flex flex-wrap gap-3 items-center p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por RIF, factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          className="w-24"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
        <Button variant="outline" size="icon" onClick={load} title="Actualizar">
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          title="Backfill histórico (facturas sin línea en libro)"
          disabled={backfilling}
          onClick={async () => {
            setBackfilling(true);
            try {
              const res = await apiClient.post<{
                projected: number;
                scanned: number;
              }>('/fiscal/backfill/libro-ventas', null, { params: { year, month, limit: 500 } });
              toast.success(`Backfill: ${res.data.projected} de ${res.data.scanned} facturas`);
              load();
            } catch {
              toast.error('Error en backfill');
            } finally {
              setBackfilling(false);
            }
          }}
        >
          {backfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
        </Button>
      </div>
      </ShineBorder>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fiscal-accent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm dark:border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16">N° OP</TableHead>
                <TableHead>FECHA</TableHead>
                <TableHead>RIF</TableHead>
                <TableHead>RAZÓN SOCIAL</TableHead>
                <TableHead>N° FACTURA</TableHead>
                <TableHead>N° CONTROL</TableHead>
                <TableHead className="text-right">VENTAS EXENTAS</TableHead>
                <TableHead className="text-right">BASE IMP. (16%)</TableHead>
                <TableHead className="text-right">IVA CAUSADO</TableHead>
                <TableHead className="text-right">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    Sin registros. Las ventas del POS se proyectan al emitir factura.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const hasError = (row.validationErrors?.length ?? 0) > 0;
                  const hasWarn = (row.validationWarnings?.length ?? 0) > 0;
                  const fecha = new Date(row.issueDate).toLocaleDateString('es-VE');
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        hasError && 'bg-red-50/80 dark:bg-red-950/20',
                        !hasError && hasWarn && 'bg-amber-50/50 dark:bg-amber-950/15',
                      )}
                    >
                      <TableCell className="font-mono text-xs">
                        {row.opNumber}
                        {row.source === 'POS' && (
                          <span className="ml-1 rounded bg-muted px-1 text-[10px]">POS</span>
                        )}
                      </TableCell>
                      <TableCell>{fecha}</TableCell>
                      <TableCell className={hasError ? 'text-red-600 font-medium' : ''}>
                        {hasError && !row.customerTaxId
                          ? 'Falta documento'
                          : (row.customerTaxId ?? '—')}
                      </TableCell>
                      <TableCell>{row.customerName ?? '—'}</TableCell>
                      <TableCell>{row.invoiceNumber ?? '—'}</TableCell>
                      <TableCell>{row.controlNumber ?? '—'}</TableCell>
                      <TableCell className="text-right">{fmt(Number(row.baseExempt))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(row.baseGeneral))}</TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400">
                        {fmt(Number(row.ivaAmount))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {fmt(Number(row.totalAmount))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                  <TableCell colSpan={6}>TOTALES DEL PERÍODO</TableCell>
                  <TableCell className="text-right">{fmt(totals.baseExempt)}</TableCell>
                  <TableCell className="text-right">{fmt(totals.baseGeneral)}</TableCell>
                  <TableCell className="text-right text-emerald-700 dark:text-emerald-400">
                    {fmt(totals.ivaAmount)}
                  </TableCell>
                  <TableCell className="text-right">{fmt(totals.totalAmount)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </FiscalShell>
  );
}
