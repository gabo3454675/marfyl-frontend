'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAssistant } from './assistant-provider';
import { cn } from '@/lib/utils';

const AssistantPanel = dynamic(
  () => import('./assistant-panel').then((m) => ({ default: m.AssistantPanel })),
  { ssr: false },
);
export function MarfylAssistant({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  const { open, setOpen, openAssistant, fabPulse } = useAssistant();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    if (open) setOpen(false);
    else openAssistant();
  };

  const fabButton = (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'app-fab-anchor flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full',
        hideOnMobile && 'max-lg:hidden',
        'ai-fab shadow-lg touch-manipulation',
        fabPulse && 'ai-fab-pulse',
        open && 'ring-2 ring-white/40',
      )}
      aria-label={open ? 'Cerrar asistente fiscal' : 'Abrir asistente fiscal MARFYL'}
      aria-expanded={open}
    >
      {open ? (
        <X className="relative h-5 w-5 text-slate-900" strokeWidth={2.5} />
      ) : (
        <Sparkles className="relative h-5 w-5 text-slate-900" strokeWidth={2.2} />
      )}
    </button>
  );

  return (
    <>
      {mounted ? createPortal(fabButton, document.body) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="ai-sheet z-[100] flex h-[100dvh] max-h-[100dvh] w-full flex-col p-0 border-l border-white/10 overflow-hidden sm:max-w-md"
        >
          {open ? <AssistantPanel variant="sheet" className="h-full min-h-0" /> : null}
        </SheetContent>
      </Sheet>    </>
  );
}
