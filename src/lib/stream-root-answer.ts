import type { AppState } from "@/domain/app-state";
import {
  finalizeCreateChild,
  mergeCreateChildStreamMeta,
  replaceChildFirstBlockAnswer,
  setCreateChildStreamUi,
  setCreateChildStreamTitleReady,
  setNodeTitle
} from "@/domain/app-state";
import { parseAskNdjsonStream } from "@/lib/ask-ndjson-stream";
import {
  clearCreateChildStream,
  publishCreateChildStreamText
} from "@/lib/create-child-stream-buffer";
import { messageForAskApiError, type AskApiErrorBody } from "@/lib/ask-api-error-message";
import { buildAskLlmFields, loadDeepseekSettings, webSearchApiFields } from "@/lib/deepseek-settings";
import type { AppLocale, MessageKey } from "@/i18n/strings";

function createStreamThrottler(
  onFlush: (text: string) => void,
  minIntervalMs: number
): { push: (chunk: string) => void; flushNow: () => void; cancel: () => void } {
  let acc = "";
  let lastFlush = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return {
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

/**
 * Streams create-child–protocol output (model title + body + META line) into a new root node,
 * same contract as add-child. Root node title is updated as the model streams the short title.
 */
export async function streamRootAnswer(
  initial: AppState,
  rootId: string,
  question: string,
  useWebSearch: boolean,
  setState: (next: AppState) => void,
  options: { t: (key: MessageKey) => string; locale: AppLocale }
): Promise<void> {
  let current = initial;
  if (initial.askSetupBanner != null) {
    current = { ...initial, askSetupBanner: null };
    setState(current);
  }
  try {
    const mapRoot = current.nodes.find((n) => n.id === rootId);
    if (!mapRoot) return;

    clearCreateChildStream();
    const settings = await loadDeepseekSettings();
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapRoot: { title: mapRoot.title },
        nodes: current.nodes,
        activeNodeId: rootId,
        question,
        mode: "create_child_node",
        stream: true,
        webSearch: useWebSearch,
        locale: options.locale,
        ...buildAskLlmFields(settings),
        ...webSearchApiFields(settings, useWebSearch)
      })
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as AskApiErrorBody;
      const msg = messageForAskApiError(errBody, options.t);
      current = { ...current, askSetupBanner: { nodeId: rootId, message: msg } };
      setState(current);
      return;
    }

    let didStreamingUi = false;
    const markStreaming = () => {
      if (didStreamingUi) return;
      didStreamingUi = true;
      publishCreateChildStreamText(rootId, "");
      const prev = current.createChildStreamUi;
      const carry =
        prev && prev.childId === rootId
          ? {
              webSearchRan: prev.webSearchRan,
              webSources: prev.webSources,
              streamPurpose: prev.streamPurpose,
              streamTitleSet: prev.streamTitleSet
            }
          : {};
      current = setCreateChildStreamUi(current, { childId: rootId, phase: "streaming", ...carry });
      setState(current);
    };

    const thr = createStreamThrottler((text) => {
      publishCreateChildStreamText(rootId, text);
      current = replaceChildFirstBlockAnswer(current, rootId, text);
      setState(current);
    }, 48);

    const out = await parseAskNdjsonStream(
      res.body,
      (d) => {
        markStreaming();
        thr.push(d);
      },
      (m) => {
        current = mergeCreateChildStreamMeta(current, rootId, m);
        setState(current);
      },
      (title) => {
        markStreaming();
        let next = setNodeTitle(current, rootId, title);
        next = setCreateChildStreamTitleReady(next, rootId);
        current = next;
        setState(current);
      }
    );

    thr.flushNow();
    if ("err" in out) {
      return;
    }
    if (out.kind === "create_child") {
      current = finalizeCreateChild(
        current,
        rootId,
        question,
        out.output,
        out.webSearchRan
          ? { referenceSources: { webSearchUsed: true, webSources: out.webSources } }
          : undefined
      );
      setState(current);
    }
  } finally {
    clearCreateChildStream();
    if (current.createChildStreamUi != null) {
      current = setCreateChildStreamUi(current, null);
      setState(current);
    }
  }
}
