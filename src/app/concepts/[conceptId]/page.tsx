"use client";

import Link from "next/link";
import { use } from "react";
import { ConceptDetailPage } from "@/components/ConceptDetailPage";
import { useAppState } from "@/state/app-state-context";

export default function ConceptRoutePage({ params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId } = use(params);
  const { rehydrated, state } = useAppState();

  if (!rehydrated) {
    return null;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-[1200px] px-10 py-12">
        <p>
          No session. <Link href="/">Start from home</Link>.
        </p>
      </main>
    );
  }

  return <ConceptDetailPage state={state} conceptId={conceptId} />;
}
