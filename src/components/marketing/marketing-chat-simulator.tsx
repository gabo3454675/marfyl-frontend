'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const RESPONSES: Record<string, string> = {
  '¿Qué sanción aplica por declarar IVA con 3 días de retraso siendo Contribuyente Especial?':
    '**ALERTA DE RIESGO CRÍTICO**\n\nEl retraso en la declaración del IVA califica como un ilícito material según el **Artículo 101 del Código Orgánico Tributario**.\n\n• **Sanción aplicable:** Multa equivalente al 100% del tributo omitido, calculada al tipo de cambio oficial de mayor valor publicado por el BCV.\n• **Para Contribuyentes Especiales:** El calendario es diferenciado (Art. 102 COT). El retraso de 3 días hábiles elimina la posibilidad de pago voluntario sin recargos.\n\n**Plan de mitigación:**\n1. Realice el pago inmediato vía portal SENIAT para invocar circunstancias atenuantes (Art. 94 COT).\n2. Active alertas automáticas de vencimiento para evitar reincidencia (Art. 93 COT — reincidencia agrava la sanción).',
  '¿Puedo emitir facturas en Excel sin máquina fiscal bajo la Providencia 0071?':
    '**NO.** La **Providencia SNAT/2011/0071** es categórica:\n\nLos contribuyentes están obligados a emitir facturas únicamente a través de **sistemas automatizados autorizados por el SENIAT** o mediante **máquinas fiscales**.\n\n• Emitir facturas en formatos libres (Excel, Word, PDF no controlado) constituye un **incumplimiento de requisitos formales**.\n• **Riesgo:** Clausura del establecimiento por 3 días hábiles (Art. 99 COT) y multa de hasta **150 UT**.\n\n**Recomendación:**\n1. Regularice inmediatamente su sistema de facturación.\n2. Marfyl puede emitir facturas electrónicas conformes con la Providencia 0071 desde el primer día.',
  '¿Qué pasa si no retengo el ISLR a mi proveedor?':
    '**ALERTA DE RIESGO CRÍTICO**\n\nLa omisión de retención de ISLR constituye un **ilícito material** sancionado bajo el **Artículo 104 del COT**.\n\n• **Sanción:** Equivalente al **100% del monto no retenido**, más actualización monetaria por indexación BCV.\n• **Responsabilidad solidaria:** El agente de retención (su empresa) responde directamente ante el SENIAT.\n\n**Plan de mitigación:**\n1. Efectúe el pulo voluntario de las cantidades no retenidas de inmediato.\n2. Configure las reglas de retención en su sistema de compras para que sea automática en cada factura de proveedor.',
};

const TYPING_SPEED_MS = 12;

export function MarketingChatSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showLatency, setShowLatency] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const handleQuestionClick = useCallback(
    async (question: string) => {
      if (isStreaming) return;

      setSelectedQuestion(question);
      setShowLatency(false);
      setMessages((prev) => [...prev, { role: 'user', content: question }]);

      const response = RESPONSES[question];
      if (!response) return;

      setIsStreaming(true);
      setStreamingText('');
      startTimeRef.current = performance.now();

      let accumulated = '';
      const chars = response.split('');

      for (let i = 0; i < chars.length; i++) {
        await new Promise((r) => setTimeout(r, TYPING_SPEED_MS));
        accumulated += chars[i];
        setStreamingText(accumulated);

        if (i === 15) {
          const elapsed = Math.round(performance.now() - startTimeRef.current);
          if (elapsed < 200) {
            setShowLatency(true);
          }
        }
      }

      const finalElapsed = Math.round(
        performance.now() - startTimeRef.current,
      );
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response },
      ]);
      setStreamingText('');
      setIsStreaming(false);
      setShowLatency(true);
    },
    [isStreaming],
  );

  return (
    <div className="markyl-chat-simulator">
      <div className="markyl-chat-header">
        <div className="markyl-chat-header-left">
          <span className="markyl-chat-avatar">M</span>
          <div>
            <div className="markyl-chat-title">Marfyl</div>
            <div className="markyl-chat-status">Asesor Fiscal Proactivo</div>
          </div>
        </div>
        {showLatency && (
          <div className="markyl-chat-badge">
            Llama 3.3 · 100% Precisión Legal · {Math.round(performance.now() - (startTimeRef.current || performance.now())) + 140}ms
          </div>
        )}
      </div>

      <div className="markyl-chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="markyl-chat-welcome">
            <p className="mb-2 text-sm font-medium leading-snug sm:text-center">
              Toca una consulta para ver a Marfyl en acción:
            </p>
            <div className="flex flex-col gap-2">
              {Object.keys(RESPONSES).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuestionClick(q)}
                  className="markyl-chat-question-btn"
                >
                  <span className="text-xs opacity-70" aria-hidden>
                    ❯
                  </span>
                  <span className="line-clamp-3 text-left">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`markyl-chat-message markyl-chat-message--${msg.role}`}
          >
            {msg.role === 'assistant' && (
              <div className="markyl-chat-message-avatar">M</div>
            )}
            <div className="markyl-chat-bubble">
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isStreaming && streamingText && (
          <div className="markyl-chat-message markyl-chat-message--assistant">
            <div className="markyl-chat-message-avatar">M</div>
            <div className="markyl-chat-bubble markyl-chat-bubble--streaming">
              {streamingText.split('\n').map((line, j) => (
                <p key={j}>
                  {line}
                  {j === streamingText.split('\n').length - 1 && (
                    <span className="markyl-chat-cursor" />
                  )}
                </p>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
