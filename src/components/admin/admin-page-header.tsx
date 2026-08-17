'use client';

import { cn } from '@/lib/utils';

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  border = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
  border?: boolean;
}) {
  return (
    <header
      className={cn(
        'admin-page-header flex flex-col gap-3',
        'min-[600px]:flex-row min-[600px]:items-end min-[600px]:justify-between',
        'sm:flex-row sm:items-end sm:justify-between',
        border && 'border-b border-border/60 pb-4 sm:pb-5 mb-1',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="admin-page-eyebrow mb-1.5">{eyebrow}</p>
        ) : null}
        <h1 className="admin-page-title">{title}</h1>
        {subtitle ? (
          <div className="admin-page-subtitle mt-1.5 sm:mt-2">{subtitle}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 w-full flex-col gap-2 min-[600px]:w-auto min-[600px]:shrink-0 min-[600px]:flex-row min-[600px]:flex-wrap min-[600px]:items-center sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap [&_button]:w-full sm:[&_button]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function AdminSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-head">
        <h2 className="admin-section-title">{title}</h2>
        {description ? (
          <p className="admin-section-desc">{description}</p>
        ) : null}
      </div>
      <div className="admin-section-body">{children}</div>
    </section>
  );
}
