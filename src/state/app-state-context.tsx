"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { AppState } from "@/domain/app-state";
import { clearStoredState, loadState, saveState } from "@/lib/storage";

type Ctx = {
  rehydrated: boolean;
  state: AppState | null;
  setState: (next: AppState | null) => void;
};

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [rehydrated, setRehydrated] = useState(false);
  const [state, setStateInternal] = useState<AppState | null>(null);

  const setState = useCallback((next: AppState | null) => {
    setStateInternal(next);
  }, []);

  const hydrate = useCallback(() => {
    try {
      const stored = loadState();
      if (stored) setStateInternal(stored);
    } catch {
      clearStoredState();
    }
    setRehydrated(true);
  }, []);

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!rehydrated) return;
    if (state) saveState(state);
    else clearStoredState();
  }, [rehydrated, state]);

  const value = useMemo(
    () => ({ rehydrated, state, setState }),
    [rehydrated, state, setState]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}
