'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ChatBubble({
  content,
  isUser,
  className,
}: {
  content: string;
  isUser: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start', className)}
    >
      <div
        className={cn(
          'max-w-[min(300px,88%)] px-4 py-3.5 text-[15px] leading-relaxed text-white shadow-lg',
          isUser ? 'ai-bubble-user' : 'ai-bubble-assistant',
        )}
      >
        {content}
      </div>
    </motion.div>
  );
}

export function TypingIndicator({ label = 'Pensando…' }: { label?: string }) {
  return (
    <div className="flex justify-start px-1">
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
    </div>
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex w-full justify-start', className)}
    >
      <div className="ai-bubble-assistant max-w-[min(300px,88%)] px-4 py-3.5 text-[15px] leading-relaxed text-white shadow-lg">
        <span>{content}</span>
        <span className="ai-cursor ml-0.5" />
      </div>
    </motion.div>
  );
}
