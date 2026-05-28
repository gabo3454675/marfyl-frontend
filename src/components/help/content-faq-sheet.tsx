'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { FaqItem } from '@/lib/content/faq-content';
import { cn } from '@/lib/utils';

export function ContentFaqSheet({
  title,
  description,
  items,
  triggerLabel = 'Ayuda',
  variant = 'outline',
  size = 'sm',
}: {
  title: string;
  description?: string;
  items: FaqItem[];
  triggerLabel?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default';
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          <HelpCircle className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <ul className="mt-6 space-y-2">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="rounded-lg border border-border/80 overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                >
                  {item.question}
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
                  />
                </button>
                {open && (
                  <p className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                )}
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
