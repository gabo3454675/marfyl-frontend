'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, ChevronDown, History, MoreHorizontal, Sparkles } from 'lucide-react';
import { sendFiscalAdvisorStream, sendAssistantMessageStream, type ChatMessage } from '@/lib/api/assistant';
import { useAuthStore } from '@/store/useAuthStore';
import { ASSISTANT_QUICK_PROMPTS } from './assistant-tokens';
import {
  ASSISTANT_STARTER_MESSAGE,
  clearAssistantHistory,
  deleteAssistantConversation,
  getActiveConversation,
  listAssistantConversations,
  saveAssistantHistory,
  startNewAssistantConversation,
  switchAssistantConversation,
  type AssistantConversation,
} from './assistant-chat-storage';
import { ChatBubble, StreamBubble, TypingIndicator } from './chat-bubble';
import { AssistantAuditWarnings } from './assistant-audit-warnings';
import { AssistantSummaryCard } from './assistant-summary-card';
import { AssistantComposer } from './assistant-composer';
import { formatAssistantError } from './format-assistant-error';
import { AssistantAuroraBackground, type AuroraActivity } from './assistant-aurora-bg';
import { AssistantHistoryPanel } from './assistant-history-panel';
import { useAssistantLoadingLabel } from './assistant-loading-phases';
import { cn } from '@/lib/utils';

function buildContext(pathname: string) {
  if (pathname.startsWith('/fiscal')) return 'Usuario en módulo Fiscal MARFYL';
  if (pathname.startsWith('/pos')) return 'Usuario en POS';
  if (pathname.startsWith('/invoices')) return 'Usuario en Facturas';
  if (pathname.startsWith('/assistant')) return 'Usuario en pantalla dedicada del Asistente IA';
  return 'Usuario en dashboard MARFYL';
}

const SCROLL_BOTTOM_THRESHOLD = 72;

export function AssistantPanel({
  className,
  variant = 'sheet',
}: {
  className?: string;
  variant?: 'sheet' | 'page';
}) {
  const pathname = usePathname() ?? '/';
  const userId = useAuthStore((s) => s.user?.id);
  const setToken = useAuthStore((s) => s.setToken);
  const selectOrganization = useAuthStore((s) => s.selectOrganization);

  const [messages, setMessages] = useState<ChatMessage[]>([ASSISTANT_STARTER_MESSAGE]);
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [auroraActivity, setAuroraActivity] = useState<AuroraActivity>('idle');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const { loadingLabel, setStatusPhase } = useAssistantLoadingLabel(loading, Boolean(streamingText));

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const onlyStarter =
    messages.length === 1 &&
    messages[0]?.role === 'assistant' &&
    messages[0]?.content === ASSISTANT_STARTER_MESSAGE.content;

  const refreshConversations = useCallback((uid: number) => {
    setConversations(listAssistantConversations(uid));
    const active = getActiveConversation(uid);
    setActiveConversationId(active.id);
    return active;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance <= SCROLL_BOTTOM_THRESHOLD;
    stickToBottomRef.current = atBottom;
    setShowScrollDown(!atBottom && messages.length > 1);
  }, [messages.length]);

  useEffect(() => {
    if (!userId) {
      setHistoryReady(true);
      return;
    }
    const active = refreshConversations(userId);
    setMessages(active.messages);
    setHistoryReady(true);
  }, [userId, refreshConversations]);

  useEffect(() => {
    if (!userId || !historyReady) return;
    saveAssistantHistory(userId, messages);
    setConversations(listAssistantConversations(userId));
  }, [messages, userId, historyReady]);

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom(messages.length <= 2 ? 'auto' : 'smooth');
    }
  }, [messages.length, loading, scrollToBottom]);

  useEffect(() => {
    if (loading) setAuroraActivity('receiving');
  }, [loading]);

  useEffect(() => {
    if (stickToBottomRef.current && streamingText) {
      scrollToBottom('auto');
    }
  }, [streamingText, scrollToBottom]);

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setAuroraActivity('sending');
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const history = messages.slice(1);
    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamingText('');
    scrollToBottom('smooth');
    try {
      let res: {
        reply: string;
        model: string;
        switchOrganization?: { access_token: string; organizationId: number };
      };
      let auditWarnings: ChatMessage['auditWarnings'];
      try {
        const advisor = await sendFiscalAdvisorStream(trimmed, {
          onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
          onStatus: setStatusPhase,
        });
        res = { reply: advisor.reply, model: advisor.model };
        auditWarnings = advisor.warnings.length > 0 ? advisor.warnings : undefined;
      } catch {
        res = await sendAssistantMessageStream(trimmed, history, buildContext(pathname), {
          onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
          onToolRound: () => setStreamingText(''),
        });
        auditWarnings = undefined;
      }
      if (res.switchOrganization?.access_token) {
        setToken(res.switchOrganization.access_token);
        selectOrganization(res.switchOrganization.organizationId);
        window.dispatchEvent(new Event('organization-changed'));
      }
      setAuroraActivity('receiving');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          auditWarnings,
        },
      ]);
      setStreamingText('');
      setTimeout(() => setAuroraActivity('idle'), 1200);
    } catch (e: unknown) {
      setError(formatAssistantError(e));
      setStreamingText('');
      setAuroraActivity('idle');
    } finally {
      setLoading(false);
      scrollToBottom('smooth');
    }
  };

  const reset = () => {
    setMessages([ASSISTANT_STARTER_MESSAGE]);
    if (userId) clearAssistantHistory(userId);
    setInput('');
    setError(null);
    setAuroraActivity('idle');
    stickToBottomRef.current = true;
    if (userId) refreshConversations(userId);
  };

  const handleNewConversation = () => {
    if (!userId) {
      setMessages([ASSISTANT_STARTER_MESSAGE]);
      setInput('');
      setError(null);
      return;
    }
    const msgs = startNewAssistantConversation(userId);
    const active = refreshConversations(userId);
    setMessages(msgs);
    setActiveConversationId(active.id);
    setInput('');
    setError(null);
    stickToBottomRef.current = true;
    scrollToBottom('auto');
  };

  const handleSelectConversation = (conversationId: string) => {
    if (!userId) return;
    const msgs = switchAssistantConversation(userId, conversationId);
    refreshConversations(userId);
    setMessages(msgs);
    setInput('');
    setError(null);
    stickToBottomRef.current = true;
    scrollToBottom('auto');
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (!userId) return;
    const msgs = deleteAssistantConversation(userId, conversationId);
    const active = refreshConversations(userId);
    setMessages(msgs);
    setActiveConversationId(active.id);
  };

  const retryLast = async () => {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx < 1 || loading) return;
    const lastUser = messages[lastUserIdx];
    const history = messages.slice(1, lastUserIdx);
    setError(null);
    setAuroraActivity('sending');
    setLoading(true);
    setStreamingText('');
    try {
      let res: {
        reply: string;
        model: string;
        switchOrganization?: { access_token: string; organizationId: number };
      };
      let auditWarnings: ChatMessage['auditWarnings'];
      try {
        const advisor = await sendFiscalAdvisorStream(lastUser.content, {
          onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
          onStatus: setStatusPhase,
        });
        res = { reply: advisor.reply, model: advisor.model };
        auditWarnings = advisor.warnings.length > 0 ? advisor.warnings : undefined;
      } catch {
        res = await sendAssistantMessageStream(lastUser.content, history, buildContext(pathname), {
          onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
          onToolRound: () => setStreamingText(''),
        });
        auditWarnings = undefined;
      }
      if (res.switchOrganization?.access_token) {
        setToken(res.switchOrganization.access_token);
        selectOrganization(res.switchOrganization.organizationId);
        window.dispatchEvent(new Event('organization-changed'));
      }
      setAuroraActivity('receiving');
      setMessages((prev) => [
        ...prev.slice(0, lastUserIdx + 1),
        {
          role: 'assistant',
          content: res.reply,
          auditWarnings,
        },
      ]);
      setStreamingText('');
      setTimeout(() => setAuroraActivity('idle'), 1200);
    } catch (e: unknown) {
      setError(formatAssistantError(e));
      setStreamingText('');
      setAuroraActivity('idle');
    } finally {
      setLoading(false);
      scrollToBottom('smooth');
    }
  };

  const fillPrompt = (prompt: string) => {
    setInput(prompt);
    setError(null);
  };

  return (
    <div className={cn('ai-panel relative isolate flex h-full min-h-0 w-full flex-col', className)}>
      <AssistantAuroraBackground activity={auroraActivity} />

      <header className="relative z-[1] shrink-0 border-b border-white/5 px-3 pb-2 pt-3 sm:px-4 sm:pt-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="ai-icon-btn h-10 w-10 sm:h-11 sm:w-11">
            <Bot className="h-5 w-5 text-[hsl(var(--dm-b-accent))]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-white sm:text-lg">Asistente Fiscal</h2>
              <span className="ai-badge-seniat shrink-0">SENIAT</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-white/60 sm:text-xs">
              Facturación y control tributario · MARFYL
            </p>
          </div>
          <button
            type="button"
            className="ai-icon-btn h-10 w-10"
            onClick={() => setHistoryOpen(true)}
            aria-label="Ver historial de conversaciones"
          >
            <History className="h-4 w-4 text-white" />
          </button>
          <button
            type="button"
            className="ai-icon-btn hidden h-10 w-10 sm:flex"
            aria-label="IA activa"
          >
            <Sparkles className="h-4 w-4 text-white" />
          </button>
          <button
            type="button"
            className="ai-icon-btn h-10 w-10"
            onClick={reset}
            aria-label="Limpiar conversación actual"
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
          'relative z-[1] flex min-h-0 w-full flex-1',
          variant === 'page' && 'lg:grid lg:grid-cols-[minmax(0,1fr)_min(260px,28%)]',
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="ai-chat-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4"
          >
            <div className="mt-auto flex flex-col gap-2">
              {onlyStarter && (
                <div className="ai-welcome mb-2 shrink-0">
                  <p className="text-sm leading-relaxed text-white/80">
                    {ASSISTANT_STARTER_MESSAGE.content}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Elija una acción rápida o escriba su consulta abajo. El historial se guarda en
                    este dispositivo.
                  </p>
                </div>
              )}
              {!onlyStarter &&
                messages.map((m, i) => (
                  <div
                    key={`${activeConversationId ?? 'local'}-${i}-${m.content.slice(0, 16)}`}
                    className="flex flex-col gap-2"
                  >
                    {m.role === 'assistant' && m.auditWarnings && m.auditWarnings.length > 0 && (
                      <AssistantAuditWarnings warnings={m.auditWarnings} />
                    )}
                    <ChatBubble content={m.content} isUser={m.role === 'user'} />
                  </div>
                ))}
              {loading && streamingText && <StreamBubble content={streamingText} />}
              {loading && !streamingText && <TypingIndicator label={loadingLabel} />}
              {error && (
                <div className="space-y-2 rounded-xl border border-red-400/35 bg-red-950/50 px-3 py-2.5 text-sm text-red-100">
                  <p>{error}</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-200/90 underline hover:text-white"
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
          </div>

          {showScrollDown && (
            <button
              type="button"
              onClick={() => {
                stickToBottomRef.current = true;
                scrollToBottom('smooth');
              }}
              className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white/80 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Ir al final de la conversación"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Ir al final
            </button>
          )}

          <div className="shrink-0 space-y-2.5 border-t border-white/5 bg-black/25 px-3 pb-3 pt-2 backdrop-blur-sm sm:px-4 sm:pb-4">
            {(onlyStarter || error) && (
              <div className="ai-chips-scroll flex gap-2 overflow-x-auto pb-0.5">
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
              onNewConversation={handleNewConversation}
              disabled={loading}
              sending={loading}
            />
          </div>
        </div>

        {variant === 'page' && (
          <aside className="ai-chat-scroll hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-white/10 p-4 lg:flex">
            <AssistantSummaryCard />
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                Conversaciones recientes
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto ai-chat-scroll">
                {conversations.slice(0, 8).map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        conv.id === activeConversationId
                          ? 'bg-[hsl(var(--dm-b-accent)/0.15)] text-white'
                          : 'text-white/65 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <span className="block truncate font-medium">{conv.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="mt-2 w-full text-left text-[11px] text-[hsl(var(--dm-b-accent))] underline"
              >
                Ver todo el historial
              </button>
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Acciones sugeridas según su módulo fiscal. Los datos en vivo requieren perfil y
              backend activo.
            </p>
          </aside>
        )}
      </div>

      {userId && (
        <AssistantHistoryPanel
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
        />
      )}
    </div>
  );
}
