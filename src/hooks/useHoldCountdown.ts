'use client';

import { useEffect, useState } from 'react';

/** Cuenta regresiva legible hasta heldUntil (ISO). */
export function useHoldCountdown(heldUntil: string | null | undefined) {
  const [label, setLabel] = useState<string>('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!heldUntil) {
      setLabel('');
      setExpired(false);
      return;
    }

    const tick = () => {
      const ms = new Date(heldUntil).getTime() - Date.now();
      if (ms <= 0) {
        setLabel('Reserva expirada');
        setExpired(true);
        return;
      }
      setExpired(false);
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setLabel(`${min}:${sec.toString().padStart(2, '0')}`);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [heldUntil]);

  return { label, expired };
}
