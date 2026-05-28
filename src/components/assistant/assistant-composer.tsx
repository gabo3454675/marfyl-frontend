'use client';

import { ArrowUp, Loader2, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AssistantComposer({
  value,
  onChange,
  onSend,
  onReset,
  disabled,
  sending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onReset: () => void;
  disabled?: boolean;
  sending?: boolean;
}) {
  return (
    <div className="ai-composer shrink-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="ai-icon-btn shrink-0"
          aria-label="Nueva acción"
          disabled={disabled}
        >
          <Plus className="h-5 w-5 text-white/70" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Escribe tu mensaje…"
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/35 outline-none text-sm py-2"
        />
        <button
          type="button"
          onClick={onReset}
          className="ai-icon-btn shrink-0 hidden sm:flex"
          title="Reiniciar chat"
          disabled={disabled}
        >
          <RotateCcw className="h-4 w-4 text-white/60" />
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn('ai-send-btn shrink-0', sending && 'scale-95 opacity-90')}
          aria-label="Enviar"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          ) : (
            <ArrowUp className="h-5 w-5 text-slate-900" strokeWidth={2.5} />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-white/35 flex items-center justify-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-emerald-400/80" />
        Información procesada de forma segura · Gemini
      </p>
    </div>
  );
}
