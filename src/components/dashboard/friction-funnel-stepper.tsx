'use client';

import { Check, FileText, CreditCard, ClipboardList } from 'lucide-react';
import { AdminChartCard } from '@/components/admin/admin-card';
import { cn } from '@/lib/utils';
import type { FrictionFunnel } from './types';

const STEPS = [
  { key: 'presupuesto', label: 'Presupuesto', icon: ClipboardList },
  { key: 'orden', label: 'Orden', icon: FileText },
  { key: 'factura', label: 'Factura', icon: FileText },
  { key: 'pago', label: 'Pagada', icon: CreditCard },
] as const;

interface FrictionFunnelStepperProps {
  funnel: FrictionFunnel;
  loading: boolean;
}

export function FrictionFunnelStepper({ funnel, loading }: FrictionFunnelStepperProps) {
  const conversionRate =
    funnel.totalCreadas > 0
      ? Math.round((funnel.totalPagadas / funnel.totalCreadas) * 100)
      : 0;

  const activeStep = funnel.totalPagadas > 0 ? 3 : funnel.totalCreadas > 0 ? 1 : 0;

  return (
    <AdminChartCard
      title="Embudo de fricción"
      description="Flujo desde presupuesto hasta factura pagada"
      bodyClassName="space-y-5"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= activeStep;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                        done
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-secondary border-border text-muted-foreground',
                      )}
                    >
                      {done && i === activeStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center truncate w-full">
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-1 rounded transition-colors',
                        i < activeStep ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-muted-foreground text-xs">Creadas</p>
              <p className="text-lg font-semibold tabular-nums">{funnel.totalCreadas}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400/80 text-xs">Pagadas</p>
              <p className="text-lg font-semibold tabular-nums text-emerald-400">{funnel.totalPagadas}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tasa de conversión</span>
              <span className="font-medium text-foreground">{conversionRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${conversionRate}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Tiempo promedio hasta pago</p>
            <p className="text-xl font-semibold">
              {funnel.tiempoPromedioDias >= 1
                ? `${funnel.tiempoPromedioDias} días`
                : `${funnel.tiempoPromedioHoras} h`}
            </p>
          </div>

          {funnel.mensajeAlerta && (
            <div
              className={cn(
                'rounded-lg p-3 text-xs',
                funnel.cuelloDeBotella === 'cobranza'
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300',
              )}
            >
              <p className="font-medium">
                Cuello de botella: {funnel.cuelloDeBotella === 'cobranza' ? 'Cobranza' : 'Despacho'}
              </p>
              <p className="mt-1 text-muted-foreground">{funnel.mensajeAlerta}</p>
            </div>
          )}
        </>
      )}
    </AdminChartCard>
  );
}
