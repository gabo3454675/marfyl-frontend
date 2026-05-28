'use client';

import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ASSISTANT_QUICK_PROMPTS } from './assistant-tokens';
import { useAssistantOptional } from './assistant-provider';

export function FiscalAssistantHint() {
  const assistant = useAssistantOptional();

  const open = () => {
    if (assistant) {
      assistant.openAssistant();
      return;
    }
    window.dispatchEvent(new CustomEvent('open-marfyl-assistant'));
  };

  return (
    <aside className="fiscal-assistant-hint flex flex-col gap-4 lg:sticky lg:top-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Asistente Fiscal</p>
          <p className="text-xs text-muted-foreground">Gemini · validaciones SENIAT</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Consulte facturación, IVA, cierre y alertas sin salir del perfil. También puede usar el botón{' '}
        <Sparkles className="inline h-3.5 w-3.5 text-primary mx-0.5" /> flotante.
      </p>
      <Button type="button" className="w-full gap-2" onClick={open}>
        <MessageCircle className="h-4 w-4" />
        Abrir asistente
      </Button>
      <ul className="space-y-2">
        {ASSISTANT_QUICK_PROMPTS.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={open}
              className="w-full text-left text-xs rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
