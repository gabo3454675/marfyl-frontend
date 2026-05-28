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

export function TypingIndicator() {
  return (
    <div className="flex justify-start px-1">
      <div className="ai-typing-pill px-3.5 py-2 text-sm text-white/60">Escribiendo…</div>
    </div>
  );
}
