'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fiscalService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { LibroTable } from '@/components/fiscal/libro-table';
import { FiscalToolbar } from '@/components/fiscal/fiscal-toolbar';
import type { Documento } from '@/lib/fiscal/types';

type LibroKind = 'ventas' | 'compras';

/** Interfaz local que unifica LibroVentaLine y LibroCompraLine (no existe un type único exportado). */
interface LibroLine {
  id: number;
  issueDate: string;
  invoiceNumber?: string | null;
  controlNumber?: string | null;
  customerTaxId?: string | null;
  customerName?: string | null;
  supplierTaxId?: string | null;
  supplierName?: string | null;
  baseGeneral: number | string;
  ivaAmount: number | string;
  totalAmount: number | string;
}

function n(v: number | string | undefined) {
  return Number(v ?? 0);
}

function mapLine(line: LibroLine, kind: LibroKind, index: number): Documento {
  const isVentas = kind === 'ventas';
  return {
    id: String(line.id),
    nro_op: String(index + 1).padStart(3, '0'),
    fecha: line.issueDate,
    rif: (isVentas ? line.customerTaxId : line.supplierTaxId) ?? '—',
    razonSocial: (isVentas ? line.customerName : line.supplierName) ?? '—',
    nro_factura: line.invoiceNumber ?? '—',
    nro_control: line.controlNumber ?? '—',
    base_imponible: n(line.baseGeneral),
    iva_causado: n(line.ivaAmount),
    total: n(line.totalAmount),
    tipo: kind === 'ventas' ? 'venta' : 'compra',
  };
}

const NORMAS_COMPRAS = [
  'Las compras deben incluir facturas de proveedores con RIF válido',
  'El crédito fiscal se genera solo con documentos que cumplan requisitos SENIAT',
  'Registrar retenciones según tasas vigentes en el período',
  'Mantener copias de facturas organizadas por RIF y fecha',
];

const NORMAS_VENTAS = [
  'Emisión con numeración de control fiscal correlativa',
  'Libro alimentado desde POS y módulo de facturas MARFYL',
  'Verificar RIF del cliente en operaciones a crédito',
  'Exportar el período antes del vencimiento según terminación RIF',
];

export function LibroFiscalPage({ kind }: { kind: LibroKind }) {
  const router = useRouter();
  const { canManageFiscal } = usePermission();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<LibroLine[]>([]);

  const tituloTabla = kind === 'ventas' ? 'Lista de ventas' : 'Lista de compras';
  const normas = kind === 'ventas' ? NORMAS_VENTAS : NORMAS_COMPRAS;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = kind === 'ventas'
        ? await fiscalService.listLibroVentas({ year, month })
        : await fiscalService.listLibroCompras({ year, month });
      setLines(response.lines ?? []);
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [kind, year, month]);

  useEffect(() => {
    if (!canManageFiscal) {
      router.replace('/');
      return;
    }
    load();
  }, [canManageFiscal, router, load]);

  const documentos = useMemo(
    () => lines.map((line, i) => mapLine(line, kind, i)),
    [lines, kind],
  );

  const handleExport = () => {
    const header = [
      'N° OP',
      'Fecha',
      'RIF',
      'Razón Social',
      'N° Factura',
      'N° Control',
      'Base Imponible',
      'IVA',
      'Total',
    ];
    const rows = documentos.map((d) => [
      d.nro_op,
      d.fecha,
      d.rif,
      d.razonSocial,
      d.nro_factura,
      d.nro_control,
      d.base_imponible,
      d.iva_causado,
      d.total,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `libro-${kind}-${year}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canManageFiscal) return null;

  return (
    <div className="space-y-6">
      <FiscalToolbar>
        <div className="space-y-1 min-w-[5rem]">
          <Label className="text-xs text-muted-foreground">Año</Label>
          <Input
            type="number"
            className="w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1 min-w-[4rem]">
          <Label className="text-xs text-muted-foreground">Mes</Label>
          <Input
            type="number"
            min={1}
            max={12}
            className="w-20"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </div>
        <Button variant="outline" onClick={load}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
        </Button>
        <p className="text-xs fiscal-v0-muted w-full sm:w-auto sm:ml-auto sm:text-right">
          Formato SENIAT · Período {month}/{year}
        </p>
      </FiscalToolbar>

      <LibroTable
        documentos={documentos}
        titulo={tituloTabla}
        onExport={handleExport}
        loading={loading}
      />

      <div className="fiscal-v0-panel p-6">
        <h3 className="text-lg font-bold mb-4">
          {kind === 'ventas' ? 'Normas para libro de ventas' : 'Normas para registro de compras'}
        </h3>
        <ul className="space-y-2 text-sm fiscal-v0-muted">
          {normas.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
