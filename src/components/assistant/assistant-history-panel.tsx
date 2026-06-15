'use client';

import { MessageSquarePlus, Trash2, History } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AssistantConversation } from './assistant-chat-storage';

function formatConversationDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

export function AssistantHistoryPanel({
  open,
  onOpenChange,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: AssistantConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="ai-history-sheet z-[110] flex w-[min(100vw,22rem)] flex-col border-r border-white/10 bg-[hsl(0_0%_8%/0.98)] p-0 text-white"
      >
        <SheetHeader className="shrink-0 border-b border-white/10 px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base text-white">
            <History className="h-4 w-4 text-[hsl(var(--dm-b-accent))]" />
            Historial de chats
          </SheetTitle>
          <SheetDescription className="text-xs text-white/50">
            Sus conversaciones se guardan en este dispositivo y mantienen el contexto al
            reabrirlas.
          </SheetDescription>
        </SheetHeader>

        <div className="shrink-0 border-b border-white/10 p-3">
          <button
            type="button"
            onClick={() => {
              onNew();
              onOpenChange(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--dm-b-accent)/0.35)] bg-[hsl(var(--dm-b-accent)/0.12)] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--dm-b-accent)/0.2)]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nueva conversación
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto ai-chat-scroll px-2 py-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-white/45">Sin conversaciones guardadas.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeId;
                const messageCount = conv.messages.filter((m) => m.role === 'user').length;
                return (
                  <li key={conv.id}>
                    <div
                      className={cn(
                        'group flex items-stretch gap-1 rounded-xl border transition-colors',
                        isActive
                          ? 'border-[hsl(var(--dm-b-accent)/0.45)] bg-[hsl(var(--dm-b-accent)/0.12)]'
                          : 'border-transparent hover:border-white/10 hover:bg-white/5',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(conv.id);
                          onOpenChange(false);
                        }}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <p className="truncate text-sm font-medium text-white/90">{conv.title}</p>
                        <p className="mt-0.5 text-[11px] text-white/45">
                          {formatConversationDate(conv.updatedAt)}
                          {messageCount > 0 && (
                            <>
                              {' · '}
                              {messageCount} mensaje{messageCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="flex shrink-0 items-center justify-center px-2 text-white/30 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                        aria-label={`Eliminar ${conv.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
