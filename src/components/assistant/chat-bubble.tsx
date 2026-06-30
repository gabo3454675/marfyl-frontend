'use client';

import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AssistantMessageContent } from './assistant-message-content';

const CHAT_EASE = [0.22, 1, 0.36, 1] as const;

const CHAT_TRANSITION: Transition = {
  duration: 0.3,
  ease: CHAT_EASE,
};

const CHAT_EXIT_TRANSITION: Transition = {
  duration: 0.22,
  ease: CHAT_EASE,
};

function bubbleVariants(isUser: boolean) {
  return {
    initial: {
      opacity: 0,
      scale: 0.94,
      x: isUser ? 14 : -14,
      y: 8,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      x: isUser ? 10 : -10,
      y: -6,
    },
  };
}

export function ChatBubble({
  content,
  isUser,
  className,
  animated = true,
}: {
  content: string;
  isUser: boolean;
  className?: string;
  /** Desactiva motion cuando el contenedor padre ya anima la fila */
  animated?: boolean;
}) {
  const reduce = useReducedMotion();
  const bubble = (
    <div
      className={cn(
        'max-w-[min(100%,22rem)] px-4 py-3.5 shadow-lg sm:max-w-[min(100%,26rem)]',
        isUser ? 'ai-bubble-user text-[15px] leading-relaxed text-white' : 'ai-bubble-assistant',
      )}
    >
      {isUser ? (
        <p className="whitespace-pre-wrap break-words">{content}</p>
      ) : (
        <AssistantMessageContent content={content} />
      )}
    </div>
  );

  const rowClass = cn('flex w-full', isUser ? 'justify-end' : 'justify-start', className);

  if (!animated || reduce) {
    return <div className={rowClass}>{bubble}</div>;
  }

  const variants = bubbleVariants(isUser);

  return (
    <motion.div
      layout="position"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={CHAT_TRANSITION}
      className={rowClass}
    >
      {bubble}
    </motion.div>
  );
}

export function TypingIndicator({ label = 'Pensando…' }: { label?: string }) {
  const reduce = useReducedMotion();

  const content = (
    <div className="ai-typing-pill flex items-center gap-2 px-3.5 py-2 text-sm text-white/65">
      <span key={label} className="ai-loading-label">
        {label}
      </span>
      <span className="ai-typing-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
    </div>
  );

  if (reduce) {
    return <div className="flex justify-start px-1">{content}</div>;
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.94, transition: CHAT_EXIT_TRANSITION }}
      transition={CHAT_TRANSITION}
      className="flex justify-start px-1"
    >
      {content}
    </motion.div>
  );
}

/**
 * Streaming bubble - shows content as it streams in
 */
export function StreamBubble({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const bubble = (
    <div className="ai-bubble-assistant max-w-[min(100%,22rem)] px-4 py-3.5 shadow-lg sm:max-w-[min(100%,26rem)]">
      <AssistantMessageContent content={content} />
      <span className="ai-cursor ml-0.5 inline-block align-baseline" />
    </div>
  );

  if (reduce) {
    return <div className={cn('flex w-full justify-start', className)}>{bubble}</div>;
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: -12, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, y: -4, scale: 0.92, transition: CHAT_EXIT_TRANSITION }}
      transition={CHAT_TRANSITION}
      className={cn('flex w-full justify-start', className)}
    >
      {bubble}
    </motion.div>
  );
}

export function ChatWelcome({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key="chat-welcome"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96, transition: CHAT_EXIT_TRANSITION }}
      transition={CHAT_TRANSITION}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ChatMessageRow({
  isUser,
  children,
  className,
}: {
  isUser: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const variants = bubbleVariants(isUser);

  return (
    <motion.div
      layout="position"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={CHAT_TRANSITION}
      className={className}
    >
      {children}
    </motion.div>
  );
}
