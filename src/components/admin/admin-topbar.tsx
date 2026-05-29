'use client';

import { Building2 } from 'lucide-react';
import { ExchangeRateIndicator } from '@/components/exchange-rate-indicator';
import { DisplayCurrencyToggle } from '@/components/display-currency-toggle';
import { TasksNotificationBell } from '@/components/tasks-notification-bell';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export function AdminTopbar({
  onOpenRateConfig,
  className,
}: {
  onOpenRateConfig: () => void;
  className?: string;
}) {
  const getCurrentOrganization = useAuthStore((s) => s.getCurrentOrganization);
  const org = getCurrentOrganization();

  return (
    <header
      className={cn(
        'admin-topbar sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3 md:gap-4 px-3 py-2.5 sm:px-4 md:px-5 lg:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <span className="admin-org-chip" title={org?.name ?? 'Organización'}>
          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          <span className="truncate max-w-[10rem] sm:max-w-[14rem]">
            {org?.name ?? 'Mi organización'}
          </span>
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        <TasksNotificationBell />
        <DisplayCurrencyToggle className="shrink-0" short />
        <ExchangeRateIndicator
          onOpenConfig={onOpenRateConfig}
          className="shrink-0"
        />
      </div>
    </header>
  );
}
