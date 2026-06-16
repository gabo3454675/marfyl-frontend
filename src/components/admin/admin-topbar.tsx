'use client';

import { ExchangeRateIndicator } from '@/components/exchange-rate-indicator';
import { DisplayCurrencyToggle } from '@/components/display-currency-toggle';
import { TasksNotificationBell } from '@/components/tasks-notification-bell';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { CashboxSwitchWrapper } from './cashbox-switch-wrapper';
import { cn } from '@/lib/utils';

export function AdminTopbar({
  onOpenRateConfig,
  className,
}: {
  onOpenRateConfig: () => void;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'admin-topbar sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3 md:gap-4 px-3 py-2.5 sm:px-4 md:px-5 lg:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <OrganizationSwitcher variant="topbar" />
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        <CashboxSwitchWrapper />
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
