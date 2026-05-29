'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Loader2 } from 'lucide-react';

/**
 * Vista dedicada del menú: reutiliza Gastos con la pestaña Proveedores.
 */
export default function SuppliersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/expenses?tab=suppliers');
  }, [router]);

  return (
    <AdminPageShell
      eyebrow="Finanzas"
      title="Proveedores"
      subtitle="Redirigiendo al módulo de gastos…"
      animate={false}
    >
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        Abriendo proveedores…
      </div>
    </AdminPageShell>
  );
}
