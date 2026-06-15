import { API_BASE_URL } from '@/lib/config/api-config';
import { FISCAL_PREVIEW_TOKEN, isFiscalPreviewMode } from '@/lib/fiscal-preview';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantSwitchOrganization {
  access_token: string;
  organizationId: number;
  organizationName: string;
}

export interface AssistantChatResponse {
  reply: string;
  model: string;
  switchOrganization?: AssistantSwitchOrganization;
}

type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_round' }
  | {
      type: 'done';
      reply: string;
      model: string;
      switchOrganization?: AssistantSwitchOrganization;
    }
  | { type: 'error'; message: string };

function getApiUrl(): string {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { __NEXT_PUBLIC_API_URL__?: string }).__NEXT_PUBLIC_API_URL__
  ) {
    return (window as unknown as { __NEXT_PUBLIC_API_URL__: string }).__NEXT_PUBLIC_API_URL__;
  }
  return API_BASE_URL;
}

function buildAssistantHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window === 'undefined') return headers;

  const token =
    localStorage.getItem('auth_token') ||
    (isFiscalPreviewMode() ? FISCAL_PREVIEW_TOKEN : null);
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const store = useAuthStore.getState();
    const selectedOrganizationId = store.selectedOrganizationId || store.selectedCompanyId;
    if (selectedOrganizationId) {
      headers['x-tenant-id'] = selectedOrganizationId.toString();
    }
  } catch {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage) as {
          state?: { selectedCompanyId?: number };
        };
        const selectedCompanyId = authData?.state?.selectedCompanyId;
        if (selectedCompanyId) {
          headers['x-tenant-id'] = selectedCompanyId.toString();
        }
      }
    } catch {
      // no-op
    }
  }

  return headers;
}

export interface AuditWarning {
  code: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  accionMarfyl?: string;
  referenciaLegal?: string;
}

type AdvisorStreamEvent =
  | { type: 'audit_warnings'; warnings: AuditWarning[] }
  | {
      type: 'knowledge';
      articles: Array<{
        ley: string;
        leyLabel: string;
        articulo: number;
        excerpt: string;
        similarity: number;
      }>;
    }
  | { type: 'delta'; text: string }
  | { type: 'done'; model: string }
  | { type: 'error'; message: string };

function parseAdvisorSseChunk(buffer: string): { events: AdvisorStreamEvent[]; rest: string } {
  const events: AdvisorStreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';

  for (const part of parts) {
    const line = part.split('\n').find((l) => l.startsWith('data: '));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as AdvisorStreamEvent);
    } catch {
      // ignore
    }
  }
  return { events, rest };
}

export async function sendFiscalAdvisorStream(
  mensajeUsuario: string,
  handlers: {
    onDelta?: (text: string) => void;
    onWarnings?: (warnings: AuditWarning[]) => void;
    onKnowledge?: (count: number) => void;
  } = {},
): Promise<{ reply: string; model: string; warnings: AuditWarning[] }> {
  const response = await fetch(`${getApiUrl()}/assistant/advisor/stream`, {
    method: 'POST',
    headers: buildAssistantHeaders(),
    credentials: 'include',
    body: JSON.stringify({ mensajeUsuario }),
  });

  if (!response.ok) {
    let messageText = 'Error de conexión con el asesor fiscal.';
    try {
      const data = (await response.json()) as { message?: string | string[] };
      messageText = Array.isArray(data.message)
        ? data.message.join(' ')
        : data.message ?? messageText;
    } catch {
      // keep default
    }
    throw new Error(messageText);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('El servidor no devolvió un stream de respuesta.');

  const decoder = new TextDecoder();
  let buffer = '';
  let reply = '';
  let model = '';
  let warnings: AuditWarning[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseAdvisorSseChunk(buffer);
    buffer = parsed.rest;

    for (const event of parsed.events) {
      if (event.type === 'audit_warnings') {
        warnings = event.warnings;
        handlers.onWarnings?.(event.warnings);
      } else if (event.type === 'knowledge') {
        handlers.onKnowledge?.(event.articles.length);
      } else if (event.type === 'delta') {
        reply += event.text;
        handlers.onDelta?.(event.text);
      } else if (event.type === 'done') {
        model = event.model;
      } else if (event.type === 'error') {
        throw new Error(event.message);
      }
    }
  }

  return { reply, model, warnings };
}

function parseSseChunk(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';

  for (const part of parts) {
    const line = part
      .split('\n')
      .find((l) => l.startsWith('data: '));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as StreamEvent);
    } catch {
      // ignore malformed chunks
    }
  }

  return { events, rest };
}

export async function sendAssistantMessage(
  message: string,
  history: ChatMessage[],
  context?: string,
): Promise<AssistantChatResponse> {
  const res = await apiClient.post<AssistantChatResponse>('/assistant/chat', {
    message,
    history,
    context,
  });
  return res.data;
}

export async function sendAssistantMessageStream(
  message: string,
  history: ChatMessage[],
  context: string | undefined,
  handlers: {
    onDelta?: (text: string) => void;
    onToolRound?: () => void;
  } = {},
): Promise<AssistantChatResponse> {
  const response = await fetch(`${getApiUrl()}/assistant/chat/stream`, {
    method: 'POST',
    headers: buildAssistantHeaders(),
    credentials: 'include',
    body: JSON.stringify({ message, history, context }),
  });

  if (!response.ok) {
    let messageText = 'Error de conexión con el asistente.';
    try {
      const data = (await response.json()) as { message?: string | string[] };
      messageText = Array.isArray(data.message)
        ? data.message.join(' ')
        : data.message ?? messageText;
    } catch {
      // keep default
    }
    throw new Error(messageText);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('El servidor no devolvió un stream de respuesta.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let reply = '';
  let model = '';
  let switchOrganization: AssistantSwitchOrganization | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const event of parsed.events) {
      if (event.type === 'delta') {
        reply += event.text;
        handlers.onDelta?.(event.text);
      } else if (event.type === 'tool_round') {
        reply = '';
        handlers.onToolRound?.();
      } else if (event.type === 'done') {
        reply = event.reply;
        model = event.model;
        switchOrganization = event.switchOrganization;
      } else if (event.type === 'error') {
        throw new Error(event.message);
      }
    }
  }

  return { reply, model, switchOrganization };
}
