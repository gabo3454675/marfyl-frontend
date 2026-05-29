import type { ReactNode } from 'react';

export default function ConcertPublicLayout({ children }: { children: ReactNode }) {
  return <div className="concert-root">{children}</div>;
}
