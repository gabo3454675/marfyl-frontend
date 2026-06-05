'use client';

/**
 * StreamingChat Component
 * 
 * Enhanced chat component with real-time streaming support via WebSocket.
 * Uses the useGeminiChat hook for streaming responses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, MoreHorizontal, Sparkles, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { ChatBubble, TypingIndicator, StreamBubble } from './chat-bubble';
import { AssistantSummaryCard } from './assistant-summary-card';
import { AssistantComposer } from './assistant-composer';
import { cn } from '@/lib/utils';
import { DmAmbientMotion } from '@/components/ui/dm-ambient-motion';
import { ChatMessage } from '@/lib/api/assistant';

// ============================================
// Context builder
// ============================================

function buildContext(pathname: string): string {
  if (pathname.startsWith('/fiscal')) return 'Usuario en módulo Fiscal MARFYL';
  if (pathname.startsWith('/pos')) return 'Usuario en POS';
  if (pathname.startsWith('/invoices')) return 'Usuario en Facturas';
  if (pathname.startsWith('/assistant')) return 'Usuario en pantalla dedicada del Asistente IA';
  return 'Usuario en dashboard MARFYL';
}

// ============================================
// Quick prompts
// ============================================

const QUICK_PROMPTS = [
  'Resumen del dashboard',
  'Productos con stock bajo',
  'Calendario fiscal actual',
  'Estado de facturas',
] as const;

const STARTER_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hola, soy MARFYL Assistant, tu copiloto inteligente. Puedo ayudarte con POS, facturas, inventario, gastos y el módulo fiscal. ¿En qué puedo ayudarte hoy?',
};

// ============================================
// Component Props
// ============================================

export interface StreamingChatProps {
  className?: string;
  variant?: 'sheet' | 'page' | 'fab';
  contextModule?: string;
  initialContext?: string;
}

// ============================================
// Component
// ============================================

export function StreamingChat({
  className,
  variant = 'sheet',
  contextModule,
  initialContext,
}: StreamingChatProps) {
  const pathname = usePathname() ?? '/';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // Build context
  const currentContext = contextModule || buildContext(pathname);

  // Use the streaming chat hook
  const {
    messages,
    isLoading,
    isTyping,
    streamingText,
    error,
    sendMessage,
    clearHistory,
    isConnected,
  } = useGeminiChat({
    context: currentContext,
    useWebSocket: true,
    onStreamEnd: (fullReply) => {
      console.log('Stream complete:', fullReply.length, 'chars');
    },
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });

  // Initialize with starter message if empty
  const displayMessages = messages.length === 0 ? [STARTER_MESSAGE] : messages;

  // Scroll to bottom on new messages
  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages.length, streamingText, isLoading, scrollDown]);

  // Send message handler
  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  // Reset handler
  const handleReset = () => {
    clearHistory();
    setInput('');
  };

  // Quick prompt fill
  const fillPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const onlyStarter = displayMessages.length === 1 && displayMessages[0]?.role === 'assistant';

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
              <h2 className="text-base sm:text-lg font-bold text-white truncate">MARFYL Assistant</h2>
              <span className="ai-badge-seniat shrink-0">AI</span>
              {/* Connection status */}
              <span className={cn(
                'shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
                isConnected 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400'
              )}>
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>REST</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/60 mt-0.5 truncate">
              Copiloto inteligente MARFYL · {currentContext}
            </p>
          </div>
          <button type="button" className="ai-icon-btn h-10 w-10 hidden sm:flex" aria-label="IA activa">
            <Sparkles className="h-4 w-4 text-white" />
          </button>
          <button
            type="button"
            className="ai-icon-btn h-10 w-10"
            onClick={handleReset}
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

      <div className={cn(
        'relative z-[1] flex flex-1 min-h-0 w-full',
        variant === 'page' && 'lg:grid lg:grid-cols-[minmax(0,1fr)_min(260px,28%)]',
      )}>
        <div className="flex flex-1 flex-col min-h-0 min-w-0">
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 ai-chat-scroll flex flex-col justify-end gap-2"
          >
            {onlyStarter && (
              <div className="ai-welcome mb-2 shrink-0">
                <p className="text-sm text-white/80 leading-relaxed">{STARTER_MESSAGE.content}</p>
                <p className="text-xs text-white/45 mt-2">
                  Elija una acción rápida o escriba su consulta abajo.
                </p>
              </div>
            )}

            {/* Render messages */}
            {!onlyStarter && displayMessages.map((m, i) => (
              <ChatBubble
                key={`${i}-${m.content.slice(0, 16)}`}
                content={m.content}
                isUser={m.role === 'user'}
              />
            ))}

            {/* Streaming text (in progress) */}
            {isLoading && streamingText && (
              <StreamBubble content={streamingText} />
            )}

            {/* Typing indicator */}
            {(isLoading && !streamingText) && <TypingIndicator />}
            
            {/* Connection status typing */}
            {isTyping && !isLoading && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Usuario está escribiendo...</span>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="rounded-xl border border-red-400/35 bg-red-950/50 px-3 py-2.5 text-sm text-red-100 space-y-2">
                <p>{error}</p>
                <button
                  type="button"
                  className="text-xs font-medium underline text-red-200/90 hover:text-white"
                  onClick={handleReset}
                >
                  Reiniciar conversación
                </button>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-2.5 border-t border-white/5 bg-black/20 backdrop-blur-sm">
            {/* Quick prompts */}
            {(onlyStarter || error) && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 ai-chips-scroll">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-chip shrink-0"
                    disabled={isLoading}
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
              onSend={() => handleSend(input)}
              onReset={handleReset}
              disabled={isLoading}
              sending={isLoading}
            />
          </div>
        </div>

        {/* Sidebar for page variant */}
        {variant === 'page' && (
          <aside className="hidden lg:flex flex-col gap-3 p-4 border-l border-white/10 min-h-0 overflow-y-auto ai-chat-scroll">
            <AssistantSummaryCard />
            <p className="text-xs text-white/50 leading-relaxed">
              Acciones sugeridas según su módulo actual. Los datos en vivo requieren perfil y backend activo.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

// ============================================
// Export
// ============================================

export default StreamingChat;