import type { ReactNode } from 'react';

/** Boletería pública: fondo oscuro fijo, independiente del tema del panel MARFYL. */
export default function ConcertPublicLayout({ children }: { children: ReactNode }) {
  return <div className="concert-root dark min-h-[100dvh]">{children}</div>;
}
