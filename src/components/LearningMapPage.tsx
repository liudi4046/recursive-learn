"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import type { AppState } from "@/domain/app-state";
import {
  deleteNodeAndSubtree,
  setActiveMapByRootId,
  setActiveNodeId,
  setNodeMastery
} from "@/domain/app-state";
import { getRootNode } from "@/domain/topic-tree";
import { useLocale } from "@/i18n/locale-context";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  IconCheckCircle,
  IconChevronRight,
  IconClose,
  IconDot,
  IconExternalLink,
  IconSearch,
  IconTrash
} from "./Icons";
import { MarkdownAnswer } from "./MarkdownAnswer";
import { TopicNodeTreeView } from "./TopicNodeTreeView";

const btnMasteryMastered = (on: boolean) =>
  on ? "bg-transparent text-ml-green" : "bg-transparent text-ml-muted";

const btnMasteryUnmastered = (on: boolean) =>
  on ? "bg-transparent text-ml-yellow" : "bg-transparent text-ml-muted";

/** Preview text in the map sidebar; longer answers are cut with a trailing "......" (still markdown). */
const MAP_ANSWER_PREVIEW_MAX = 200;

function truncateMapPreviewBody(source: string, max: number = MAP_ANSWER_PREVIEW_MAX): string {
  if (source.length <= max) return source;
  let cut = source.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const lastNl = cut.lastIndexOf("\n");
  const breakAt = Math.max(lastSpace, lastNl);
  if (breakAt > max * 0.4) {
    cut = cut.slice(0, breakAt);
  }
  return `${cut.trimEnd()}......`;
}

export function LearningMapPage({
  state,
  onStateChange,
  mapRootId: mapRootIdParam
}: {
  state: AppState;
  onStateChange: (state: AppState | null) => void;
  /** When set (e.g. from `/maps/[mapRootId]`), focus this map before `activeMapRootId` updates. */
  mapRootId?: string;
}) {
  const { t } = useLocale();
  const targetRootId = mapRootIdParam ?? state.activeMapRootId;
  const mapRoot = getRootNode(state.nodes, targetRootId);
  const [q, setQ] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);

  useLayoutEffect(() => {
    let next = state;
    if (mapRootIdParam && state.activeMapRootId !== mapRootIdParam) {
      next = setActiveMapByRootId(state, mapRootIdParam);
    }
    const rid = mapRootIdParam ?? next.activeMapRootId;
    const a = next.nodes.find((n) => n.id === next.activeNodeId);
    if (a && a.mapRootId === rid) {
      if (next !== state) {
        onStateChange(next);
      }
      return;
    }
    const r = getRootNode(next.nodes, rid);
    if (r) {
      if (r.id === next.activeNodeId) {
        if (next !== state) {
          onStateChange(next);
        }
        return;
      }
      onStateChange(setActiveNodeId(next, r.id));
      return;
    }
    if (next !== state) {
      onStateChange(next);
    }
  }, [mapRootIdParam, state, onStateChange]);

  const selected = mapRoot
    ? state.nodes.find((n) => n.id === state.activeNodeId && n.mapRootId === mapRoot.id) ??
      getRootNode(state.nodes, mapRoot.id) ??
      state.nodes[0]
    : state.nodes[0];
  const pendingDeleteNode = pendingDeleteNodeId
    ? state.nodes.find((n) => n.id === pendingDeleteNodeId)
    : null;
  const leadAnswerRaw = selected.contentBlocks[0]?.answer;
  const leadAnswer =
    leadAnswerRaw != null && String(leadAnswerRaw).trim() !== ""
      ? String(leadAnswerRaw).trim()
      : null;
  const leadAnswerPreview = leadAnswer != null ? truncateMapPreviewBody(leadAnswer) : null;

  if (!mapRoot) {
    return (
      <main className="mx-auto max-w-[1320px] px-10 pb-12 pt-6">{t("mapNoSession")}</main>
    );
  }

  return (
    <main className="mx-auto max-w-[1320px] px-10 pb-12 pt-6">
      <nav className="mb-2 text-[0.88rem]" aria-label="Breadcrumb">
        <Link className="font-medium text-ml-blue no-underline hover:underline" href="/maps">
          {t("mapsBreadcrumb")}
        </Link>
        <span className="mx-2 text-ml-muted">&gt;</span>
        <span>{mapRoot.title}</span>
      </nav>
      <h1 className="mb-5 text-[1.75rem] font-bold text-ml-ink">{mapRoot.title}</h1>

      <div
        className={[
          "grid items-stretch gap-6",
          panelOpen ? "[grid-template-columns:1fr_320px]" : "[grid-template-columns:1fr_48px]",
          "max-[960px]:[grid-template-columns:1fr]"
        ].join(" ")}
      >
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-ml border border-ml-line bg-ml-card shadow-ml-card">
          <div className="flex flex-wrap items-center border-b border-ml-line bg-ml-toolbar px-5 py-4">
            <div className="relative w-full min-w-0">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ml-muted"
                aria-hidden
              >
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="search"
                aria-label={t("mapSearchNodes")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("mapSearchPlaceholder")}
                className="w-full min-w-0 rounded-full border border-ml-line bg-ml-card py-2.5 pl-10 pr-3.5"
              />
            </div>
          </div>
          <TopicNodeTreeView
            state={state}
            mapRootId={mapRoot.id}
            q={q}
            selectedId={selected.id}
            onSelect={(id) => {
              onStateChange(setActiveNodeId(state, id));
              setPanelOpen(true);
            }}
          />
        </div>

        {selected ? (
          <aside
            className={[
              "sticky top-5 self-start rounded-ml border border-ml-line bg-ml-card shadow-ml-card max-[960px]:static",
              panelOpen ? "p-5" : "flex items-start justify-center p-2"
            ].join(" ")}
            aria-label={t("mapSelectedPanel")}
          >
            {panelOpen ? (
              <>
                <div className="mb-3 flex items-start">
                  <button
                    type="button"
                    className="cursor-pointer rounded-ml-sm border-0 bg-ml-segment-bg p-1.5 text-ml-muted"
                    aria-label={t("mapClosePanel")}
                    onClick={() => setPanelOpen(false)}
                  >
                    <IconClose />
                  </button>
                </div>
                <h2 className="mb-3 text-[1.2rem] font-semibold leading-tight">{selected.title}</h2>
                {leadAnswerPreview ? (
                  <div
                    className="mb-4 rounded-ml-sm border border-ml-line bg-ml-preview-bg px-3 py-2.5"
                    aria-label={t("mapAnswerPreview")}
                  >
                    <MarkdownAnswer
                      source={leadAnswerPreview}
                      className="!text-[0.88rem] !leading-[1.55] [&_p]:!mb-1.5 [&_li]:!my-0 [&_ol]:!my-1.5 [&_ul]:!my-1.5"
                    />
                  </div>
                ) : (
                  <p className="mb-4 text-[0.88rem] leading-relaxed text-ml-muted">{t("mapNoAnswerYet")}</p>
                )}
                <div
                  className="inline-flex w-full min-w-0 overflow-hidden rounded-ml-sm border border-ml-hairline bg-ml-card [&>button]:min-w-0 [&>button]:flex-1"
                  role="group"
                  aria-label={t("mapMasteryGroup")}
                >
                  <button
                    type="button"
                    className={[
                      "inline-flex items-center justify-center gap-2 border-0 bg-transparent px-3 py-2.5 text-[0.88rem] font-medium",
                      "cursor-pointer",
                      btnMasteryUnmastered(selected.status === "unmastered")
                    ].join(" ")}
                    onClick={() => onStateChange(setNodeMastery(state, selected.id, "unmastered"))}
                  >
                    <IconDot className="shrink-0" />
                    {t("nodeUnmastered")}
                  </button>
                  <button
                    type="button"
                    className={[
                      "inline-flex items-center justify-center gap-2 border-0 bg-transparent px-3 py-2.5 text-[0.88rem] font-medium",
                      "cursor-pointer",
                      btnMasteryMastered(selected.status === "mastered")
                    ].join(" ")}
                    onClick={() => onStateChange(setNodeMastery(state, selected.id, "mastered"))}
                  >
                    <IconCheckCircle className="shrink-0" />
                    {t("nodeMastered")}
                  </button>
                </div>
                <Link
                  className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-ml-sm bg-ml-blue px-5 py-3.5 font-semibold !text-white no-underline shadow-ml-cta-tight hover:bg-ml-blue-deep"
                  href={`/nodes/${selected.id}`}
                >
                  {t("mapOpenNode")}
                  <IconExternalLink />
                </Link>
                <button
                  type="button"
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-ml-sm border border-ml-line bg-ml-card px-5 py-2.5 text-[0.88rem] font-semibold text-ml-error shadow-ml-card hover:bg-red-50"
                  onClick={() => setPendingDeleteNodeId(selected.id)}
                >
                  <IconTrash className="h-4 w-4 shrink-0" />
                  {t("mapMapDeleteNode")}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-ml border-0 bg-transparent p-2 text-ml-blue transition hover:bg-ml-blue-soft/60"
                aria-label={t("mapShowDetails")}
                onClick={() => setPanelOpen(true)}
              >
                <IconChevronRight className="h-5 w-5 -scale-x-100" aria-hidden />
              </button>
            )}
          </aside>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingDeleteNode != null}
        title={t("mapDeleteTitle")}
        description={t("mapDeleteBody")}
        confirmLabel={t("mapDeleteOk")}
        onCancel={() => setPendingDeleteNodeId(null)}
        onConfirm={() => {
          if (!pendingDeleteNodeId) return;
          const next = deleteNodeAndSubtree(state, pendingDeleteNodeId);
          setPendingDeleteNodeId(null);
          if (next == null) {
            onStateChange(null);
            return;
          }
          onStateChange(next);
        }}
      />
    </main>
  );
}
