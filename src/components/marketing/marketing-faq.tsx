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
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                {item.question}
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform text-blue-600', open && 'rotate-180')} />
              </button>
              {open && <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
