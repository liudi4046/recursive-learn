"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { NodeDetailPage } from "@/components/NodeDetailPage";
import { setActiveNodeId } from "@/domain/app-state";
import { useAppState } from "@/state/app-state-context";

export default function NodeRoutePage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = use(params);
  const { rehydrated, state, setState } = useAppState();

  useEffect(() => {
    if (!rehydrated || !state) return;
    if (!state.nodes.some((n) => n.id === nodeId)) return;
    if (state.activeNodeId === nodeId) return;
    setState(setActiveNodeId(state, nodeId));
  }, [rehydrated, state, nodeId, setState]);

  if (!rehydrated) {
    return null;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-[1200px] px-10 py-12">
        <p>
          No learning session. <Link href="/">Start from home</Link>.
        </p>
      </main>
    );
  }
  if (!state.nodes.some((n) => n.id === nodeId)) {
    return (
      <main className="mx-auto max-w-[1200px] px-10 py-12">
        <p>Node not found.</p>
        <p>
          <Link href="/">Home</Link>
        </p>
      </main>
    );
  }

  return <NodeDetailPage state={state} onStateChange={setState} />;
}
