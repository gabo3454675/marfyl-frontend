'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, ShoppingCart, Truck } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { SalesImportPanel } from '../sales/import/sales-import-panel';
import { ExcelPurchasesPanel } from '../inventory/invoice-upload/excel-purchases-panel';
import { salesImportService } from '@/lib/api/sales-import';
import { purchasesImportService } from '@/lib/api/purchases-import';
import { toast } from 'sonner';

type ImportKind = 'ventas' | 'compras';

const KINDS: {
  id: ImportKind;
  short: string;
  blurb: string;
  href: string;
  hrefLabel: string;
  icon: typeof ShoppingCart;
}[] = [
  {
    id: 'ventas',
    short: 'Ventas',
    blurb: 'Crea facturas cobradas y descuenta stock. Plantilla de ventas o reporte del día.',
    href: '/invoices',
    hrefLabel: 'Ver facturas',
    icon: ShoppingCart,
  },
  {
    id: 'compras',
    short: 'Compras',
    blurb: 'Entra mercadería, actualiza costo y registra el gasto. Plantilla Excel, o foto/PDF en Compras.',
    href: '/inventory/invoice-upload',
    hrefLabel: 'Ir a compras',
    icon: Truck,
  },
];

export default function ImportarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canManageInventory } = usePermission();

  const raw = searchParams.get('tipo');
  const tipo: ImportKind | null =
    raw === 'compras' && canManageInventory
      ? 'compras'
      : raw === 'ventas' && canManageInventory
        ? 'ventas'
        : null;

  const setTipo = (next: ImportKind) => {
    router.replace(`/importar?tipo=${next}`, { scroll: false });
  };

  const [downloading, setDownloading] = useState<ImportKind | null>(null);

  const downloadKind = async (kind: ImportKind) => {
    setDownloading(kind);
    try {
      if (kind === 'ventas') await salesImportService.downloadTemplate();
      else await purchasesImportService.downloadTemplate();
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally {
      setDownloading(null);
    }
  };

  const active = KINDS.find((k) => k.id === tipo);

  if (!canManageInventory) {
    return (
      <AdminPageShell eyebrow="Operación" title="Importar" subtitle="Acceso restringido">
        <AdminCard>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para importar ventas ni compras.
          </p>
        </AdminCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Operación"
      title="Importar Excel"
      subtitle="Ventas y compras no se mezclan: cada una tiene su plantilla."
      maxWidth="wide"
    >
      <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-border/70 bg-background/90 p-1 backdrop-blur-md sm:static sm:bg-muted/40 sm:backdrop-blur-none">
        <div className="grid grid-cols-2 gap-1">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const on = tipo === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setTipo(k.id)}
                className={cn(
                  'flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition touch-manipulation',
                  on
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('h-4 w-4', k.id === 'ventas' ? 'text-violet-500' : 'text-cyan-500')} />
                {k.short}
              </button>
            );
          })}
        </div>
      </div>

      {!tipo && (
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <AdminCard key={k.id}>
                <div className="flex items-start gap-3">
                  <Icon className={cn('mt-0.5 h-5 w-5', k.id === 'ventas' ? 'text-violet-500' : 'text-cyan-500')} />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="font-semibold">{k.short}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{k.blurb}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 w-full cursor-pointer sm:w-auto"
                        disabled={downloading !== null}
                        onClick={() => downloadKind(k.id)}
                      >
                        {downloading === k.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Descargar plantilla
                      </Button>
                      <Button
                        type="button"
                        className="h-11 w-full cursor-pointer sm:w-auto"
                        onClick={() => setTipo(k.id)}
                      >
                        Subir archivo
                      </Button>
                    </div>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {active && (
        <div className="space-y-4">
          <div
            className={cn(
              'flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between',
              active.id === 'ventas'
                ? 'border-violet-500/25 bg-violet-500/10'
                : 'border-cyan-500/25 bg-cyan-500/10',
            )}
          >
            <p>
              Estás en <strong>{active.short.toLowerCase()}</strong>. {active.blurb}
            </p>
            <Button variant="outline" size="sm" className="h-10 shrink-0 self-start sm:self-center" asChild>
              <Link href={active.href}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                {active.hrefLabel}
              </Link>
            </Button>
          </div>
          {tipo === 'ventas' ? <SalesImportPanel /> : <ExcelPurchasesPanel />}
        </div>
      )}
    </AdminPageShell>
  );
}
