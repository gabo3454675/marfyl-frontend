import type { ChatMessage } from '@/lib/api/assistant';
import { ASSISTANT_STARTER } from './assistant-tokens';

const STORAGE_PREFIX = 'marfyl-assistant-chat';
const MAX_STORED_MESSAGES = 50;

export const ASSISTANT_STARTER_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: ASSISTANT_STARTER,
};

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}-${userId}`;
}

export function loadAssistantHistory(userId: number): ChatMessage[] {
  if (typeof window === 'undefined') return [ASSISTANT_STARTER_MESSAGE];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [ASSISTANT_STARTER_MESSAGE];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [ASSISTANT_STARTER_MESSAGE];
    return parsed.filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    );
  } catch {
    return [ASSISTANT_STARTER_MESSAGE];
  }
}

export function saveAssistantHistory(userId: number, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch {
    /* quota or private mode */
  }
}

export function clearAssistantHistory(userId: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
