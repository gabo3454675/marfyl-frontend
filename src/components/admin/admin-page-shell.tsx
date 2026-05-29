'use client';

import { cn } from '@/lib/utils';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminMotionFade } from '@/components/admin/admin-motion';
import { Loader2 } from 'lucide-react';

const maxWidthClass = {
  full: '',
  default: '',
  narrow: 'max-w-3xl mx-auto',
  medium: 'max-w-4xl mx-auto',
  wide: 'max-w-6xl mx-auto',
} as const;

export type AdminPageMaxWidth = keyof typeof maxWidthClass;

export function AdminPageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
  maxWidth = 'default',
  animate = true,
  loading,
  loadingLabel = 'Cargando…',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  maxWidth?: AdminPageMaxWidth;
  animate?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn(
          'w-full min-w-0 flex flex-col items-center justify-center py-16 gap-3',
          maxWidthClass[maxWidth],
          className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">{loadingLabel}</p>
      </div>
    );
  }

  const body = (
    <>
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
        className={cn('mb-5 sm:mb-6 md:mb-7', headerClassName)}
      />
      <div className={cn('admin-page-body', contentClassName)}>
        {children}
      </div>
    </>
  );

  return (
    <div className={cn('w-full min-w-0', maxWidthClass[maxWidth], className)}>
      {animate ? <AdminMotionFade>{body}</AdminMotionFade> : body}
    </div>
  );
}
