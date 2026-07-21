'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/lib/config/api-config';

type Options = {
  enabled?: boolean;
  /** Reproducir beep suave al recibir comanda nueva */
  playSound?: boolean;
  onCreated?: (payload: unknown) => void;
  onUpdated?: (payload: unknown) => void;
};

function softBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.26);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    // ignore
  }
}

/**
 * Escucha eventos de comanda en el namespace /chat (room org_*).
 */
export function useComandaSocket(options: Options = {}) {
  const {
    enabled = true,
    playSound = false,
    onCreated,
    onUpdated,
  } = options;
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const orgId =
    useAuthStore((s) => s.selectedOrganizationId) ||
    useAuthStore((s) => s.selectedCompanyId);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !token || !orgId) return;

    const socketUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const socket = io(`${socketUrl}/chat`, {
      auth: { token, organizationId: orgId },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['floor-orders'] });
    };

    socket.on('comanda:created', (payload) => {
      invalidate();
      if (playSound) softBeep();
      onCreated?.(payload);
    });
    socket.on('comanda:updated', (payload) => {
      invalidate();
      onUpdated?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token, orgId, playSound, queryClient, onCreated, onUpdated]);
}
