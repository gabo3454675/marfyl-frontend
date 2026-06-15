import { useCallback, useEffect, useRef, useState } from 'react';

export const ASSISTANT_LOADING_PHASES = [
  'Pensando…',
  'Analizando los datos…',
  'Consultando normativa…',
  'Armando respuesta…',
] as const;

export type AdvisorStatusPhase = 'thinking' | 'analyzing' | 'searching' | 'generating';

const STATUS_PHASE_LABELS: Record<AdvisorStatusPhase, string> = {
  thinking: 'Pensando…',
  analyzing: 'Analizando los datos…',
  searching: 'Consultando normativa…',
  generating: 'Armando respuesta…',
};

export function advisorStatusToLabel(phase: string): string {
  return STATUS_PHASE_LABELS[phase as AdvisorStatusPhase] ?? ASSISTANT_LOADING_PHASES[0];
}

export function useAssistantLoadingLabel(loading: boolean, hasStreamingText: boolean) {
  const [loadingLabel, setLoadingLabel] = useState<string>(ASSISTANT_LOADING_PHASES[0]);
  const serverDrivenRef = useRef(false);

  const setStatusPhase = useCallback((phase: AdvisorStatusPhase) => {
    serverDrivenRef.current = true;
    setLoadingLabel(advisorStatusToLabel(phase));
  }, []);

  useEffect(() => {
    if (!loading || hasStreamingText) {
      serverDrivenRef.current = false;
      setLoadingLabel(ASSISTANT_LOADING_PHASES[0]);
      return;
    }

    let index = 0;
    setLoadingLabel(ASSISTANT_LOADING_PHASES[0]);

    const id = window.setInterval(() => {
      if (serverDrivenRef.current) return;
      index = (index + 1) % ASSISTANT_LOADING_PHASES.length;
      setLoadingLabel(ASSISTANT_LOADING_PHASES[index]);
    }, 2200);

    return () => window.clearInterval(id);
  }, [loading, hasStreamingText]);

  return { loadingLabel, setStatusPhase };
}
