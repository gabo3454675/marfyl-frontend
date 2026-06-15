import type { ChatMessage } from '@/lib/api/assistant';
import { ASSISTANT_STARTER } from './assistant-tokens';

const LEGACY_STORAGE_PREFIX = 'marfyl-assistant-chat';
const STORAGE_PREFIX = 'marfyl-assistant-threads';
const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES_PER_CONVERSATION = 100;

export const ASSISTANT_STARTER_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: ASSISTANT_STARTER,
};

export type AssistantConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type AssistantThreadStore = {
  version: 2;
  activeConversationId: string;
  conversations: AssistantConversation[];
};

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}-${userId}`;
}

function legacyStorageKey(userId: number) {
  return `${LEGACY_STORAGE_PREFIX}-${userId}`;
}

function newConversationId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [ASSISTANT_STARTER_MESSAGE];
  const filtered = messages.filter(
    (m): m is ChatMessage =>
      !!m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0,
  );
  return filtered.length > 0 ? filtered : [ASSISTANT_STARTER_MESSAGE];
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'Nueva conversación';
  const text = firstUser.content.trim().replace(/\s+/g, ' ');
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

function createConversation(messages?: ChatMessage[]): AssistantConversation {
  const now = new Date().toISOString();
  const msgs = sanitizeMessages(messages ?? [ASSISTANT_STARTER_MESSAGE]);
  return {
    id: newConversationId(),
    title: deriveTitle(msgs),
    createdAt: now,
    updatedAt: now,
    messages: msgs,
  };
}

function trimConversation(conv: AssistantConversation): AssistantConversation {
  const messages = conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  return {
    ...conv,
    title: conv.title || deriveTitle(messages),
    messages,
    updatedAt: new Date().toISOString(),
  };
}

function emptyStore(): AssistantThreadStore {
  const conv = createConversation();
  return {
    version: 2,
    activeConversationId: conv.id,
    conversations: [conv],
  };
}

function migrateLegacy(userId: number): AssistantThreadStore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(legacyStorageKey(userId));
    if (!raw) return null;
    const messages = sanitizeMessages(JSON.parse(raw));
    const conv = createConversation(messages);
    localStorage.removeItem(legacyStorageKey(userId));
    const store: AssistantThreadStore = {
      version: 2,
      activeConversationId: conv.id,
      conversations: [trimConversation(conv)],
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
    return store;
  } catch {
    return null;
  }
}

function readStore(userId: number): AssistantThreadStore {
  if (typeof window === 'undefined') return emptyStore();

  const migrated = migrateLegacy(userId);
  if (migrated) return migrated;

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as AssistantThreadStore;
    if (
      parsed?.version !== 2 ||
      !Array.isArray(parsed.conversations) ||
      parsed.conversations.length === 0
    ) {
      return emptyStore();
    }
    const conversations = parsed.conversations
      .map((c) => ({
        ...c,
        messages: sanitizeMessages(c.messages),
        title: c.title || deriveTitle(sanitizeMessages(c.messages)),
      }))
      .slice(0, MAX_CONVERSATIONS);
    const activeConversationId = conversations.some((c) => c.id === parsed.activeConversationId)
      ? parsed.activeConversationId
      : conversations[0].id;
    return { version: 2, activeConversationId, conversations };
  } catch {
    return emptyStore();
  }
}

function writeStore(userId: number, store: AssistantThreadStore) {
  if (typeof window === 'undefined') return;
  try {
    const conversations = store.conversations
      .map(trimConversation)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_CONVERSATIONS);
    const activeConversationId = conversations.some((c) => c.id === store.activeConversationId)
      ? store.activeConversationId
      : conversations[0]?.id ?? store.activeConversationId;
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ version: 2, activeConversationId, conversations }),
    );
  } catch {
    /* quota or private mode */
  }
}

export function listAssistantConversations(userId: number): AssistantConversation[] {
  const store = readStore(userId);
  return [...store.conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getActiveConversation(userId: number): AssistantConversation {
  const store = readStore(userId);
  return (
    store.conversations.find((c) => c.id === store.activeConversationId) ??
    store.conversations[0] ??
    createConversation()
  );
}

export function loadAssistantHistory(userId: number): ChatMessage[] {
  return getActiveConversation(userId).messages;
}

export function saveAssistantHistory(userId: number, messages: ChatMessage[]) {
  const store = readStore(userId);
  const sanitized = sanitizeMessages(messages);
  const conversations = store.conversations.map((c) => {
    if (c.id !== store.activeConversationId) return c;
    return trimConversation({
      ...c,
      messages: sanitized,
      title: c.title === 'Nueva conversación' ? deriveTitle(sanitized) : c.title || deriveTitle(sanitized),
      updatedAt: new Date().toISOString(),
    });
  });
  writeStore(userId, { ...store, conversations });
}

export function switchAssistantConversation(userId: number, conversationId: string): ChatMessage[] {
  const store = readStore(userId);
  if (!store.conversations.some((c) => c.id === conversationId)) {
    return getActiveConversation(userId).messages;
  }
  writeStore(userId, { ...store, activeConversationId: conversationId });
  return getActiveConversation(userId).messages;
}

export function startNewAssistantConversation(userId: number): ChatMessage[] {
  const store = readStore(userId);
  const conv = createConversation();
  const conversations = [conv, ...store.conversations].slice(0, MAX_CONVERSATIONS);
  writeStore(userId, {
    version: 2,
    activeConversationId: conv.id,
    conversations,
  });
  return conv.messages;
}

export function deleteAssistantConversation(userId: number, conversationId: string): ChatMessage[] {
  const store = readStore(userId);
  let conversations = store.conversations.filter((c) => c.id !== conversationId);
  if (conversations.length === 0) {
    const conv = createConversation();
    conversations = [conv];
    writeStore(userId, { version: 2, activeConversationId: conv.id, conversations });
    return conv.messages;
  }
  const activeConversationId =
    store.activeConversationId === conversationId
      ? conversations[0].id
      : store.activeConversationId;
  writeStore(userId, { version: 2, activeConversationId, conversations });
  return getActiveConversation(userId).messages;
}

export function clearAssistantHistory(userId: number) {
  const store = readStore(userId);
  const cleared = trimConversation({
    ...getActiveConversation(userId),
    messages: [ASSISTANT_STARTER_MESSAGE],
    title: 'Nueva conversación',
    updatedAt: new Date().toISOString(),
  });
  const conversations = store.conversations.map((c) =>
    c.id === store.activeConversationId ? cleared : c,
  );
  writeStore(userId, { ...store, conversations });
}
