'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Eye } from 'lucide-react';
import { Documento } from '@/lib/fiscal/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LibroTableProps {
  documentos: Documento[];
  columnas?: (keyof Documento)[];
  titulo: string;
  mostrarFiltros?: boolean;
  onExport?: () => void;
  loading?: boolean;
}

function formatearFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-VE');
  } catch {
    return iso;
  }
}

export function LibroTable({
  documentos,
  columnas = [
    'nro_op',
    'fecha',
    'rif',
    'razonSocial',
    'nro_factura',
    'nro_control',
    'base_imponible',
    'iva_causado',
    'total',
  ],
  titulo,
  mostrarFiltros = true,
  onExport,
  loading = false,
}: LibroTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm('');
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return documentos;
    return documentos.filter(
      (doc) =>
        doc.razonSocial.toLowerCase().includes(term) ||
        doc.rif.toLowerCase().includes(term) ||
        doc.nro_control.includes(term) ||
        doc.nro_factura.includes(term),
    );
  }, [documentos, searchTerm]);

  const getFormatValue = (key: keyof Documento, value: string | number) => {
    if (key === 'fecha') return formatearFecha(String(value));
    if (['base_imponible', 'iva_causado', 'total'].includes(String(key))) {
      return `Bs. ${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return String(value);
  };

  const labels: Record<string, string> = {
    nro_op: 'N° OP',
    fecha: 'Fecha',
    rif: 'RIF',
    razonSocial: 'Razón Social',
    nro_factura: 'N° Factura',
    nro_control: 'N° Control',
    base_imponible: 'Base Imponible',
    iva_causado: 'IVA Causado',
    total: 'Total',
  };

  const baseTotal = filteredDocs.reduce((s, d) => s + d.base_imponible, 0);
  const ivaTotal = filteredDocs.reduce((s, d) => s + d.iva_causado, 0);

  return (
    <div className="fiscal-v0-panel p-4 sm:p-6 animate-fiscal-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">{titulo}</h2>
        {onExport && (
          <Button
            type="button"
            onClick={onExport}
            variant="outline"
            size="sm"
            className="gap-2 text-xs sm:text-sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {mostrarFiltros && (
        <div className="mb-4 sm:mb-6 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por RIF, razón social, factura o control..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-max">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columnas.map((col) => (
                <th
                  key={String(col)}
                  className="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground tracking-wider"
                >
                  {labels[String(col)] ?? String(col)}
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Ver
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnas.length + 1} className="px-4 py-12 text-center fiscal-v0-muted">
                  Cargando libro fiscal…
                </td>
              </tr>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc, idx) => (
                <tr
                  key={doc.id}
                  className={cn(
                    'border-b border-border/60 hover:bg-muted/40 transition-colors',
                    idx % 2 === 0 ? 'bg-muted/20' : 'bg-transparent',
                  )}
                >
                  {columnas.map((col) => (
                    <td
                      key={`${doc.id}-${String(col)}`}
                      className="px-4 py-3 text-foreground text-xs font-medium"
                    >
                      {getFormatValue(col, doc[col] as string | number)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                      aria-label="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnas.length + 1} className="px-4 py-12 text-center fiscal-v0-muted">
                  No hay registros en este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 sm:mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="fiscal-v0-muted text-xs uppercase font-bold">Registros</p>
          <p className="fiscal-v0-stat text-lg mt-1">{filteredDocs.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 dark:bg-emerald-500/10">
          <p className="fiscal-v0-muted text-xs uppercase font-bold">Base imponible</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">
            Bs. {baseTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/25 dark:bg-cyan-500/10">
          <p className="fiscal-v0-muted text-xs uppercase font-bold">IVA total</p>
          <p className="text-cyan-600 dark:text-cyan-400 font-bold text-lg mt-1">
            Bs. {ivaTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
