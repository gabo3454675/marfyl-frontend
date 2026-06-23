'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ServiciosCombosRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/products?type=service');
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Redirigiendo a Productos...</p>
    </div>
  );
}
