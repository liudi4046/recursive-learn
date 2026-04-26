"use client";

import Link from "next/link";
import type { AppState } from "@/domain/app-state";
import { getNodePath } from "@/domain/learning-tree";
import {
  getLocalNetworkGraph,
  getRelatedConceptRows,
  listNodesLinkedToConcept
} from "@/domain/concept-views";
import { ConceptNetworkGraph } from "./ConceptNetworkGraph";
import { IconChevronRight, IconExternalLink, IconKnowledgeBase } from "./Icons";

function formatConceptDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return iso;
  }
}

export function ConceptDetailPage({ state, conceptId }: { state: AppState; conceptId: string }) {
  const concept = state.concepts.find((c) => c.id === conceptId);
  if (!concept) {
    return <main className="mx-auto max-w-[1200px] px-10 pb-14 pt-7">Concept not found</main>;
  }

  const related = getRelatedConceptRows(concept.id, state.concepts, state.conceptRelations);
  const linkedNodes = listNodesLinkedToConcept(state.nodes, concept.id);
  const topicTitles = new Map(state.topics.map((t) => [t.id, t.title]));
  const localGraph = getLocalNetworkGraph(concept.id, state.concepts, state.conceptRelations);
  const appearsInTopicIds = [...new Set(linkedNodes.map((n) => n.topicId))];

  return (
    <main className="mx-auto grid max-w-[1240px] [grid-template-columns:1fr_360px] items-start gap-9 px-10 pb-14 pt-7 max-[1024px]:[grid-template-columns:1fr]">
      <div>
        <p className="m-0">
          <Link
            className="text-[0.92rem] font-medium text-ml-muted no-underline hover:text-ml-blue"
            href="/knowledge-base"
          >
            ← Back to Knowledge Base
          </Link>
        </p>

        <header className="my-5 mb-8 flex gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-ml-blue-soft text-ml-blue"
            aria-hidden
          >
            <IconKnowledgeBase />
          </div>
          <div>
            <h1 className="m-0 mb-2.5 text-[1.65rem] font-bold leading-tight">{concept.name}</h1>
            <p className="m-0 text-[0.95rem] text-ml-muted">
              {concept.description ?? "No description yet."}
            </p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="m-0 mb-3 text-base font-bold">Appears in topics</h2>
          <div className="flex flex-wrap gap-2.5">
            {appearsInTopicIds.map((id) => (
              <Link
                key={id}
                href={`/maps/${id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-ml-line bg-ml-card px-3.5 py-2 text-[0.88rem] font-medium text-ml-ink no-underline hover:border-ml-blue hover:text-ml-blue"
              >
                {topicTitles.get(id) ?? id}
                <IconChevronRight />
              </Link>
            ))}
          </div>
          {appearsInTopicIds.length === 0 ? <p className="text-[0.95rem] text-ml-muted">Not linked to a topic yet.</p> : null}
        </section>

        <section className="mb-8">
          <h2 className="m-0 mb-3 text-base font-bold">Linked learning nodes</h2>
          <p className="mb-3 text-[0.9rem] text-ml-muted">Paths in the learning map that include this concept.</p>
          <ul className="m-0 list-none p-0">
            {linkedNodes.map((n) => {
              const path = getNodePath(state.nodes, n.id);
              const pathLabel = path.map((p) => p.title).join(" / ");
              return (
                <li key={n.id}>
                  <Link
                    href={`/nodes/${n.id}`}
                    className="mb-2.5 flex items-center gap-3 rounded-ml-sm border border-ml-line bg-ml-card px-4 py-3.5 no-underline text-ml-ink hover:border-ml-hairline"
                  >
                    <IconKnowledgeBase />
                    <span className="min-w-0 flex-1 font-medium">{pathLabel}</span>
                    <IconChevronRight />
                  </Link>
                </li>
              );
            })}
          </ul>
          {linkedNodes.length === 0 ? <p className="text-[0.95rem] text-ml-muted">No nodes use this concept.</p> : null}
        </section>

        <section>
          <h2 className="m-0 mb-3 text-base font-bold">Related concepts</h2>
          <div className="flex flex-wrap gap-2.5">
            {related.map((row) => (
              <Link
                key={`${row.otherId}-${row.label}`}
                href={`/concepts/${row.otherId}`}
                className="rounded-full bg-ml-blue-soft px-3.5 py-2 text-[0.88rem] font-medium text-ml-blue-deep no-underline"
              >
                {row.otherName}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div>
        <div className="mb-5 rounded-ml border border-ml-line bg-ml-card p-5 shadow-ml-card">
          <h2 className="m-0 mb-4 flex items-center gap-2.5 text-base font-bold">
            <IconKnowledgeBase /> Local network preview
          </h2>
          <div className="mb-4 max-w-full">
            <ConceptNetworkGraph graph={localGraph} selectedId={concept.id} />
          </div>
          {appearsInTopicIds[0] ? (
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-ml-sm border-[1.5px] border-ml-blue py-3 font-semibold text-ml-blue no-underline hover:bg-ml-blue-soft"
              href={`/maps/${appearsInTopicIds[0]}`}
            >
              View in Learning Map
              <IconExternalLink />
            </Link>
          ) : null}
        </div>

        <div className="rounded-ml border border-ml-line bg-ml-card p-5 shadow-ml-card">
          <h2 className="m-0 mb-4 text-base font-bold">About this concept</h2>
          <dl className="m-0">
            <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-ml-line py-2.5 text-[0.9rem] last:border-b-0">
              <dt className="m-0 text-ml-muted">Type</dt>
              <dd className="m-0 font-medium">Concept</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-ml-line py-2.5 text-[0.9rem] last:border-b-0">
              <dt className="m-0 text-ml-muted">Created</dt>
              <dd className="m-0 font-medium">{formatConceptDate(concept.createdAt)}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-ml-line py-2.5 text-[0.9rem] last:border-b-0">
              <dt className="m-0 text-ml-muted">Last updated</dt>
              <dd className="m-0 font-medium">{formatConceptDate(concept.updatedAt)}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-ml-line py-2.5 text-[0.9rem] last:border-b-0">
              <dt className="m-0 text-ml-muted">Also known as</dt>
              <dd className="m-0 font-medium">
                {concept.aliases.length ? concept.aliases.join(", ") : concept.name}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
