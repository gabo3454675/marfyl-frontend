'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  /** Pulso visual en el FAB al abrir */
  fabPulse: boolean;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fabPulse, setFabPulse] = useState(false);

  const openAssistant = useCallback(() => {
    setFabPulse(true);
    setOpen(true);
    window.setTimeout(() => setFabPulse(false), 700);
  }, []);

  const closeAssistant = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => openAssistant();
    window.addEventListener('open-marfyl-assistant', onOpen);
    return () => window.removeEventListener('open-marfyl-assistant', onOpen);
  }, [openAssistant]);

  const value = useMemo(
    () => ({ open, setOpen, openAssistant, closeAssistant, fabPulse }),
    [open, openAssistant, closeAssistant, fabPulse],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistant debe usarse dentro de AssistantProvider');
  }
  return ctx;
}

/** Hook seguro cuando el provider no está montado */
export function useAssistantOptional() {
  return useContext(AssistantContext);
}
