/**
 * useGeminiChat Hook
 * 
 * React hook for chat interaction with Marfyl Gemini assistant.
 * Supports both REST API and WebSocket streaming.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/lib/config/api-config';
import { sendAssistantMessage, ChatMessage } from '@/lib/api/assistant';

// ============================================
// Types
// ============================================

export interface UseGeminiChatOptions {
  /** Organization ID for context */
  organizationId?: number;
  /** Initial context for the chat */
  context?: string;
  /** Enable WebSocket streaming (default: true) */
  useWebSocket?: boolean;
  /** WebSocket URL (defaults to API_BASE_URL) */
  wsUrl?: string;
  /** Maximum history messages to keep */
  maxHistory?: number;
  /** Callback when message is received */
  onMessage?: (message: string) => void;
  /** Callback when streaming starts */
  onStreamStart?: () => void;
  /** Callback when streaming ends */
  onStreamEnd?: (fullReply: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export interface UseGeminiChatReturn {
  /** Current messages in the conversation */
  messages: ChatMessage[];
  /** Whether the assistant is currently processing */
  isLoading: boolean;
  /** Whether the user is typing */
  isTyping: boolean;
  /** Current streaming text (partial) */
  streamingText: string;
  /** Error message if any */
  error: string | null;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Clear the conversation history */
  clearHistory: () => void;
  /** Update context */
  setContext: (context: string) => void;
  /** Socket connection status */
  isConnected: boolean;
}

// ============================================
// Message type guard
// ============================================

function isValidMessage(msg: unknown): msg is ChatMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'role' in msg &&
    'content' in msg &&
    (msg.role === 'user' || msg.role === 'assistant')
  );
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for Gemini chat with streaming support
 */
export function useGeminiChat(options: UseGeminiChatOptions = {}): UseGeminiChatReturn {
  const {
    organizationId,
    context,
    useWebSocket = true,
    wsUrl,
    maxHistory = 50,
    onMessage,
    onStreamStart,
    onStreamEnd,
    onError,
  } = options;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auth state
  const token = useAuthStore((s) => s.token);
  const selectedOrganizationId = useAuthStore((s) => s.selectedOrganizationId) ?? organizationId;

  // WebSocket URL
  const socketUrl = wsUrl || API_BASE_URL.replace('/api', '');

  // ============================================
  // WebSocket Connection
  // ============================================

  useEffect(() => {
    if (!useWebSocket) return;

    const socket = io(`${socketUrl}/chat`, {
      auth: {
        token: token || '',
        organizationId: selectedOrganizationId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Error de conexión: ${err.message}`);
    });

    // Message handler
    socket.on('event', (event: { type: string; payload: unknown }) => {
      switch (event.type) {
        case 'connected':
          setIsConnected(true);
          break;

        case 'message':
          const msgPayload = event.payload as { chunk?: string; done?: boolean; fullReply?: string; model?: string };
          if (msgPayload.chunk !== undefined) {
            setStreamingText((prev) => prev + (msgPayload.chunk || ''));
          }
          if (msgPayload.done) {
            setIsLoading(false);
            if (msgPayload.fullReply) {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: msgPayload.fullReply! },
              ]);
              onStreamEnd?.(msgPayload.fullReply);
            }
          }
          break;

        case 'typing':
          const typingPayload = event.payload as { isTyping: boolean };
          setIsTyping(typingPayload.isTyping);
          break;

        case 'tool_call':
          // Optional: handle tool calls for UI feedback
          break;

        case 'error':
          const errorPayload = event.payload as { message: string };
          setIsLoading(false);
          setError(errorPayload.message);
          onError?.(errorPayload.message);
          break;
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [useWebSocket, socketUrl, token, selectedOrganizationId, onStreamEnd, onError]);

  // ============================================
  // Send Message
  // ============================================

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Cancel any ongoing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Add user message
      const userMessage: ChatMessage = { role: 'user', content };
      setMessages((prev) => [...prev.slice(-(maxHistory - 1)), userMessage]);
      setIsLoading(true);
      setError(null);
      setStreamingText('');
      onStreamStart?.();

      try {
        if (useWebSocket && socketRef.current?.connected) {
          // WebSocket streaming
          socketRef.current.emit('message', {
            message: content,
            history: messages.slice(-8),
            context,
            orgName: undefined,
            userRole: undefined,
          });
        } else {
          // REST API fallback
          const history = messages.slice(-8);
          const response = await sendAssistantMessage(content, history, context);

          // Add assistant response
          const assistantMessage: ChatMessage = { role: 'assistant', content: response.reply };
          setMessages((prev) => [...prev, assistantMessage]);
          onMessage?.(response.reply);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
        setStreamingText('');
      }
    },
    [messages, context, maxHistory, useWebSocket, onMessage, onStreamStart, onError],
  );

  // ============================================
  // Clear History
  // ============================================

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingText('');

    // Clear server-side history if using WebSocket
    if (sessionIdRef.current) {
      socketRef.current?.emit('clear_history', sessionIdRef.current);
      sessionIdRef.current = null;
    }
  }, []);

  // ============================================
  // Set Context
  // ============================================

  const setContext = useCallback((newContext: string) => {
    // Context is passed to the API on each message
    // This is just for the local option state if needed
  }, []);

  // ============================================
  // Cleanup on unmount
  // ============================================

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      socketRef.current?.disconnect();
    };
  }, []);

  // ============================================
  // Return
  // ============================================

  return {
    messages,
    isLoading,
    isTyping,
    streamingText,
    error,
    sendMessage,
    clearHistory,
    setContext,
    isConnected,
  };
}

// ============================================
// Simplified hook for basic usage
// ============================================

/**
 * Simplified hook for basic chat without WebSocket
 */
export function useGeminiChatSimple() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, context?: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.slice(-8);
      const response = await sendAssistantMessage(content, history, context);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  };
}