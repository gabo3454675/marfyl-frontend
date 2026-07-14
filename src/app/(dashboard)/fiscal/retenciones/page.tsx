'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fiscalService, type RetencionIva } from '@/lib/api';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import { FiscalToolbar } from '@/components/fiscal/fiscal-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Download, FileText } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

export default function FiscalRetencionesPage() {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<RetencionIva[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fiscalService.listRetenciones({ year, month });
      setRows(data ?? []);
    } catch {
      setRows([]);
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

  const exportTxt = async () => {
    const blob = await fiscalService.exportRetencionesTxt({ year, month });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `retenciones-${year}-${month}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openPdf = async (id: number) => {
    const blob = await fiscalService.getRetencionPdf(id);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `retencion-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!canManageFiscal) return null;

  return (
    <FiscalShell
      title="Retenciones de IVA"
      subtitle="Comprobantes para agentes de retención — exportación TXT y PDF por fila."
      actions={
        <Button size="sm" onClick={exportTxt}>
          <Download className="h-4 w-4 mr-2" />
          Exportar TXT
        </Button>
      }
    >
      <FiscalToolbar>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Año</label>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mes</label>
          <Input type="number" min={1} max={12} className="w-20" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        </div>
        <Button variant="outline" onClick={load}>Actualizar</Button>
      </FiscalToolbar>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-fiscal-accent" /></div>
      ) : (
        <div className="fiscal-v0-panel overflow-x-auto p-4 sm:p-0 sm:pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>RIF</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Retenido</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Sin retenciones en el período. Active agente de retención en perfil fiscal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{r.certificateNumber ?? '—'}</TableCell>
                        <TableCell>{r.supplierName ?? r.expense?.description ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.supplierTaxId ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {Number(r.ivaAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-fiscal-accent">
                          {Number(r.withholdingAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openPdf(r.id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
        </div>
      )}
    </FiscalShell>
  );
}
