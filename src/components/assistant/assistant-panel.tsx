'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, MoreHorizontal, Sparkles } from 'lucide-react';
import { sendAssistantMessage, type ChatMessage } from '@/lib/api/assistant';
import { ASSISTANT_QUICK_PROMPTS, ASSISTANT_STARTER } from './assistant-tokens';
import { ChatBubble, TypingIndicator } from './chat-bubble';
import { AssistantSummaryCard } from './assistant-summary-card';
import { AssistantComposer } from './assistant-composer';
import { formatAssistantError } from './format-assistant-error';
import { cn } from '@/lib/utils';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';

const STARTER: ChatMessage = { role: 'assistant', content: ASSISTANT_STARTER };

function buildContext(pathname: string) {
  if (pathname.startsWith('/fiscal')) return 'Usuario en módulo Fiscal MARFYL';
  if (pathname.startsWith('/pos')) return 'Usuario en POS';
  if (pathname.startsWith('/invoices')) return 'Usuario en Facturas';
  if (pathname.startsWith('/assistant')) return 'Usuario en pantalla dedicada del Asistente IA';
  return 'Usuario en dashboard MARFYL';
}

export function AssistantPanel({
  className,
  variant = 'sheet',
}: {
  className?: string;
  variant?: 'sheet' | 'page';
}) {
  const pathname = usePathname() ?? '/';
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyStarter = messages.length === 1 && messages[0]?.role === 'assistant';

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages.length, loading, scrollDown]);

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const history = [...messages.slice(1), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollDown();
    try {
      const { reply } = await sendAssistantMessage(trimmed, history, buildContext(pathname));
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      setError(formatAssistantError(e));
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  const reset = () => {
    setMessages([STARTER]);
    setInput('');
    setError(null);
  };

  const retryLast = async () => {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx < 1 || loading) return;
    const lastUser = messages[lastUserIdx];
    const history = messages.slice(1, lastUserIdx);
    setError(null);
    setLoading(true);
    try {
      const { reply } = await sendAssistantMessage(
        lastUser.content,
        [...history, lastUser],
        buildContext(pathname),
      );
      setMessages((prev) => [
        ...prev.slice(0, lastUserIdx + 1),
        { role: 'assistant', content: reply },
      ]);
    } catch (e: unknown) {
      setError(formatAssistantError(e));
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  const fillPrompt = (prompt: string) => {
    setInput(prompt);
    setError(null);
  };

  return (
    <div className={cn('ai-panel dm-zone-assistant relative isolate flex flex-col h-full min-h-0 w-full', className)}>
      <DmAmbientMotion palette="b" intensity="strong" className="opacity-90" />
      <header className="relative z-[1] shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="ai-icon-btn h-10 w-10 sm:h-11 sm:w-11">
            <Bot className="h-5 w-5 text-[hsl(var(--dm-b-accent))]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">Asistente Fiscal</h2>
              <span className="ai-badge-seniat shrink-0">SENIAT</span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/60 mt-0.5 truncate">
              Facturación y control tributario · MARFYL
            </p>
          </div>
          <button type="button" className="ai-icon-btn h-10 w-10 hidden sm:flex" aria-label="IA activa">
            <Sparkles className="h-4 w-4 text-white" />
          </button>
          <button
            type="button"
            className="ai-icon-btn h-10 w-10"
            onClick={reset}
            aria-label="Reiniciar conversación"
          >
            <MoreHorizontal className="h-4 w-4 text-white" />
          </button>
        </div>
        {variant === 'sheet' && (
          <div className="mt-3">
            <AssistantSummaryCard compact />
          </div>
        )}
      </header>

      <div
        className={cn(
          'relative z-[1] flex flex-1 min-h-0 w-full',
          variant === 'page' && 'lg:grid lg:grid-cols-[minmax(0,1fr)_min(260px,28%)]',
        )}
      >
        <div className="flex flex-1 flex-col min-h-0 min-w-0">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 ai-chat-scroll flex flex-col justify-end gap-2"
          >
            {onlyStarter && (
              <div className="ai-welcome mb-2 shrink-0">
                <p className="text-sm text-white/80 leading-relaxed">{ASSISTANT_STARTER}</p>
                <p className="text-xs text-white/45 mt-2">
                  Elija una acción rápida o escriba su consulta abajo.
                </p>
              </div>
            )}
            {!onlyStarter &&
              messages.map((m, i) => (
                <ChatBubble
                  key={`${i}-${m.content.slice(0, 16)}`}
                  content={m.content}
                  isUser={m.role === 'user'}
                />
              ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="rounded-xl border border-red-400/35 bg-red-950/50 px-3 py-2.5 text-sm text-red-100 space-y-2">
                <p>{error}</p>
                <button
                  type="button"
                  className="text-xs font-medium underline text-red-200/90 hover:text-white"
                  onClick={async () => {
                    try {
                      await retryLast();
                    } catch (e) {
                      console.error('Retry failed:', e);
                    }
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-2.5 border-t border-white/5 bg-black/20 backdrop-blur-sm">
            {(onlyStarter || error) && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 ai-chips-scroll">
                {ASSISTANT_QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-chip shrink-0"
                    disabled={loading}
                    onClick={() => fillPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <AssistantComposer
              value={input}
              onChange={setInput}
              onSend={() => sendText(input)}
              onReset={reset}
              disabled={loading}
              sending={loading}
            />
          </div>
        </div>

        {variant === 'page' && (
          <aside className="hidden lg:flex flex-col gap-3 p-4 border-l border-white/10 min-h-0 overflow-y-auto ai-chat-scroll">
            <AssistantSummaryCard />
            <p className="text-xs text-white/50 leading-relaxed">
              Acciones sugeridas según su módulo fiscal. Los datos en vivo requieren perfil y backend
              activo.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
