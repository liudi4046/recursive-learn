"use client";

import { createInitialState } from "@/domain/app-state";
import { HomePage } from "@/components/HomePage";
import { NodeDetailPage } from "@/components/NodeDetailPage";
import { useAppState } from "@/state/app-state-context";

export default function Page() {
  const { state, setState } = useAppState();

  if (!state) {
    return <HomePage onStart={(title) => setState(createInitialState(title))} />;
  }

  return <NodeDetailPage state={state} onStateChange={setState} />;
}
