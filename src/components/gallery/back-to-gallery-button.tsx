'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BackToGalleryButtonProps = {
  className?: string;
  /** `bar`: chip compacto en app bar. `page`: enlace dentro del contenido. */
  variant?: 'bar' | 'page';
  label?: string;
};

/**
 * Botón para volver a la galería de módulos (/).
 * Usar en chrome global y en pantallas de error/empty state.
 */
export function BackToGalleryButton({
  className,
  variant = 'bar',
  label = 'Volver a la galería',
}: BackToGalleryButtonProps) {
  if (variant === 'page') {
    return (
      <Link
        href="/"
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium',
          'text-muted-foreground transition-colors duration-200 hover:text-foreground',
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      asChild
      className={cn(
          'h-11 shrink-0 gap-1.5 rounded-xl px-3 sm:h-9',
        className,
      )}
    >
      <Link href="/" aria-label={label}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Atrás</span>
        <span className="hidden sm:inline">{label}</span>
      </Link>
    </Button>
  );
}
