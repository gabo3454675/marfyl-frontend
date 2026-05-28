import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendAssistantMessage(
  message: string,
  history: ChatMessage[],
  context?: string,
) {
  const res = await apiClient.post<{ reply: string; model: string }>('/assistant/chat', {
    message,
    history,
    context,
  });
  return res.data;
}
