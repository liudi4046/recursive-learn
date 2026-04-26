"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { AppState } from "@/domain/app-state";
import { handleAskResult, setNodeMastery } from "@/domain/app-state";
import { getNodePath } from "@/domain/learning-tree";
import { getRootNode } from "@/domain/topic-tree";
import { getRelatedConceptsForPath } from "@/domain/related-context";
import type { AskMode, ContinueNodeOutput, CreateNodeOutput, LearningNode } from "@/domain/types";
import { loadDeepseekSettings } from "@/lib/deepseek-settings";
import {
  IconArrowRight,
  IconCheckCircle,
  IconDot,
  IconExternalLink,
  IconNodeCard
} from "./Icons";

const btnMastery = (on: boolean) =>
  on
    ? "bg-ml-blue-soft text-ml-blue shadow-ml-mastery"
    : "bg-transparent text-ml-muted";

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
  const path = getNodePath(state.nodes, node.id);
  const relatedConcepts = getRelatedConceptsForPath(state, state.activeNodeId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !topic) return;
    setError(null);
    setSubmitting(true);
    try {
      const { apiKey, model } = loadDeepseekSettings();
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          nodes: state.nodes,
          activeNodeId: state.activeNodeId,
          question: q,
          mode,
          relatedConcepts,
          ...(apiKey
            ? { deepseek: { apiKey, model } }
            : {})
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
    return <main className="mx-auto max-w-[1200px] px-10 pb-12 pt-7">Session incomplete.</main>;
  }

  return (
    <main className="mx-auto max-w-[1200px] px-10 pb-12 pt-7">
      <nav aria-label="Breadcrumb" className="mb-3 text-[0.88rem] text-ml-muted">
        {path.map((n, i) => (
          <span key={n.id} className="inline">
            {i > 0 ? <span className="opacity-60"> &gt; </span> : null}
            {n.id === node.id ? (
              <span aria-current="page">{n.title}</span>
            ) : (
              <Link className="text-ml-muted no-underline hover:text-ml-blue" href={`/nodes/${n.id}`}>
                {n.title}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <h1 className="mb-5 text-[1.85rem] font-bold leading-tight tracking-tight text-ml-ink">{node.title}</h1>

      <div className="grid [grid-template-columns:1fr_320px] items-start gap-8 max-[960px]:[grid-template-columns:1fr]">
        <div>
          <div
            className="mb-5 inline-flex overflow-hidden rounded-full border border-ml-line bg-ml-card"
            role="group"
            aria-label="Mastery"
          >
            <button
              type="button"
              className={[
                "inline-flex items-center gap-2 border-0 bg-transparent px-5 py-2.5 text-[0.9rem] font-medium",
                "cursor-pointer",
                btnMastery(node.status === "unmastered")
              ].join(" ")}
              onClick={() => onStateChange(setNodeMastery(state, node.id, "unmastered"))}
            >
              <IconDot className="shrink-0" />
              Unmastered
            </button>
            <button
              type="button"
              className={[
                "inline-flex items-center gap-2 border-0 bg-transparent px-5 py-2.5 text-[0.9rem] font-medium",
                "cursor-pointer",
                btnMastery(node.status === "mastered")
              ].join(" ")}
              onClick={() => onStateChange(setNodeMastery(state, node.id, "mastered"))}
            >
              <IconCheckCircle className="shrink-0" />
              Mastered
            </button>
          </div>

          <div className="mb-6 rounded-ml border border-ml-line bg-ml-card p-6 shadow-ml-card max-[480px]:px-5 max-[480px]:py-5">
            <article>
              {node.contentBlocks.map((block) => (
                <div key={block.id} className="mb-4 last:mb-0">
                  {block.question ? <p className="mb-2 text-[0.92rem] text-ml-muted">{block.question}</p> : null}
                  <p>{block.answer}</p>
                </div>
              ))}
            </article>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-5" role="group" aria-label="Ask mode">
            <button
              type="button"
              className={[
                "inline-flex cursor-pointer items-center gap-2.5 rounded-ml-sm border-[1.5px] border-ml-blue bg-ml-card",
                "px-[18px] py-2.5 text-[0.9rem] font-semibold text-ml-blue",
                mode === "create_child_node" ? "bg-ml-blue-soft" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setMode("create_child_node")}
            >
              <IconNodeCard />
              Create child node
            </button>
            <button
              type="button"
              className={[
                "inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent",
                "text-[0.92rem] font-medium",
                mode === "continue_here" ? "text-ml-ink" : "text-ml-muted"
              ].join(" ")}
              onClick={() => setMode("continue_here")}
            >
              Continue here
              <IconArrowRight />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <label className="flex items-start gap-3 rounded-ml border border-ml-line bg-ml-card px-4 py-2.5">
              <span className="sr-only">Ask a question</span>
              <span className="mt-1 shrink-0 text-ml-muted" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="7.5" cy="7.5" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M11 11l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <textarea
                aria-label="Ask a question"
                className="min-h-12 w-full flex-1 resize-y border-0 bg-transparent outline-none"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                placeholder="What do you want to learn next?"
              />
            </label>
            {error ? <p className="mt-2 text-[0.9rem] text-ml-error">{error}</p> : null}
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-2.5 rounded-ml-sm border-0 bg-ml-blue px-7 py-3 font-semibold text-white shadow-ml-cta-tight disabled:cursor-not-allowed disabled:opacity-55"
                disabled={submitting}
              >
                {mode === "create_child_node" ? "Create child node" : "Ask here"}
                <IconArrowRight />
              </button>
            </div>
          </form>
        </div>

        <aside
          className="sticky top-6 self-start rounded-ml border border-ml-line bg-ml-card p-5 shadow-ml-card max-[960px]:static"
          aria-label="Learning map preview"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Learning map preview</h2>
            <Link
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-ml-sm border-[1.5px] border-ml-blue bg-ml-card px-3.5 py-2 text-[0.85rem] font-semibold text-ml-blue no-underline hover:bg-ml-blue-soft"
              href={`/maps/${topic.id}`}
            >
              Open full map
              <IconExternalLink />
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {path.map((n) => (
              <MapPreviewCard
                key={n.id}
                node={n}
                activeId={node.id}
                topicId={topic.id}
                state={state}
              />
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function MapPreviewCard({
  node,
  activeId,
  topicId,
  state
}: {
  node: LearningNode;
  activeId: string;
  topicId: string;
  state: AppState;
}) {
  const isActive = node.id === activeId;
  const root = getRootNode(state.nodes, topicId);
  const parent =
    node.parentNodeId && root ? state.nodes.find((x) => x.id === node.parentNodeId) : null;
  const raw = node.contentBlocks[0]?.answer ?? "";
  const snippet = raw.length > 72 ? `${raw.slice(0, 72)}…` : raw || "Learning node.";
  const mastered = node.status === "mastered";

  return (
    <div
      className={[
        "relative rounded-ml-sm border border-ml-line bg-ml-preview-bg p-3.5",
        isActive && "border-ml-blue bg-ml-card shadow-ml-focus"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-2 flex items-start justify-between">
        <span className="text-ml-blue" aria-hidden>
          <IconNodeCard />
        </span>
        {mastered ? (
          <span className="text-ml-green" title="Mastered">
            <IconCheckCircle />
          </span>
        ) : null}
      </div>
      <Link
        href={`/nodes/${node.id}`}
        className={["block text-[0.95rem] font-bold no-underline", isActive ? "text-ml-blue" : "text-ml-ink"].join(" ")}
      >
        {node.title}
      </Link>
      <p className="mt-2 text-[0.78rem] leading-[1.45] text-ml-muted">
        {parent ? (
          <>
            Under <strong>{parent.title}</strong>. {snippet}
          </>
        ) : (
          snippet
        )}
      </p>
    </div>
  );
}
