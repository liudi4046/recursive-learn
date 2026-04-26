"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AppState } from "@/domain/app-state";
import { setActiveNodeId, setNodeMastery } from "@/domain/app-state";
import { getChildrenOf, getRootNode, matchesNodeFilter, orderNodesDepthFirst } from "@/domain/topic-tree";
import type { LearningNode } from "@/domain/types";
import { IconClose, IconExternalLink, IconNodeCard } from "./Icons";

const treeBg =
  "bg-[radial-gradient(circle,_#d5dde8_1px,transparent_1px),#fafbfd] bg-[length:22px_22px]";

const filterBtn = (on: boolean) =>
  [
    "cursor-pointer border-0 px-4 py-2.5 text-[0.88rem] font-medium",
    on ? "bg-ml-blue-soft text-ml-blue" : "bg-ml-card text-ml-ink"
  ].join(" ");

export function LearningMapPage({
  state,
  onStateChange
}: {
  state: AppState;
  onStateChange: (state: AppState) => void;
}) {
  const topic = state.topics.find((t) => t.id === state.activeTopicId) ?? state.topics[0];
  const [filter, setFilter] = useState<"all" | "unmastered" | "mastered">("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(state.activeNodeId);
  const [panelOpen, setPanelOpen] = useState(true);

  const ordered = useMemo(
    () => (topic ? orderNodesDepthFirst(state.nodes, topic.id) : []),
    [state.nodes, topic]
  );
  const visible = useMemo(() => {
    return ordered.filter(
      (n) =>
        matchesNodeFilter(n, filter) && n.title.toLowerCase().includes(q.trim().toLowerCase())
    );
  }, [ordered, filter, q]);

  const selected = state.nodes.find((n) => n.id === selectedId) ?? state.nodes[0];
  const parent =
    selected?.parentNodeId && topic
      ? state.nodes.find((n) => n.id === selected.parentNodeId)
      : null;
  const childCount =
    topic && selected ? getChildrenOf(state.nodes, topic.id, selected.id).length : 0;
  const linkedConcept =
    selected?.linkedConceptId && state.concepts.find((c) => c.id === selected.linkedConceptId);

  if (!topic) {
    return <main className="mx-auto max-w-[1320px] px-10 pb-12 pt-6">No topic in session.</main>;
  }

  return (
    <main className="mx-auto max-w-[1320px] px-10 pb-12 pt-6">
      <nav className="mb-2 text-[0.88rem]" aria-label="Breadcrumb">
        <Link className="font-medium text-ml-blue no-underline hover:underline" href={`/maps/${topic.id}`}>
          Learning Map
        </Link>
        <span className="mx-2 text-ml-muted">&gt;</span>
        <span>{topic.title}</span>
      </nav>
      <h1 className="mb-5 text-[1.75rem] font-bold text-ml-ink">{topic.title}</h1>

      <div
        className={[
          "grid items-stretch gap-6",
          panelOpen ? "[grid-template-columns:1fr_320px]" : "[grid-template-columns:1fr_48px]",
          "max-[960px]:[grid-template-columns:1fr]"
        ].join(" ")}
      >
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-ml border border-ml-line bg-ml-card shadow-ml-card">
          <div className="flex flex-wrap items-center gap-5 border-b border-ml-line bg-ml-toolbar px-5 py-4">
            <input
              type="search"
              aria-label="Search nodes"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search nodes…"
              className="min-w-[200px] flex-1 rounded-full border border-ml-line bg-ml-card px-3.5 py-2.5"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-[0.88rem] text-ml-muted">Filter:</span>
              <div
                className="inline-flex overflow-hidden rounded-full border border-ml-line"
                role="group"
                aria-label="Node filters"
              >
                <button type="button" className={filterBtn(filter === "all")} onClick={() => setFilter("all")}>
                  All
                </button>
                <button
                  type="button"
                  className={filterBtn(filter === "unmastered")}
                  onClick={() => setFilter("unmastered")}
                >
                  Unmastered
                </button>
                <button
                  type="button"
                  className={filterBtn(filter === "mastered")}
                  onClick={() => setFilter("mastered")}
                >
                  Mastered
                </button>
              </div>
            </div>
          </div>
          <section
            className={`min-h-0 flex-1 border-0 p-6 pb-8 ${treeBg}`}
            aria-label="Topic tree"
          >
            <ul className="m-0 list-none p-0">
              {visible.map((n) => (
                <li
                  key={n.id}
                  className="relative mb-3 list-none"
                  style={{ marginLeft: depthForNode(n, state.nodes, topic.id) * 24 }}
                >
                  <button
                    type="button"
                    className={[
                      "flex max-w-[420px] w-[calc(100%-8px)] cursor-pointer items-start gap-3 rounded-ml-sm border",
                      "bg-ml-card p-3.5 text-left shadow-ml-card hover:border-ml-hairline",
                      n.id === selectedId ? "border-ml-blue shadow-ml-node" : "border-ml-line"
                    ].join(" ")}
                    onClick={() => {
                      setSelectedId(n.id);
                      onStateChange(setActiveNodeId(state, n.id));
                      setPanelOpen(true);
                    }}
                  >
                    <span className="shrink-0 text-ml-blue" aria-hidden>
                      <IconNodeCard />
                    </span>
                    <span className="flex flex-col gap-1.5">
                      <span className="font-semibold">{n.title}</span>
                      <span className="inline-flex items-center gap-1.5 text-[0.82rem] text-ml-muted">
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            n.status === "mastered" ? "bg-ml-green" : "bg-ml-blue"
                          ].join(" ")}
                        />
                        {n.status === "mastered" ? "Mastered" : "Unmastered"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {selected ? (
          <aside
            className={[
              "sticky top-5 self-start rounded-ml border border-ml-line bg-ml-card shadow-ml-card max-[960px]:static",
              panelOpen ? "p-5" : "flex items-start justify-center p-2"
            ].join(" ")}
            aria-label="Selected node"
          >
            {panelOpen ? (
              <>
                <div className="mb-3 flex items-start justify-between">
                  <button
                    type="button"
                    className="cursor-pointer rounded-ml-sm border-0 bg-ml-segment-bg p-1.5 text-ml-muted"
                    aria-label="Close panel"
                    onClick={() => setPanelOpen(false)}
                  >
                    <IconClose />
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ml-blue-soft text-ml-blue" aria-hidden>
                    <IconNodeCard />
                  </div>
                </div>
                <h2 className="mb-4 text-[1.2rem] font-semibold leading-tight">{selected.title}</h2>
                <div
                  className="flex w-full overflow-hidden rounded-ml-sm border border-ml-line [&>button]:flex-1"
                  role="group"
                  aria-label="Mastery (selection)"
                >
                  <button
                    type="button"
                    className={filterBtn(selected.status === "unmastered")}
                    onClick={() => onStateChange(setNodeMastery(state, selected.id, "unmastered"))}
                  >
                    Unmastered
                  </button>
                  <button
                    type="button"
                    className={filterBtn(selected.status === "mastered")}
                    onClick={() => onStateChange(setNodeMastery(state, selected.id, "mastered"))}
                  >
                    Mastered
                  </button>
                </div>
                <dl className="my-4 grid gap-3">
                  <div>
                    <dt className="text-[0.75rem] uppercase tracking-wide text-ml-muted">Parent node</dt>
                    <dd className="m-0 mt-1 font-semibold">{parent ? parent.title : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.75rem] uppercase tracking-wide text-ml-muted">Child nodes</dt>
                    <dd className="m-0 mt-1 font-semibold">{childCount}</dd>
                  </div>
                </dl>
                <Link
                  className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-ml-sm bg-ml-blue px-5 py-3.5 font-semibold !text-white no-underline shadow-ml-cta-tight hover:bg-ml-blue-deep"
                  href={`/nodes/${selected.id}`}
                >
                  Open node
                  <IconExternalLink />
                </Link>
                <div className="mt-6 border-t border-ml-line pt-5">
                  <h3 className="mb-2.5 text-[0.85rem] uppercase tracking-wide text-ml-muted">Linked concept</h3>
                  {linkedConcept ? (
                    <>
                      <Link className="font-semibold text-ml-blue no-underline" href={`/concepts/${linkedConcept.id}`}>
                        {linkedConcept.name}
                      </Link>
                      <p className="mt-2 text-[0.88rem] text-ml-muted">
                        {linkedConcept.description ?? "Concept linked from your learning map."}
                      </p>
                    </>
                  ) : (
                    <p className="text-[0.95rem] text-ml-muted">No concept linked yet.</p>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                className="cursor-pointer rounded-ml-sm border border-ml-line bg-ml-card px-2 py-3 text-[0.85rem] text-ml-muted [writing-mode:vertical-rl]"
                onClick={() => setPanelOpen(true)}
              >
                Details
              </button>
            )}
          </aside>
        ) : null}
      </div>
    </main>
  );
}

function depthForNode(node: LearningNode, nodes: LearningNode[], topicId: string): number {
  const root = getRootNode(nodes, topicId);
  if (!root) return 0;
  let d = 0;
  let current: LearningNode | undefined = node;
  const seen = new Set<string>();
  while (current && current.id !== root.id) {
    if (seen.has(current.id)) return d;
    seen.add(current.id);
    d++;
    const parentId: string | null = current.parentNodeId;
    if (!parentId) break;
    current = nodes.find((n) => n.id === parentId);
  }
  return d;
}
