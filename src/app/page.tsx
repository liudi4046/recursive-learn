"use client";

import { useRouter } from "next/navigation";
import {
  createInitialState,
  createRootNode,
  replaceChildFirstBlockAnswer,
  setCreateChildStreamUi,
  setNodeFirstBlockQuestion
} from "@/domain/app-state";
import { HomePage } from "@/components/HomePage";
import { streamRootAnswer } from "@/lib/stream-root-answer";
import { useAppState } from "@/state/app-state-context";

export default function Page() {
  const router = useRouter();
  const { rehydrated, state, setState } = useAppState();

  if (!rehydrated) {
    return null;
  }

  function handleStart(topic: string, webSearch: boolean) {
    const trimmed = topic.trim();
    if (!trimmed) return;

    const created = state ? createRootNode(state, trimmed) : createInitialState(trimmed);
    const next = replaceChildFirstBlockAnswer(created, created.activeNodeId, "");
    const rootId = next.activeNodeId;
    const withQuestion = setNodeFirstBlockQuestion(next, rootId, trimmed);
    const withThinking = setCreateChildStreamUi(withQuestion, {
      childId: rootId,
      phase: "thinking",
      streamPurpose: "create_child"
    });
    setState(withThinking);
    router.push(`/nodes/${rootId}`);
    void streamRootAnswer(withThinking, rootId, trimmed, webSearch, setState);
  }

  return <HomePage continueNodeId={state?.activeNodeId} onStart={handleStart} />;
}
