"use client";

import Link from "next/link";
import { KnowledgeBasePage } from "@/components/KnowledgeBasePage";
import { useAppState } from "@/state/app-state-context";

export default function KnowledgeBaseRoutePage() {
  const { rehydrated, state } = useAppState();

  if (!rehydrated) {
    return null;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-[1400px] px-10 py-12">
        <p>
          No session yet. <Link href="/">Start learning</Link> to build concepts.
        </p>
      </main>
    );
  }

  return <KnowledgeBasePage state={state} />;
}
