'use client';

import { useVisibleModules } from '@/hooks/useVisibleModules';
import { useAuthStore } from '@/store/useAuthStore';
import { ModuleCard } from './module-card';
import { AdminMotionStagger, AdminMotionItem } from '@/components/admin/admin-motion';
import { Sparkles } from 'lucide-react';

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
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecciona un módulo
            </p>
          </div>
        </div>
      </div>

      <AdminMotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <AdminMotionItem key={mod.id}>
            <ModuleCard module={mod} />
          </AdminMotionItem>
        ))}
      </AdminMotionStagger>
    </div>
  );
}
