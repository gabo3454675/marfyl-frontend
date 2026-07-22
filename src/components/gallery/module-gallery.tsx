'use client';

import { useVisibleModules } from '@/hooks/useVisibleModules';
import { useAuthStore } from '@/store/useAuthStore';
import { ModuleCard } from './module-card';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { AdminMotionStagger, AdminMotionItem } from '@/components/admin/admin-motion';
import { Building2, Sparkles } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function ModuleGallery() {
  const modules = useVisibleModules();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 sm:h-11 sm:w-11">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {getGreeting()}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              Elige un módulo · trabaja en la empresa activa
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-3 sm:min-w-[16rem] sm:max-w-sm sm:p-3.5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Empresa activa
          </p>
          <OrganizationSwitcher variant="gallery" className="w-full" />
        </div>
      </div>

      <AdminMotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <AdminMotionItem key={mod.id}>
            <ModuleCard module={mod} />
          </AdminMotionItem>
        ))}
      </AdminMotionStagger>
    </div>
  );
}
