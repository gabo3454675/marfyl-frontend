'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, RefreshCw, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiscalHubCard, FiscalHubSectionTitle } from './fiscal-hub-card';

const steps = [
  {
    id: 'profile',
    title: 'Configurar perfil fiscal',
    desc: 'RIF, régimen y agente de retención para calcular obligaciones.',
    href: '/fiscal/perfil',
    icon: UserCog,
  },
  {
    id: 'sync',
    title: 'Sincronizar reglas SENIAT',
    desc: 'Carga plantillas de IVA, retenciones, IGTF e ISLR.',
    action: 'sync' as const,
    icon: RefreshCw,
  },
  {
    id: 'books',
    title: 'Registrar operaciones del período',
    desc: 'Alimente libros de ventas y compras para semáforo de cumplimiento.',
    href: '/fiscal/libro-ventas',
    icon: CheckCircle2,
  },
];

export function FiscalOnboardingState({
  profileConfigured,
  onSync,
  syncing,
}: {
  profileConfigured: boolean;
  onSync: () => void;
  syncing?: boolean;
}) {
  return (
    <FiscalHubCard delay={0.1}>
      <FiscalHubSectionTitle
        title="Configure su calendario fiscal"
        description="Aún no hay obligaciones visibles para este período. Siga estos pasos para activar vencimientos y alertas."
      />
      <ul className="space-y-3">
        {steps.map((step, i) => {
          const done = step.id === 'profile' && profileConfigured;
          const Icon = step.icon;
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 dark:bg-slate-800/30"
            >
              <div className="shrink-0 mt-0.5">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                <div className="mt-3">
                  {step.action === 'sync' ? (
                    <Button size="sm" onClick={onSync} disabled={syncing}>
                      {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={step.href!}>Ir</Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </FiscalHubCard>
  );
}
