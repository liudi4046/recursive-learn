"use client";

import { useState, type FormEvent } from "react";
import type { AppState } from "@/domain/app-state";
import { handleAskResult } from "@/domain/app-state";
import type { AskMode, ContinueNodeOutput, CreateNodeOutput } from "@/domain/types";

export function NodeDetailPage({
  state,
  onStateChange
}: {
  state: AppState;
  onStateChange: (state: AppState) => void;
}) {
  const [mode, setMode] = useState<AskMode>("create_child_node");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const node = state.nodes.find((item) => item.id === state.activeNodeId) ?? state.nodes[0];
  const topic = state.topics.find((t) => t.id === state.activeTopicId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !topic) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          nodes: state.nodes,
          activeNodeId: state.activeNodeId,
          question: q,
          mode,
          relatedConcepts: []
        })
      });
      const body = (await res.json()) as
        | { error: string }
        | { kind: "create_child_node"; output: CreateNodeOutput }
        | { kind: "continue_here"; output: ContinueNodeOutput };
      if (!res.ok) {
        setError("error" in body ? body.error : "Request failed");
        return;
      }
      if (!("kind" in body)) {
        setError("Unexpected response");
        return;
      }
      if (body.kind === "create_child_node") {
        onStateChange(
          handleAskResult(state, { mode: "create_child_node", question: q, output: body.output })
        );
      } else {
        onStateChange(
          handleAskResult(state, { mode: "continue_here", question: q, output: body.output })
        );
      }
      setQuestion("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!node || !topic) {
    return <main className="node-page">Session incomplete.</main>;
  }

  return (
    <main className="node-page">
      <h1>{node.title}</h1>
      <div className="segmented" role="group" aria-label="Ask mode">
        <button
          type="button"
          onClick={() => setMode("create_child_node")}
          className={mode === "create_child_node" ? "is-active" : undefined}
        >
          Create child node
        </button>
        <button
          type="button"
          onClick={() => setMode("continue_here")}
          className={mode === "continue_here" ? "is-active" : undefined}
        >
          Continue here
        </button>
      </div>
      <div className="segmented" role="group" aria-label="Mastery">
        <button type="button">Unmastered</button>
        <button type="button">Mastered</button>
      </div>
      <article>
        {node.contentBlocks.map((block) => (
          <div key={block.id} className="content-block">
            {block.question ? <p className="content-block__q">{block.question}</p> : null}
            <p>{block.answer}</p>
          </div>
        ))}
      </article>
      <form onSubmit={onSubmit}>
        <textarea
          aria-label="Ask a question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {mode === "create_child_node" ? "Create child node" : "Ask here"}
        </button>
      </form>
    </main>
  );
}
