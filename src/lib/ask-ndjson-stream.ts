import type { CreateNodeOutput, WebSourceSummary } from "@/domain/types";

type NdOut = {
  t?: string;
  title?: string;
  done?: boolean;
  full?: string;
  err?: string;
  output?: CreateNodeOutput;
  webSearchRan?: boolean;
  webSources?: WebSourceSummary[];
};

export type ParseAskStreamDone =
  | { kind: "just_ask"; full: string; webSearchRan: boolean; webSources: WebSourceSummary[] }
  | { kind: "create_child"; output: CreateNodeOutput; webSearchRan: boolean; webSources: WebSourceSummary[] }
  | { err: string };

/**
 * NDJSON from POST /api/ask (just_ask or create_child_node). Forwards first-line web search metadata
 * to `onStreamMeta` as soon as it arrives.
 */
export function parseAskNdjsonStream(
  body: ReadableStream<Uint8Array> | null,
  onToken: (delta: string) => void,
  onStreamMeta: (m: { webSearchRan: boolean; webSources: WebSourceSummary[] }) => void,
  onCreateChildTitle?: (title: string) => void
): Promise<ParseAskStreamDone> {
  if (!body) return Promise.resolve({ err: "No response body" });
  return (async () => {
    const reader = body.getReader();
    const dec = new TextDecoder();
    let buffer = "";
    let webSearchRan = false;
    let webSources: WebSourceSummary[] = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            try {
              const o = JSON.parse(buffer) as NdOut;
              if (o.err) return { err: o.err };
              if (typeof o.title === "string" && o.title) onCreateChildTitle?.(o.title);
              if (o.webSearchRan === true) {
                webSearchRan = true;
                webSources = o.webSources ?? [];
                onStreamMeta({ webSearchRan, webSources });
              }
              if (o.done && o.output) {
                return { kind: "create_child", output: o.output, webSearchRan, webSources };
              }
              if (o.done && typeof o.full === "string") {
                return { kind: "just_ask", full: o.full, webSearchRan, webSources };
              }
            } catch {
              // ignore
            }
          }
          return { err: "Stream closed unexpectedly" };
        }
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let o: NdOut;
          try {
            o = JSON.parse(line) as NdOut;
          } catch {
            continue;
          }
          if (o.err) {
            return { err: o.err };
          }
          if (o.webSearchRan === true) {
            webSearchRan = true;
            webSources = o.webSources ?? [];
            onStreamMeta({ webSearchRan, webSources });
          }
          if (typeof o.title === "string" && o.title) {
            onCreateChildTitle?.(o.title);
          }
          if (o.t) {
            onToken(o.t);
          }
          if (o.done === true) {
            if (o.output) {
              return { kind: "create_child", output: o.output, webSearchRan, webSources };
            }
            if (typeof o.full === "string") {
              return { kind: "just_ask", full: o.full, webSearchRan, webSources };
            }
            return { err: "Invalid stream end" };
          }
        }
      }
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Stream read failed" };
    }
  })();
}
