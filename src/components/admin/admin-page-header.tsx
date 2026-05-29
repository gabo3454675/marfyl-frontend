'use client';

import { cn } from '@/lib/utils';

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'admin-page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="admin-page-eyebrow mb-1.5">{eyebrow}</p>
        ) : null}
        <h1 className="admin-page-title">{title}</h1>
        {subtitle ? (
          <p className="admin-page-subtitle mt-1.5 sm:mt-2">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
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
