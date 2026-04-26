"use client";

import type { AppState } from "@/domain/app-state";

export function LearningMapPage({
  state
}: {
  state: AppState;
  onStateChange: (state: AppState) => void;
}) {
  return (
    <main className="map-page">
      <h1>Learning map</h1>
      <input type="search" aria-label="Search nodes" />
      <div className="segmented" role="group" aria-label="Node filters">
        <button type="button">All</button>
        <button type="button">Unmastered</button>
        <button type="button">Mastered</button>
      </div>
      <section className="tree-canvas" aria-label="Topic tree">
        {state.nodes.map((n) => (
          <button type="button" className="map-node-card" key={n.id}>
            {n.title}
            <span className="map-node-card__status">
              {n.status === "mastered" ? "Mastered" : "Unmastered"}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
