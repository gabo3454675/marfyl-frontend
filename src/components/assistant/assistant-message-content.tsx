'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function AssistantMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.split('\n');

  return (
    <div className={cn('ai-message-content space-y-2 break-words text-[15px] leading-relaxed', className)}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-0.5" aria-hidden />;
        }
        const isBullet = /^[-•*]\s+/.test(trimmed);
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2.5 pl-0.5">
              <span className="mt-0.5 shrink-0 text-[hsl(var(--dm-b-accent))]" aria-hidden>
                •
              </span>
              <span className="min-w-0 flex-1 text-white/90">{formatInline(trimmed.replace(/^[-•*]\s+/, ''))}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-white/90">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
