"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppState } from "@/domain/app-state";
import {
  addChildNodeFromJustAsk,
  addPlaceholderChild,
  deleteNodeAndSubtree,
  finalizeCreateChild,
  handleAskResult,
  mergeCreateChildStreamMeta,
  removePlaceholderChild,
  setCreateChildStreamTitleReady,
  setCreateChildStreamUi,
  setNodeMastery,
  setNodeTitle
} from "@/domain/app-state";
import { getNodePath } from "@/domain/learning-tree";
import { getRootNode } from "@/domain/topic-tree";
import type { AskMode, WebSourceSummary } from "@/domain/types";
import { useLocale } from "@/i18n/locale-context";
import { parseAskNdjsonStream } from "@/lib/ask-ndjson-stream";
import {
  clearCreateChildStream,
  publishCreateChildStreamText
} from "@/lib/create-child-stream-buffer";
import { buildAskLlmFields, loadDeepseekSettings, webSearchApiFields } from "@/lib/deepseek-settings";
import { ConfirmDialog } from "./ConfirmDialog";
import { CreateChildStreamAnswerP } from "./CreateChildStreamAnswerP";
import { MarkdownAnswer } from "./MarkdownAnswer";
import { QaAnswerBox, QaQuestion } from "./QaBlock";
import { WebSourcesCallout } from "./WebSourcesCallout";
import { PathTraceTreeView } from "./TopicNodeTreeView";
import {
  IconArrowRight,
  IconCheckCircle,
  IconDot,
  IconExternalLink,
  IconGlobe,
  IconNodeCard,
  IconTrash
} from "./Icons";

const btnMasteryMastered = (on: boolean) =>
  on ? "bg-transparent text-ml-green" : "bg-transparent text-ml-muted";

const btnMasteryUnmastered = (on: boolean) =>
  on ? "bg-transparent text-ml-yellow" : "bg-transparent text-ml-muted";

type JustAskPanel = {
  question: string;
  text: string;
  status: "streaming" | "done" | "error";
  errorMessage?: string;
  webSearchRan?: boolean;
  webSources?: WebSourceSummary[];
};

/**
 * Throttles flushes to ~`minIntervalMs` so the answer area re-renders at most ~20/s during streaming
 * (reduces layout jank; first update is immediate when `lastFlush` is 0).
 */
function createStreamThrottler(
  onFlush: (text: string) => void,
  minIntervalMs: number
): { push: (chunk: string) => void; flushNow: () => void; cancel: () => void; getText: () => string } {
  let acc = "";
  let lastFlush = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return {
    getText: () => acc,
    push(chunk: string) {
      acc += chunk;
      const now = performance.now();
      if (now - lastFlush >= minIntervalMs) {
        if (timeout != null) {
          clearTimeout(timeout);
          timeout = null;
        }
        lastFlush = now;
        onFlush(acc);
        return;
      }
      if (timeout != null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = null;
        lastFlush = performance.now();
        onFlush(acc);
      }, minIntervalMs - (now - lastFlush));
    },
    flushNow() {
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastFlush = performance.now();
      onFlush(acc);
    },
    cancel() {
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
    }
  };
}

function useEllipsisDots(active: boolean, intervalMs = 450) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const id = setInterval(() => setStep((s) => (s + 1) % 3), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return active ? ([".", "..", "..."] as const)[step]! : "";
}

export function NodeDetailPage({
  state,
  onStateChange
}: {
  state: AppState;
  onStateChange: (state: AppState | null) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [mode, setMode] = useState<AskMode>("create_child_node");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [justAskPanel, setJustAskPanel] = useState<JustAskPanel | null>(null);
  const [selectedJustAskId, setSelectedJustAskId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const node = state.nodes.find((item) => item.id === state.activeNodeId) ?? state.nodes[0];
  const mapRoot =
    getRootNode(state.nodes, state.activeMapRootId) ??
    (node ? getRootNode(state.nodes, node.mapRootId) : undefined);
  const path = getNodePath(state.nodes, node.id);
  const justAskEntries = node.justAskEntries ?? [];
  const createStream = state.createChildStreamUi;
  const showTitleGenerating =
    createStream != null &&
    createStream.childId === node.id &&
    createStream.streamPurpose === "create_child" &&
    !createStream.streamTitleSet;
  const titleGenDots = useEllipsisDots(showTitleGenerating);

  const selectedEntry =
    selectedJustAskId == null
      ? null
      : (justAskEntries.find((e) => e.id === selectedJustAskId) ?? null);
  const justAskPanelEntryId = justAskPanel
    ? (justAskEntries.find(
        (entry) => entry.question === justAskPanel.question && entry.answer === justAskPanel.text
      )?.id ?? null)
    : null;
  const currentJustAskEntryId = selectedJustAskId ?? justAskPanelEntryId;
  const displayedJustAsk = justAskPanel
    ? {
        question: justAskPanel.question,
        answer: justAskPanel.text,
        status: justAskPanel.status,
        errorMessage: justAskPanel.errorMessage,
        webSearchRan: justAskPanel.webSearchRan,
        webSources: justAskPanel.webSources
      }
    : selectedEntry
      ? {
          question: selectedEntry.question,
          answer: selectedEntry.answer,
          status: "done" as const,
          errorMessage: undefined,
          webSearchRan: selectedEntry.webSearchUsed,
          webSources: selectedEntry.webSources
        }
      : null;

  async function runJustAskStream(q: string) {
    if (!mapRoot) return;
    setJustAskPanel({ question: q, text: "", status: "streaming" });
    setError(null);
    setSubmitting(true);
    const settings = await loadDeepseekSettings();
    const thr = createStreamThrottler((text) => {
      setJustAskPanel((prev) =>
        prev && prev.status === "streaming" ? { ...prev, text } : prev
      );
    }, 48);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapRoot: { title: mapRoot.title },
          nodes: stateRef.current.nodes,
          activeNodeId: stateRef.current.activeNodeId,
          question: q,
          mode: "just_ask",
          stream: true,
          webSearch,
          ...buildAskLlmFields(settings),
          ...webSearchApiFields(settings, webSearch)
        })
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = "error" in errBody && errBody.error ? errBody.error : t("nodeRequestFailed");
        setJustAskPanel({
          question: q,
          text: thr.getText(),
          status: "error",
          errorMessage: msg
        });
        thr.cancel();
        return;
      }
      const out = await parseAskNdjsonStream(
        res.body,
        (d) => {
          thr.push(d);
        },
        (m) => {
          setJustAskPanel((prev) =>
            prev && prev.status === "streaming"
              ? { ...prev, webSearchRan: m.webSearchRan, webSources: m.webSources }
              : prev
          );
        }
      );
      thr.flushNow();
      if ("err" in out) {
        setJustAskPanel({
          question: q,
          text: thr.getText(),
          status: "error",
          errorMessage: out.err
        });
        return;
      }
      if (out.kind !== "just_ask") {
        setJustAskPanel({
          question: q,
          text: thr.getText(),
          status: "error",
          errorMessage: t("nodeUnexpectedStream")
        });
        return;
      }
      setJustAskPanel({
        question: q,
        text: out.full,
        status: "done",
        webSearchRan: out.webSearchRan,
        webSources: out.webSources
      });
      onStateChange(
        handleAskResult(stateRef.current, {
          mode: "just_ask",
          question: q,
          answer: out.full,
          webSearchUsed: out.webSearchRan,
          webSources: out.webSources
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function runCreateChildStream(q: string) {
    if (!mapRoot) return;
    setError(null);
    setSubmitting(true);
    const parentId = stateRef.current.activeNodeId;
    const settings = await loadDeepseekSettings();
    let childId: string = "";
    try {
      clearCreateChildStream();
      const next = addPlaceholderChild(stateRef.current, parentId, q);
      childId = next.activeNodeId;
      stateRef.current = next;
      const withThinking = setCreateChildStreamUi(next, {
        childId,
        phase: "thinking",
        streamPurpose: "create_child"
      });
      stateRef.current = withThinking;
      onStateChange(withThinking);
      setQuestion("");

      router.push(`/nodes/${childId}`);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapRoot: { title: mapRoot.title },
          nodes: stateRef.current.nodes.filter((n) => n.id !== childId),
          activeNodeId: parentId,
          question: q,
          mode: "create_child_node",
          stream: true,
          webSearch,
          ...buildAskLlmFields(settings),
          ...webSearchApiFields(settings, webSearch)
        })
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = "error" in errBody && errBody.error ? errBody.error : t("nodeRequestFailed");
        if (childId) {
          const rolled = removePlaceholderChild(stateRef.current, childId, parentId);
          stateRef.current = rolled;
          onStateChange(rolled);
        }
        router.push(`/nodes/${parentId}`);
        setError(msg);
        return;
      }

      let didStreamingUi = false;
      const markStreaming = () => {
        if (didStreamingUi) return;
        didStreamingUi = true;
        publishCreateChildStreamText(childId, "");
        const prev = stateRef.current.createChildStreamUi;
        const carry =
          prev && prev.childId === childId
            ? {
                webSearchRan: prev.webSearchRan,
                webSources: prev.webSources,
                streamPurpose: prev.streamPurpose,
                streamTitleSet: prev.streamTitleSet
              }
            : {};
        const s = setCreateChildStreamUi(stateRef.current, {
          childId,
          phase: "streaming",
          ...carry
        });
        stateRef.current = s;
        onStateChange(s);
      };
      const thr = createStreamThrottler((text) => {
        publishCreateChildStreamText(childId, text);
      }, 48);
      const out = await parseAskNdjsonStream(
        res.body,
        (d) => {
          markStreaming();
          thr.push(d);
        },
        (m) => {
          const s = mergeCreateChildStreamMeta(stateRef.current, childId, m);
          stateRef.current = s;
          onStateChange(s);
        },
        (title) => {
          markStreaming();
          const titled = setNodeTitle(stateRef.current, childId, title);
          const t = setCreateChildStreamTitleReady(titled, childId);
          stateRef.current = t;
          onStateChange(t);
        }
      );
      thr.flushNow();

      if ("err" in out) {
        const rolled = removePlaceholderChild(stateRef.current, childId, parentId);
        stateRef.current = rolled;
        onStateChange(rolled);
        router.push(`/nodes/${parentId}`);
        setError(out.err);
        return;
      }
      if (out.kind !== "create_child") {
        const rolled = removePlaceholderChild(stateRef.current, childId, parentId);
        stateRef.current = rolled;
        onStateChange(rolled);
        router.push(`/nodes/${parentId}`);
        setError(t("nodeUnexpectedResponse"));
        return;
      }
      const final = finalizeCreateChild(
        stateRef.current,
        childId,
        q,
        out.output,
        out.webSearchRan
          ? { referenceSources: { webSearchUsed: true, webSources: out.webSources } }
          : undefined
      );
      stateRef.current = final;
      onStateChange(final);
    } finally {
      clearCreateChildStream();
      if (stateRef.current.createChildStreamUi != null) {
        const cleared = setCreateChildStreamUi(stateRef.current, null);
        stateRef.current = cleared;
        onStateChange(cleared);
      }
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !mapRoot) return;
    setError(null);

    if (mode === "just_ask") {
      setQuestion("");
      await runJustAskStream(q);
      return;
    }

    await runCreateChildStream(q);
  }

  function confirmDeleteNode() {
    setDeleteDialogOpen(false);
    const wasRoot = node.parentNodeId === null;
    const mapRootId = node.mapRootId;
    const next = deleteNodeAndSubtree(state, node.id);
    if (next == null) {
      onStateChange(null);
      router.push("/maps");
      return;
    }
    onStateChange(next);
    if (wasRoot) {
      router.push("/maps");
    } else {
      router.push(`/maps/${mapRootId}`);
    }
  }

  if (!node || !mapRoot) {
    return <main className="mx-auto max-w-[1200px] px-10 pb-12 pt-7">{t("nodeSessionIncomplete")}</main>;
  }

  const firstBlock = node.contentBlocks[0];
  const leadQuestion =
    firstBlock?.question != null && String(firstBlock.question).trim() !== ""
      ? String(firstBlock.question).trim()
      : null;

  return (
    <main className="mx-auto max-w-[1580px] px-10 pb-12 pt-7 max-[640px]:px-5">
      <div className="grid [grid-template-columns:280px_minmax(0,1fr)_minmax(200px,280px)] items-start gap-8 max-[1180px]:[grid-template-columns:minmax(0,1fr)_minmax(200px,280px)] max-[960px]:[grid-template-columns:1fr]">
        <aside
          className="sticky top-6 self-start rounded-ml border border-ml-line bg-ml-card p-4 shadow-ml-card max-[1180px]:col-span-2 max-[960px]:static max-[960px]:col-span-1"
          aria-label={t("nodeJustAskLog")}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold text-ml-ink">{t("nodeJustAskLog")}</h2>
            {justAskEntries.length > 0 ? (
              <span className="rounded-full bg-ml-blue-soft px-2 py-0.5 text-[0.8rem] font-medium text-ml-blue">
                {justAskEntries.length}
              </span>
            ) : null}
          </div>
          {justAskEntries.length === 0 ? (
            <p className="m-0 text-[0.9rem] leading-relaxed text-ml-muted">{t("nodeJustAskEmpty")}</p>
          ) : (
            <ul className="m-0 flex max-h-[calc(100vh-12rem)] list-none flex-col gap-2 overflow-y-auto p-0" role="list">
              {justAskEntries.map((entry) => {
                const selected = entry.id === currentJustAskEntryId;
                return (
                  <li key={entry.id} className="m-0 p-0">
                    <button
                      type="button"
                      onClick={() => {
                        setJustAskPanel(null);
                        setSelectedJustAskId(entry.id);
                      }}
                      className={[
                        "w-full cursor-pointer rounded-ml-sm border px-3 py-2.5 text-left text-[0.9rem] font-medium leading-snug",
                        "transition-[border-color,background,color] duration-200",
                        selected
                          ? "border-ml-blue bg-ml-blue-soft text-ml-blue"
                          : "border-ml-line bg-ml-preview-bg text-ml-ink hover:border-ml-hairline"
                      ].join(" ")}
                      title={entry.question}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <span className="mb-1 block text-[0.78rem] font-semibold text-ml-blue">
                          {t("nodeJustAskCurrent")}
                        </span>
                      ) : null}
                      <span className="line-clamp-2">{entry.question}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 text-[0.88rem] text-ml-muted">
            {path.map((n, i) => (
              <span key={n.id} className="inline">
                {i > 0 ? <span className="opacity-60"> &gt; </span> : null}
                {n.id === node.id ? (
                  <span aria-current="page">
                    {showTitleGenerating ? null : n.title}
                  </span>
                ) : (
                  <Link className="text-ml-muted no-underline hover:text-ml-blue" href={`/nodes/${n.id}`}>
                    {n.title}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <h1
            className="mb-5 text-[1.85rem] font-bold leading-tight tracking-tight text-ml-ink"
            aria-busy={showTitleGenerating}
          >
            {showTitleGenerating ? (
              <>
                {t("nodeTitleGenerating")}
                <span className="inline-block min-w-[1.25em] font-normal tabular-nums">{titleGenDots}</span>
              </>
            ) : (
              node.title
            )}
          </h1>

          <div className="mb-5 flex w-full min-w-0 flex-wrap items-center gap-2">
            <div
              className="inline-flex min-w-0 overflow-hidden rounded-full border border-ml-hairline bg-ml-card"
              role="group"
              aria-label={t("nodeMastery")}
            >
              <button
                type="button"
                className={[
                  "inline-flex items-center gap-2 border-0 bg-transparent px-5 py-2.5 text-[0.9rem] font-medium",
                  "cursor-pointer",
                  btnMasteryUnmastered(node.status === "unmastered")
                ].join(" ")}
                onClick={() => onStateChange(setNodeMastery(state, node.id, "unmastered"))}
              >
                <IconDot className="shrink-0" />
                {t("nodeUnmastered")}
              </button>
              <button
                type="button"
                className={[
                  "inline-flex items-center gap-2 border-0 bg-transparent px-5 py-2.5 text-[0.9rem] font-medium",
                  "cursor-pointer",
                  btnMasteryMastered(node.status === "mastered")
                ].join(" ")}
                onClick={() => onStateChange(setNodeMastery(state, node.id, "mastered"))}
              >
                <IconCheckCircle className="shrink-0" />
                {t("nodeMastered")}
              </button>
            </div>
            <button
              type="button"
              className={[
                "ml-auto inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full",
                "border border-ml-line bg-ml-card text-ml-muted transition-[color,background,border-color]",
                "hover:border-ml-error/35 hover:bg-red-50 hover:text-ml-error"
              ].join(" ")}
              aria-label={t("nodeDelete")}
              title={t("nodeDelete")}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash className="h-[1.05rem] w-[1.05rem] shrink-0" />
            </button>
          </div>

          <div className="mb-6 rounded-ml border border-ml-line bg-ml-card p-6 shadow-ml-card max-[480px]:px-5 max-[480px]:py-5">
            {leadQuestion ? (
              <QaQuestion variant="lead" className="mb-4">
                {leadQuestion}
              </QaQuestion>
            ) : null}
            {createStream?.childId === node.id && createStream.webSearchRan ? (
              <div className="mb-4">
                <WebSourcesCallout
                  webSearchRan
                  sources={createStream.webSources ?? []}
                  compact
                />
              </div>
            ) : node.referenceSources != null ? (
              <div className="mb-4">
                <WebSourcesCallout
                  webSearchRan
                  sources={node.referenceSources}
                  compact
                />
              </div>
            ) : null}
            <article
              aria-busy={createStream?.childId === node.id}
              className="min-w-0 [contain:layout]"
            >
              {node.contentBlocks.map((block, i) => {
                const streamHere = i === 0 && createStream?.childId === node.id;
                const showStreamCaret = streamHere && createStream?.phase === "streaming";
                const showBlockQuestion = Boolean(
                  block.question && !(i === 0 && leadQuestion)
                );
                const showAnswerHeader = i === 0 && leadQuestion != null;
                return (
                <div
                  key={block.id}
                  className="mb-4 min-h-0 [contain:layout] last:mb-0 [transform:translateZ(0)]"
                >
                  {showBlockQuestion ? (
                    <QaQuestion variant="followUp">{String(block.question)}</QaQuestion>
                  ) : null}
                  <QaAnswerBox
                    withHeader={showAnswerHeader}
                    className={showBlockQuestion ? "mt-0" : ""}
                  >
                    {streamHere && createStream?.phase === "thinking" ? (
                      <div
                        className="flex min-h-[2.5rem] items-center gap-2.5 text-[0.95rem] text-ml-muted"
                        aria-live="polite"
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border-2 border-ml-line border-t-ml-blue animate-spin [animation-duration:0.7s] [backface-visibility:hidden]"
                          aria-hidden
                        />
                        {t("nodeThinking")}
                      </div>
                    ) : showStreamCaret ? (
                      <CreateChildStreamAnswerP
                        streamChildId={node.id}
                        blockAnswer={block.answer}
                        showCaret
                      />
                    ) : (
                      <MarkdownAnswer source={block.answer} />
                    )}
                  </QaAnswerBox>
                </div>
                );
              })}
            </article>
          </div>

          {displayedJustAsk ? (
            <section
              className="mb-6 rounded-ml border border-ml-line bg-ml-card p-5 shadow-ml-card"
              aria-label={t("nodeJustAskLabel")}
              aria-busy={displayedJustAsk.status === "streaming"}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 gap-y-1">
                <p className="m-0 text-[0.8rem] font-semibold tracking-wide text-ml-muted">
                  {t("nodeJustAskLabel")}
                </p>
                {displayedJustAsk.status === "done" && displayedJustAsk.answer.trim() ? (
                  <button
                    type="button"
                    className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-ml-sm border-[1.5px] border-ml-blue bg-ml-card px-3.5 py-1.5 text-[0.85rem] font-semibold text-ml-blue shadow-ml-card hover:bg-ml-blue-soft"
                    onClick={() => {
                      const next = addChildNodeFromJustAsk(
                        state,
                        node.id,
                        displayedJustAsk.question,
                        displayedJustAsk.answer,
                        currentJustAskEntryId
                      );
                      onStateChange(next);
                      setJustAskPanel(null);
                      setSelectedJustAskId(null);
                      router.push(`/nodes/${next.activeNodeId}`);
                    }}
                  >
                    <IconNodeCard />
                    {t("nodeAddAsChild")}
                  </button>
                ) : null}
              </div>
              <QaQuestion variant="justAsk">{displayedJustAsk.question}</QaQuestion>
              {displayedJustAsk.webSearchRan ? (
                <div className="mb-3 mt-3">
                  <WebSourcesCallout
                    webSearchRan
                    sources={displayedJustAsk.webSources ?? []}
                    compact
                  />
                </div>
              ) : null}
              <QaAnswerBox withHeader className="mt-3">
                {displayedJustAsk.status === "error" ? (
                  <p className="m-0 text-[0.95rem] text-ml-error">
                    {displayedJustAsk.errorMessage ?? t("nodeErrorGeneric")}
                  </p>
                ) : (
                  <MarkdownAnswer
                    source={displayedJustAsk.answer}
                    showCaret={displayedJustAsk.status === "streaming"}
                  />
                )}
              </QaAnswerBox>
            </section>
          ) : null}

          <form onSubmit={onSubmit} className="m-0">
            <div className="relative rounded-ml border border-ml-line bg-ml-card">
              <div className="flex items-start gap-2.5 px-3 py-2.5">
                <span className="mt-0.5 shrink-0 text-ml-muted" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="7.5" cy="7.5" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M11 11l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <textarea
                  aria-label={t("nodeAskQuestion")}
                  className="min-h-14 w-full min-w-0 flex-1 resize-y border-0 bg-transparent pb-10 pr-1 outline-none"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.shiftKey) {
                      return;
                    }
                    if (e.nativeEvent.isComposing) {
                      return;
                    }
                    e.preventDefault();
                    if (submitting) {
                      return;
                    }
                    if (!question.trim()) {
                      return;
                    }
                    e.currentTarget.form?.requestSubmit();
                  }}
                  rows={2}
                  placeholder={t("nodeNextPlaceholder")}
                />
              </div>
              <div className="pointer-events-none absolute bottom-1.5 right-1.5 left-1.5 flex flex-wrap items-center justify-end gap-2 sm:left-auto">
                <button
                  type="button"
                  className={[
                    "pointer-events-auto inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-ml-line bg-ml-card/95 shadow-sm backdrop-blur-sm",
                    "transition-[background,color,border-color] duration-150",
                    webSearch
                      ? "border-ml-green/40 bg-ml-green-soft text-ml-green"
                      : "text-ml-muted hover:bg-ml-preview-bg"
                  ].join(" ")}
                  aria-pressed={webSearch}
                  aria-label={t("homeWebSearchAria")}
                  title={t("homeWebSearchTitle")}
                  onClick={() => setWebSearch((on) => !on)}
                >
                  <IconGlobe className="h-3 w-3" />
                </button>
                <div
                  className="pointer-events-auto flex min-w-0 max-w-full items-center overflow-x-auto rounded-md border border-ml-line bg-ml-card/95 p-0.5 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-sm [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label={t("nodeAnswerTarget")}
                >
                  <button
                    type="button"
                    className={[
                      "inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[0.57rem] font-semibold leading-tight",
                      "transition-[background,color] duration-150 min-[400px]:text-[0.62rem] sm:text-[0.68rem]",
                      mode === "create_child_node"
                        ? "bg-ml-blue-soft text-ml-blue"
                        : "text-ml-muted hover:bg-ml-preview-bg"
                    ].join(" ")}
                    onClick={() => setMode("create_child_node")}
                  >
                    <IconNodeCard className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                    <span className="whitespace-nowrap">{t("nodeCreateChild")}</span>
                  </button>
                  <div className="mx-0.5 h-4 w-px shrink-0 self-center bg-ml-line" aria-hidden />
                  <button
                    type="button"
                    className={[
                      "inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[0.57rem] font-semibold leading-tight",
                      "transition-[background,color] duration-150 min-[400px]:text-[0.62rem] sm:text-[0.68rem]",
                      mode === "just_ask"
                        ? "bg-ml-blue-soft text-ml-blue"
                        : "text-ml-muted hover:bg-ml-preview-bg"
                    ].join(" ")}
                    onClick={() => setMode("just_ask")}
                  >
                    <span className="whitespace-nowrap">{t("nodeJustAskMode")}</span>
                  </button>
                </div>
                <button
                  type="submit"
                  className="pointer-events-auto inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-ml-blue text-white shadow-ml-cta-tight transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={submitting}
                  aria-label={
                    mode === "create_child_node" ? t("nodeSubmitCreateChild") : t("nodeSubmitJustAsk")
                  }
                >
                  <IconArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {error ? <p className="mt-2 text-[0.9rem] text-ml-error">{error}</p> : null}
          </form>
        </div>

        <aside
          className="sticky top-6 w-full max-w-[280px] rounded-ml border border-ml-line bg-ml-card p-4 shadow-ml-card max-[960px]:static max-[960px]:max-w-none"
          aria-label={t("nodeLearningTrace")}
        >
          <div className="mb-4 flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <h2 className="m-0 text-base font-semibold">{t("nodeLearningTrace")}</h2>
            <Link
              className="inline-flex w-fit cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-ml-sm border-[1.5px] border-ml-blue bg-ml-card px-3 py-1.5 text-[0.85rem] font-semibold text-ml-blue no-underline hover:bg-ml-blue-soft"
              href={`/maps/${mapRoot.id}`}
            >
              {t("nodeFullMap")}
              <IconExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <PathTraceTreeView
            state={state}
            mapRootId={mapRoot.id}
            path={path}
            activeNodeId={node.id}
          />
        </aside>
      </div>
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("nodeDeleteTitle")}
        description={t("nodeDeleteBody")}
        confirmLabel={t("nodeDelete")}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteNode}
      />
    </main>
  );
}
