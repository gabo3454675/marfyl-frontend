'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MarketingReveal,
  MarketingStagger,
  MarketingStaggerItem,
} from '@/components/marketing/marketing-reveal';

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
      <MarketingReveal variant="fade-up">
        <h2 className="marketing-section-title text-center mb-8 sm:mb-10">{title}</h2>
      </MarketingReveal>
      <MarketingStagger className="max-w-2xl mx-auto space-y-3">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <MarketingStaggerItem key={item.id}>
              <div className="marketing-faq-item">
              <button
                type="button"
                className="marketing-faq-trigger"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                {item.question}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform text-[#10b981]',
                    open && 'rotate-180',
                  )}
                />
              </button>
              {open && <p className="marketing-faq-answer">{item.answer}</p>}
              </div>
            </MarketingStaggerItem>
          );
        })}
      </MarketingStagger>
    </section>
  );
}
