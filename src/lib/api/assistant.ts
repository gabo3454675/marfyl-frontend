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
