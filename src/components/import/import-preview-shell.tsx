'use client';

import type { ReactNode } from 'react';
import { AdminTableWrap } from '@/components/admin/admin-card';

export type ImportPreviewError = {
  row?: number;
  line?: number;
  field?: string;
  message: string;
};

export type ImportPreviewUnmatched = {
  row?: number;
  line?: number;
  code: string;
  reason: string;
};

type ImportPreviewShellProps = {
  summary: ReactNode;
  canConfirm?: boolean;
  confirmBlockedMessage?: string;
  children?: ReactNode;
  errors?: ImportPreviewError[];
  unmatched?: ImportPreviewUnmatched[];
  className?: string;
};

export function ImportPreviewShell({
  summary,
  canConfirm = true,
  confirmBlockedMessage = 'Corrija errores antes de confirmar',
  children,
  errors = [],
  unmatched = [],
  className,
}: ImportPreviewShellProps) {
  return (
    <div className={`space-y-4 rounded-lg border p-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">{summary}</div>
        {!canConfirm && (
          <span className="text-sm text-destructive">{confirmBlockedMessage}</span>
        )}
      </div>

      {children ? <AdminTableWrap>{children}</AdminTableWrap> : null}

      {errors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-destructive mb-2">
            Errores{errors.length > 1 ? ` (${errors.length})` : ''}
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 max-h-40 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i}>
                {err.row != null && `Fila ${err.row}`}
                {err.field ? ` (${err.field})` : ''}
                {err.line != null && `Línea PDF ${err.line}`}
                {(err.row != null || err.line != null) && ': '}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {unmatched.length > 0 && (
        <div>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
            Códigos no reconocidos o no aplicables
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 max-h-40 overflow-y-auto">
            {unmatched.map((u, i) => (
              <li key={i}>
                {u.code}: {u.reason}
                {u.row != null && ` (fila ${u.row})`}
                {u.line != null && ` (línea PDF ${u.line})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
