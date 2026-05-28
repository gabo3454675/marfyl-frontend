'use client';

import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import type { FiscalComplianceMode } from '@/types/fiscal-calendar-hub';
import { Button } from '@/components/ui/button';

export function FiscalDiagnosticBanner({
  mode,
  reasons,
}: {
  mode: FiscalComplianceMode;
  reasons: string[];
}) {
  if (mode !== 'DIAGNOSTIC') return null;

  return (
    <div className="fiscal-hub-diagnostic rounded-xl border border-[hsl(var(--dm-a-accent)/0.35)] bg-[hsl(var(--dm-a-accent)/0.08)] px-4 py-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--dm-a-accent))]" />
          <div>
            <p className="font-semibold text-foreground">Modo diagnóstico</p>
            <p className="mt-1 text-sm text-muted-foreground">
              El motor de cumplimiento no puede operar con confianza hasta completar la identidad fiscal.
            </p>
            {reasons.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link href="/fiscal/perfil">Completar perfil</Link>
        </Button>
      </div>
    </div>
  );
}
