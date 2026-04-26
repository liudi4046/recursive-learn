"use client";

import type { AppState } from "@/domain/app-state";

export function KnowledgeBasePage({ state }: { state: AppState }) {
  return (
    <main className="knowledge-page">
      <h1>Knowledge Base</h1>
      <input type="search" aria-label="Search concepts" />
      <section aria-label="Concept network" className="network-canvas">
        {state.concepts.map((concept) => (
          <button type="button" className="concept-node" key={concept.id}>
            {concept.name}
          </button>
        ))}
      </section>
    </main>
  );
}
