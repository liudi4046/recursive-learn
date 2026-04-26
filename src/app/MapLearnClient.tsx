"use client";

import { useEffect, useState } from "react";
import { createInitialState, type AppState } from "@/domain/app-state";
import { HomePage } from "@/components/HomePage";
import { NodeDetailPage } from "@/components/NodeDetailPage";
import { loadState, saveState } from "@/lib/storage";

export function MapLearnClient() {
  const [rehydrated, setRehydrated] = useState(false);
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const stored = loadState();
    if (stored) setState(stored);
    setRehydrated(true);
  }, []);

  useEffect(() => {
    if (rehydrated && state) saveState(state);
  }, [rehydrated, state]);

  if (!rehydrated) {
    return null;
  }

  if (!state) {
    return <HomePage onStart={(title) => setState(createInitialState(title))} />;
  }

  return <NodeDetailPage state={state} onStateChange={setState} />;
}
