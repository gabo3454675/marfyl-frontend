'use client';

import { cn } from '@/lib/utils';
import { FiscalHubCard } from './fiscal-hub-card';

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted/60', className)} />;
}

export function FiscalCalendarSkeleton() {
  return (
    <div className="space-y-6">
      <Bone className="h-32 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FiscalHubCard noPadding>
            <div className="p-6 space-y-4">
              <Bone className="h-6 w-48" />
              <Bone className="h-24 w-full" />
              <Bone className="h-24 w-full" />
            </div>
          </FiscalHubCard>
          <FiscalHubCard noPadding>
            <div className="p-6 space-y-4">
              <Bone className="h-6 w-40" />
              <Bone className="h-20 w-full" />
            </div>
          </FiscalHubCard>
        </div>
        <div className="space-y-6">
          <Bone className="h-48 w-full rounded-2xl" />
          <Bone className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
