"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AppState } from "@/domain/app-state";
import { buildConceptGraph } from "@/domain/concept-network";
import { getRelatedConceptRows, listNodesLinkedToConcept } from "@/domain/concept-views";
import { ConceptNetworkGraph } from "./ConceptNetworkGraph";
import { IconChevronRight, IconClose, IconExternalLink, IconKnowledgeBase, IconNodeCard } from "./Icons";

const treeBg =
  "bg-[radial-gradient(circle,_#d5dde8_1px,transparent_1px),#fafbfd] bg-[length:22px_22px]";

export function KnowledgeBasePage({ state }: { state: AppState }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.concepts[0]?.id ?? null);
  const [zoomPct, setZoomPct] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  const graph = useMemo(
    () => buildConceptGraph(state.concepts, state.conceptRelations),
    [state.concepts, state.conceptRelations]
  );

  const selected = state.concepts.find((c) => c.id === selectedId) ?? null;
  const related = selected
    ? getRelatedConceptRows(selected.id, state.concepts, state.conceptRelations)
    : [];
  const linkedNodes = selected ? listNodesLinkedToConcept(state.nodes, selected.id) : [];
  const topicCount = selected
    ? new Set(linkedNodes.map((n) => n.topicId)).size
    : 0;

  const scale = zoomPct / 100;

  return (
    <main
      className={[
        "mx-auto max-w-[1400px] px-10 pb-12 pt-7",
        fullscreen && "fixed inset-0 z-50 overflow-auto bg-ml-surface p-6"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header>
        <h1 className="mb-2 text-[1.75rem] font-bold">Knowledge Base</h1>
        <p className="mb-6 max-w-[40rem] text-ml-muted">
          Explore how concepts connect across your knowledge network.
        </p>
      </header>

      <div className="grid max-[1024px]:[grid-template-columns:1fr] [grid-template-columns:1fr_340px] gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="search"
              aria-label="Search concepts"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search concepts…"
              className="min-w-[200px] flex-1 rounded-full border border-ml-line bg-ml-card px-4 py-2.5"
            />
            <div
              className="inline-flex items-center overflow-hidden rounded-ml-sm border border-ml-line bg-ml-card"
              role="group"
              aria-label="Zoom"
            >
              <button
                type="button"
                className="cursor-pointer border-0 bg-ml-card px-3.5 py-2 font-semibold text-ml-ink"
                onClick={() => setZoomPct((z) => Math.max(70, z - 10))}
              >
                −
              </button>
              <span className="border-x border-ml-line px-3 text-[0.88rem] text-ml-muted">{zoomPct}%</span>
              <button
                type="button"
                className="cursor-pointer border-0 bg-ml-card px-3.5 py-2 font-semibold text-ml-ink"
                onClick={() => setZoomPct((z) => Math.min(130, z + 10))}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border-[1.5px] border-ml-blue bg-ml-card px-3.5 py-2 text-[0.85rem] font-semibold text-ml-blue hover:bg-ml-blue-soft"
              onClick={() => setFullscreen((f) => !f)}
            >
              {fullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>

          <section
            className={`relative min-h-[420px] rounded-ml border border-ml-line p-5 shadow-ml-card ${treeBg}`}
            aria-label="Concept network"
          >
            <div
              className="transition-transform duration-150 ease-out"
              style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            >
              <ConceptNetworkGraph
                graph={graph}
                selectedId={selectedId}
                onSelectNode={(id) => setSelectedId(id)}
              />
            </div>
            {graph.nodes.length > 0 ? (
              <div
                className="absolute bottom-4 left-4 w-[148px] rounded-ml-sm border border-ml-line bg-ml-card p-2 opacity-95 shadow-ml-card"
                aria-hidden
              >
                <ConceptNetworkGraph graph={graph} selectedId={selectedId} variant="minimap" />
              </div>
            ) : null}
          </section>
        </div>

        <aside
          className="overflow-hidden rounded-ml border border-ml-line bg-ml-card shadow-ml-card"
          aria-label="Selected concept"
        >
          {selected ? (
            <>
              <div className="grid grid-cols-[48px_1fr_auto] items-start gap-3 border-b border-ml-line p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ml-blue-soft text-ml-blue" aria-hidden>
                  <IconKnowledgeBase />
                </div>
                <h2 className="m-0 self-center text-[1.15rem] font-semibold leading-tight">{selected.name}</h2>
                <button
                  type="button"
                  className="cursor-pointer rounded-ml-sm border-0 bg-ml-segment-bg p-2 text-ml-muted"
                  aria-label="Clear selection"
                  onClick={() => setSelectedId(null)}
                >
                  <IconClose />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 px-5 py-4">
                <div className="rounded-ml-sm border border-ml-line bg-ml-preview-bg p-3">
                  <span className="mb-1.5 block text-[0.72rem] font-normal uppercase tracking-wide text-ml-muted">
                    Appears in topics
                  </span>
                  <strong className="text-[1.35rem] font-bold">{topicCount}</strong>
                </div>
                <div className="rounded-ml-sm border border-ml-line bg-ml-preview-bg p-3">
                  <span className="mb-1.5 block text-[0.72rem] font-normal uppercase tracking-wide text-ml-muted">
                    Linked learning nodes
                  </span>
                  <strong className="text-[1.35rem] font-bold">{linkedNodes.length}</strong>
                </div>
              </div>
              <h3 className="m-0 px-5 text-[0.8rem] font-semibold uppercase tracking-wide text-ml-muted">
                Related concepts
              </h3>
              <ul className="m-0 max-h-[280px] list-none overflow-y-auto px-5 pb-5 pt-3">
                {related.map((row) => (
                  <li key={`${row.otherId}-${row.label}-${row.direction}`}>
                    <button
                      type="button"
                      className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-ml-sm border border-ml-line bg-ml-card p-3 text-left hover:border-ml-hairline"
                      onClick={() => setSelectedId(row.otherId)}
                    >
                      <IconNodeCard />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-semibold">{row.otherName}</span>
                        <span className="text-[0.8rem] text-ml-muted">{row.label}</span>
                      </span>
                      <IconChevronRight />
                    </button>
                  </li>
                ))}
              </ul>
              {related.length === 0 ? <p className="px-5 pb-2 text-[0.95rem] text-ml-muted">No relations yet.</p> : null}
              <Link
                className="mx-5 mb-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2.5 rounded-ml-sm bg-ml-blue px-5 py-3.5 font-semibold !text-white no-underline shadow-ml-cta-tight hover:bg-ml-blue-deep"
                href={`/concepts/${selected.id}`}
              >
                Open concept
                <IconExternalLink />
              </Link>
            </>
          ) : (
            <p className="px-5 py-8 text-center text-[0.95rem] text-ml-muted">Select a concept on the graph.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
