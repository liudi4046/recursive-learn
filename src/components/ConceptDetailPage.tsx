"use client";

import type { AppState } from "@/domain/app-state";

export function ConceptDetailPage({ state, conceptId }: { state: AppState; conceptId: string }) {
  const concept = state.concepts.find((c) => c.id === conceptId);
  if (!concept) {
    return <main className="concept-page">Concept not found</main>;
  }

  return (
    <main className="concept-page">
      <h1>{concept.name}</h1>
      <section>Appears in topics</section>
      <section>Linked learning nodes</section>
      <section>Related concepts</section>
      <aside aria-label="Local network preview" />
    </main>
  );
}
