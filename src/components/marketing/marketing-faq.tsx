'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingFaq({
  title = 'Preguntas frecuentes',
  items,
}: {
  title?: string;
  items: readonly { id: string; question: string; answer: string }[];
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section className="marketing-section marketing-container">
      <h2 className="marketing-section-title text-center mb-8 sm:mb-10">{title}</h2>
      <div className="max-w-2xl mx-auto space-y-3">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="marketing-faq-item">
              <button
                type="button"
                className="marketing-faq-trigger"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                {item.question}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform text-[hsl(var(--marketing-accent))]',
                    open && 'rotate-180',
                  )}
                />
              </button>
              {open && <p className="marketing-faq-answer">{item.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
