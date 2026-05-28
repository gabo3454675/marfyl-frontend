import { Check, X } from 'lucide-react';
import type { PricingPlan } from '@/lib/content/marketing-pages';
import { cn } from '@/lib/utils';

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            'rounded-2xl border p-6 flex flex-col',
            plan.highlighted
              ? 'border-[hsl(var(--marketing-accent))] shadow-lg ring-1 ring-[hsl(var(--marketing-accent)/0.3)] scale-[1.02]'
              : 'border-border/80 bg-card',
          )}
        >
          {plan.highlighted && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--marketing-accent))] mb-2">
              Recomendado
            </span>
          )}
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
          <p className="mt-6 text-3xl font-bold">{plan.priceUsd}</p>
          <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
          <ul className="mt-6 space-y-2 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-[hsl(var(--marketing-accent))]" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PricingComparison({
  rows,
}: {
  rows: readonly {
    feature: string;
    starter: boolean;
    pro: boolean;
    enterprise: boolean;
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left p-4 font-semibold">Característica</th>
            <th className="p-4 text-center font-semibold">Operación</th>
            <th className="p-4 text-center font-semibold">Cumplimiento</th>
            <th className="p-4 text-center font-semibold">Empresa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-border/50 last:border-0">
              <td className="p-4">{row.feature}</td>
              <td className="p-4 text-center">
                <CellIcon value={row.starter} />
              </td>
              <td className="p-4 text-center">
                <CellIcon value={row.pro} />
              </td>
              <td className="p-4 text-center">
                <CellIcon value={row.enterprise} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CellIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-4 w-4 mx-auto text-[hsl(var(--marketing-accent))]" />
  ) : (
    <X className="h-4 w-4 mx-auto text-muted-foreground/50" />
  );
}
