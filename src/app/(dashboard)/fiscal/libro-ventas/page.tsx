'use client';

import { LibroFiscalPage } from '@/components/fiscal/libro-fiscal-page';
import { FiscalShell } from '@/components/fiscal/fiscal-shell';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function LibroVentasPage() {
  return (
    <FiscalShell
      title="Libro de ventas"
      subtitle="Operaciones desde POS y facturas — proyección al libro fiscal"
      actions={
        <Button className="gap-2" asChild>
          <Link href="/pos">
            <Plus className="w-4 h-4" />
            Ir al POS
          </Link>
        </Button>
      }
    >
      <LibroFiscalPage kind="ventas" />
    </FiscalShell>
  );
}
