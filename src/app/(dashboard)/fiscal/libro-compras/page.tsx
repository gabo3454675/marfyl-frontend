'use client';

import { LibroFiscalPage } from '@/components/fiscal/libro-fiscal-page';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function LibroComprasPage() {
  return (
    <FiscalShell
      title="Libro de compras"
      subtitle="IVA acreditable y retenciones del período — formato SENIAT"
      actions={
        <Button className="gap-2" asChild>
          <Link href="/expenses">
            <Plus className="w-4 h-4" />
            Nueva compra
          </Link>
        </Button>
      }
    >
      <LibroFiscalPage kind="compras" />
    </FiscalShell>
  );
}
