import { Check, X } from 'lucide-react';
import type { PricingPlan } from '@/lib/content/marketing-pages';
import { cn } from '@/lib/utils';

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="marketing-features-grid">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            'marketing-pricing-card flex flex-col',
            plan.highlighted && 'marketing-pricing-card--highlighted',
          )}
        >
          {plan.highlighted && (
            <span className="marketing-pricing-badge">Recomendado</span>
          )}
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-sm marketing-pricing-muted mt-2">{plan.description}</p>
          <p className="mt-6 text-3xl font-bold">{plan.priceUsd}</p>
          <p className="text-xs marketing-pricing-muted">{plan.priceNote}</p>
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
    <div className="marketing-comparison-table overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.45)]">
            <th className="text-left p-4 font-semibold">Característica</th>
            <th className="p-4 text-center font-semibold">Operación</th>
            <th className="p-4 text-center font-semibold">Cumplimiento</th>
            <th className="p-4 text-center font-semibold">Empresa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-[hsl(var(--border)/0.6)] last:border-0">
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
    <X className="h-4 w-4 mx-auto text-[hsl(var(--muted-foreground)/0.45)]" />
  );
}
