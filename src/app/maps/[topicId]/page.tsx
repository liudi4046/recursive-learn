"use client";

import Link from "next/link";
import { use } from "react";
import { LearningMapPage } from "@/components/LearningMapPage";
import { useAppState } from "@/state/app-state-context";

export default function MapRoutePage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const { rehydrated, state, setState } = useAppState();

  if (!rehydrated) {
    return null;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-[1320px] px-10 py-12">
        <p>
          No learning session. <Link href="/">Start from home</Link>.
        </p>
      </main>
    );
  }
  if (state.activeTopicId !== topicId) {
    return (
      <main className="mx-auto max-w-[1320px] px-10 py-12">
        <p>This topic is not the active session. Open the map from your current session.</p>
        <p>
          <Link href={`/maps/${state.activeTopicId}`}>Open active topic map</Link> or <Link href="/">home</Link>.
        </p>
      </main>
    );
  }

  return <LearningMapPage state={state} onStateChange={setState} />;
}
