'use client';

import { AssistantPanel } from '@/components/assistant/assistant-panel';

export default function AssistantPage() {
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full overflow-hidden rounded-none lg:rounded-2xl lg:ring-1 lg:ring-[hsl(var(--dm-b-accent)/0.25)] dm-elev-md">
      <AssistantPanel variant="page" className="flex-1 min-h-0" />
    </div>
  );
}
