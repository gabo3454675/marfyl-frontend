import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const MARFYL_LOGO_ICON = '/logo-icon.png';

type MarfylLogoProps = {
  /** `brand` = ícono + MARFYL · `icon` = solo ícono (sidebar colapsado) */
  variant?: 'brand' | 'icon';
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
  href?: string;
  priority?: boolean;
};

export function MarfylLogo({
  variant = 'brand',
  className,
  imageClassName,
  wordmarkClassName,
  href,
  priority = false,
}: MarfylLogoProps) {
  const isIconOnly = variant === 'icon';

  const iconSizes = isIconOnly
    ? 'h-9 w-9 sm:h-10 sm:w-10'
    : 'h-9 w-9 sm:h-10 sm:w-10';

  const content = (
    <span
      className={cn(
        'inline-flex items-center min-w-0',
        isIconOnly ? 'gap-0' : 'gap-2.5 sm:gap-3',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background shadow-sm overflow-hidden',
          iconSizes,
          'p-1.5 sm:p-[7px]',
        )}
      >
        <Image
          src={MARFYL_LOGO_ICON}
          alt=""
          width={80}
          height={80}
          priority={priority}
          aria-hidden
          className={cn('h-full w-full object-contain object-center', imageClassName)}
        />
      </span>
      {!isIconOnly && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground truncate',
            'text-lg sm:text-xl leading-none pt-0.5',
            wordmarkClassName,
          )}
        >
          MARFYL
        </span>
      )}
    </span>
  );

  const labelled = (
    <span className="inline-flex min-w-0" aria-label="MARFYL">
      {content}
    </span>
  );

  if (!href) {
    return labelled;
  }

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 shrink-0 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
