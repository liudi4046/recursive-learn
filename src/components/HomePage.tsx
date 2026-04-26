"use client";

import { useState } from "react";

export function HomePage({ onStart }: { onStart: (topic: string) => void }) {
  const [topic, setTopic] = useState("");

  return (
    <main className="home">
      <h1>Turn your questions into a learning map.</h1>
      <p className="subtitle">Pick a topic, ask follow-ups, and grow a clean tree of notes.</p>
      <div className="start-row">
        <input
          aria-label="Learning topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Transformer"
        />
        <button
          type="button"
          onClick={() => onStart(topic.trim() || "Transformer")}
        >
          Start learning
        </button>
      </div>
      <section aria-label="Example learning map" className="tree-preview">
        <div className="tree-preview__root">Topic</div>
        <div className="tree-preview__child">Node</div>
        <div className="tree-preview__child">Node</div>
      </section>
    </main>
  );
}
