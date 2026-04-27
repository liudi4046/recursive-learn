"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createInitialState,
  createRootNode,
  deleteNodeAndSubtree,
  replaceChildFirstBlockAnswer,
  setCreateChildStreamUi,
  setNodeFirstBlockQuestion
} from "@/domain/app-state";
import { getRootNode } from "@/domain/topic-tree";
import type { LearningNode } from "@/domain/types";
import { streamRootAnswer } from "@/lib/stream-root-answer";
import { useLocale } from "@/i18n/locale-context";
import { useAppState } from "@/state/app-state-context";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconGlobe, IconTrash } from "@/components/Icons";

const MAPS_PAGE_SIZE = 6;

function answerPlainPreview(source: string, maxLen = 200): string {
  const t = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .replace(/[*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) {
    return t;
  }
  return `${t.slice(0, maxLen).trim()}…`;
}

function rootAnswerPreview(root: LearningNode): string | null {
  const raw = root.contentBlocks[0]?.answer?.trim() ?? "";
  if (!raw) {
    return null;
  }
  return answerPlainPreview(raw);
}

export default function MapsIndexPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { rehydrated, state, setState } = useAppState();
  const [query, setQuery] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [deleteMapRootId, setDeleteMapRootId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const nodes = state?.nodes ?? [];
  const roots = nodes.filter((n) => n.parentNodeId === null);
  const hasRoots = roots.length > 0;
  const totalPages = hasRoots ? Math.max(1, Math.ceil(roots.length / MAPS_PAGE_SIZE)) : 1;

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);
  const pageOffset = (safePage - 1) * MAPS_PAGE_SIZE;
  const pageRoots = hasRoots ? roots.slice(pageOffset, pageOffset + MAPS_PAGE_SIZE) : [];

  if (!rehydrated) {
    return null;
  }

  function handleCreateRoot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    const created = state ? createRootNode(state, trimmed) : createInitialState(trimmed);
    const next = replaceChildFirstBlockAnswer(created, created.activeNodeId, "");
    const rootId = next.activeNodeId;
    const withQuestion = setNodeFirstBlockQuestion(next, rootId, trimmed);
    const withThinking = setCreateChildStreamUi(withQuestion, {
      childId: rootId,
      phase: "thinking",
      streamPurpose: "create_child"
    });
    setState(withThinking);
    setQuery("");
    router.push(`/nodes/${rootId}`);
    void streamRootAnswer(withThinking, rootId, trimmed, webSearch, setState, { t });
  }

  function confirmDeleteMap() {
    if (!state || !deleteMapRootId) {
      setDeleteMapRootId(null);
      return;
    }
    const root = getRootNode(state.nodes, deleteMapRootId);
    setDeleteMapRootId(null);
    if (!root) return;
    const next = deleteNodeAndSubtree(state, root.id);
    setState(next);
  }

  const rootPendingDelete =
    deleteMapRootId && state ? state.nodes.find((n) => n.id === deleteMapRootId) : null;

  return (
    <main className="mx-auto max-w-[1200px] px-10 py-10">
      <nav className="mb-2 text-[0.88rem] text-ml-muted" aria-label="Breadcrumb">
        <span>{t("mapsBreadcrumb")}</span>
      </nav>
      <h1 className="m-0 text-[1.75rem] font-bold tracking-tight text-ml-ink">{t("mapsTitle")}</h1>
      <p className="mt-2 max-w-lg text-[0.95rem] text-ml-muted">{t("mapsSubtitle")}</p>
      <form
        className="mt-6 flex max-w-2xl flex-wrap items-center gap-3"
        onSubmit={handleCreateRoot}
      >
        <input
          ref={inputRef}
          aria-label={t("mapsNewRootAria")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("homeTopicPlaceholder")}
          className="min-h-12 min-w-[240px] flex-1 rounded-ml-sm border border-ml-line bg-ml-card px-4 py-3 text-[0.95rem] text-ml-ink shadow-ml-card outline-none transition-[border-color,box-shadow] placeholder:text-ml-muted focus:border-ml-blue focus:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]"
        />
        <button
          type="button"
          className={[
            "inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-ml-sm border shadow-ml-card transition-[background,color,border-color] duration-150",
            webSearch
              ? "border-ml-green/40 bg-ml-green-soft text-ml-green"
              : "border-ml-line bg-ml-card text-ml-muted hover:bg-ml-preview-bg"
          ].join(" ")}
          aria-pressed={webSearch}
          aria-label={t("homeWebSearchAria")}
          title={t("homeWebSearchTitle")}
          onClick={() => setWebSearch((on) => !on)}
        >
          <IconGlobe className="h-5 w-5" />
        </button>
        <button
          type="submit"
          className="min-h-12 shrink-0 cursor-pointer rounded-ml-sm bg-ml-blue px-5 py-3 text-[0.92rem] font-semibold text-white shadow-ml-cta hover:bg-ml-blue-deep"
        >
          {t("mapsCreateRoot")}
        </button>
      </form>
      {!hasRoots ? (
        <p className="mt-6 text-[0.95rem] text-ml-muted">
          {t("mapsNoRoots")}
        </p>
      ) : null}
      {hasRoots ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageRoots.map((root) => {
              const answerPreview = rootAnswerPreview(root);
              return (
                <div
                  key={root.id}
                  className={[
                    "group relative overflow-hidden rounded-ml",
                    "border border-ml-line bg-ml-card shadow-ml-card transition-[box-shadow,transform] duration-200",
                    "hover:-translate-y-0.5 hover:border-ml-hairline hover:shadow-ml"
                  ].join(" ")}
                >
                  <Link
                    href={`/maps/${root.id}`}
                    aria-label={t("mapsOpenMap", { title: root.title })}
                    className="block min-h-0 min-w-0 px-4 pb-4 pl-4 pr-12 pt-4 no-underline text-inherit"
                  >
                    <p className="m-0 line-clamp-2 text-[0.98rem] font-semibold leading-snug text-ml-ink group-hover:text-ml-blue">
                      {root.title}
                    </p>
                    {answerPreview ? (
                      <p className="mt-2.5 line-clamp-3 text-[0.86rem] leading-relaxed text-ml-muted">
                        {answerPreview}
                      </p>
                    ) : (
                      <p className="m-0 mt-2.5 text-[0.86rem] leading-relaxed text-ml-muted/80 italic">
                        {t("mapsNoAnswer")}
                      </p>
                    )}
                  </Link>
                  <button
                    type="button"
                    className={[
                      "absolute right-1.5 top-1.5 z-[1] inline-flex h-9 w-9 cursor-pointer items-center justify-center",
                      "rounded-ml-sm border-0 bg-transparent text-ml-error hover:bg-red-50"
                    ].join(" ")}
                    aria-label={`${t("mapsDeleteMapTitle")} ${root.title}`}
                    title={t("mapsDeleteMapTitle")}
                    onClick={() => setDeleteMapRootId(root.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
              aria-label={t("mapsPagination")}
            >
              <button
                type="button"
                className={[
                  "inline-flex min-h-9 min-w-[6.5rem] cursor-pointer items-center justify-center rounded-ml-sm border px-3 text-[0.88rem] font-medium",
                  safePage <= 1
                    ? "cursor-not-allowed border-ml-line bg-ml-preview-bg text-ml-muted opacity-60"
                    : "border-ml-line bg-ml-card text-ml-ink shadow-sm hover:border-ml-hairline hover:bg-ml-preview-bg"
                ].join(" ")}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("mapsPagePrev")}
              </button>
              <span className="text-[0.88rem] tabular-nums text-ml-muted">
                {t("mapsPageOf", { current: safePage, total: totalPages })}
              </span>
              <button
                type="button"
                className={[
                  "inline-flex min-h-9 min-w-[6.5rem] cursor-pointer items-center justify-center rounded-ml-sm border px-3 text-[0.88rem] font-medium",
                  safePage >= totalPages
                    ? "cursor-not-allowed border-ml-line bg-ml-preview-bg text-ml-muted opacity-60"
                    : "border-ml-line bg-ml-card text-ml-ink shadow-sm hover:border-ml-hairline hover:bg-ml-preview-bg"
                ].join(" ")}
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t("mapsPageNext")}
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
      <ConfirmDialog
        open={rootPendingDelete != null}
        title={t("confirmDeleteMapTitle")}
        description={t("confirmDeleteMapBody")}
        confirmLabel={t("confirmDeleteMapOk")}
        onCancel={() => setDeleteMapRootId(null)}
        onConfirm={confirmDeleteMap}
      />
    </main>
  );
}
