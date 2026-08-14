'use client';

import { ExchangeRateIndicator } from '@/components/exchange-rate-indicator';
import { DisplayCurrencyToggle } from '@/components/display-currency-toggle';
import { TasksNotificationBell } from '@/components/tasks-notification-bell';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { CashboxSwitchWrapper } from './cashbox-switch-wrapper';
import { isProductFeatureEnabled } from '@/lib/features';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';

export function AdminTopbar({
  onOpenRateConfig,
  className,
}: {
  onOpenRateConfig: () => void;
  className?: string;
}) {
  const { canManageCierreCaja } = usePermission();
  const showTasks = isProductFeatureEnabled('tasks');

  return (
    <header
      className={cn(
        'admin-topbar sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3 md:gap-4',
        'px-3 py-2.5 sm:px-4 md:px-5 lg:px-6',
        'pt-[max(0.625rem,env(safe-area-inset-top,0px))]',
        'pl-[max(0.75rem,env(safe-area-inset-left,0px))]',
        'pr-[max(0.75rem,env(safe-area-inset-right,0px))]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <OrganizationSwitcher variant="topbar" />
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
        {canManageCierreCaja && <CashboxSwitchWrapper />}
        {showTasks && <TasksNotificationBell />}
        <DisplayCurrencyToggle className="hidden sm:flex shrink-0" short />
        <ExchangeRateIndicator
          onOpenConfig={onOpenRateConfig}
          className="shrink-0 max-w-[7.5rem] sm:max-w-none"
        />
      </div>
    </header>
  );
}
