'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminCard } from '@/components/admin/admin-card';
import { Loader2, TrendingDown } from 'lucide-react';
import apiClient from '@/lib/api';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface KpisResponse {
  economicImpactByDay: { date: string; totalCost: number; count: number }[];
  topProducts: { productId: number; productName: string; quantity: number; totalCost: number }[];
  reasonDistribution: { reason: string | null; count: number; totalCost: number }[];
}

const REASON_LABELS: Record<string, string> = {
  MERMA: 'Merma',
  MUESTRAS: 'Muestras',
  USO_OPERATIVO: 'Uso operativo',
  SIN_CLASIFICAR: 'Sin clasificar',
};

export function AutoconsumoKpisCard() {
  const { formatForDisplay } = useDisplayCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements-kpis'],
    queryFn: () =>
      apiClient.get<KpisResponse>('/inventory/movements/kpis').then((r) => r.data),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <AdminCard title="Impacto de autoconsumo / merma">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AdminCard>
    );
  }

  const top = data?.topProducts.slice(0, 5) ?? [];
  const reasons = data?.reasonDistribution ?? [];
  const totalCost = reasons.reduce((s, r) => s + r.totalCost, 0);

  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-amber-500" />
          Autoconsumo y merma
        </span>
      }
      description="Resumen del impacto. El detalle se registra arriba."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Costo acumulado</p>
          <p className="text-lg font-semibold">{formatForDisplay(totalCost)}</p>
        </div>
        <div className="space-y-1 text-sm">
          {reasons.length === 0 && (
            <p className="text-muted-foreground">Sin movimientos de autoconsumo aún.</p>
          )}
          {reasons.map((r) => (
            <p key={r.reason ?? 'none'}>
              {REASON_LABELS[r.reason ?? 'SIN_CLASIFICAR'] ?? r.reason}: {r.count} ·{' '}
              {formatForDisplay(r.totalCost)}
            </p>
          ))}
        </div>
      </div>
      {top.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm border-t pt-3">
          {top.map((p) => (
            <li key={p.productId} className="flex justify-between gap-2">
              <span className="truncate">{p.productName}</span>
              <span className="shrink-0 text-muted-foreground">
                {p.quantity} · {formatForDisplay(p.totalCost)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
