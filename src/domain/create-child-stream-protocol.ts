import { createChildStreamMetaJsonSchema, createNodeOutputSchema } from "./ai-schema";
import type { CreateNodeOutput } from "./types";

const MARK = {
  title: "---ML-TITLE---\n",
  body: "---ML-BODY---\n",
  meta: "---ML-META---\n"
} as const;

/** Strips mistaken label prefixes models sometimes echo on the title line (e.g. 「标题」：). */
function normalizeCreateChildTitleLine(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^「?标题」?\s*[:：]\s*/u, "");
  t = t.replace(/^title\s*[:：]\s*/iu, "");
  return t.trim();
}

/**
 * Inclusive end index for the body: either start of `---ML-META---\n`, or a safe
 * end while the tail might still be an incomplete `meta` prefix (so we do not
 * stream `---M` of the meta marker as if it were body text).
 */
function endBodyExclMeta(buf: string, bodyStart: number): number {
  const { meta } = MARK;
  const mi = buf.indexOf(meta, bodyStart);
  if (mi >= 0) return mi;
  let best = 0;
  for (let k = 1; k < meta.length; k++) {
    if (buf.length < k) break;
    const tail = buf.slice(-k);
    if (meta.startsWith(tail)) {
      best = k;
    }
  }
  return best > 0 ? buf.length - best : buf.length;
}

export class CreateChildProtocolStreamParser {
  private buf = "";
  private bodyEmitted = 0;
  private titleEmitted = false;

  constructor(private readonly onTitle?: (t: string) => void) {}

  /** 在 `---ML-TITLE---` 换行之后，若已收到完整标题行（含行末换行），则先回调标题，不等待正文。 */
  private tryEmitTitleLine(): void {
    if (this.titleEmitted || !this.onTitle) return;
    const ti = this.buf.indexOf(MARK.title);
    if (ti < 0) return;
    const after = ti + MARK.title.length;
    const lineEnd = this.buf.indexOf("\n", after);
    if (lineEnd < 0) return;
    const title = normalizeCreateChildTitleLine(this.buf.slice(after, lineEnd));
    if (title.length < 1) return;
    this.titleEmitted = true;
    this.onTitle(title);
  }

  append(chunk: string): string {
    this.buf += chunk;
    this.tryEmitTitleLine();
    const ti = this.buf.indexOf(MARK.title);
    if (ti < 0) return "";
    const bi = this.buf.indexOf(MARK.body, ti + MARK.title.length);
    if (bi < 0) return "";
    const bodyStart = bi + MARK.body.length;
    const endBody = endBodyExclMeta(this.buf, bodyStart);
    if (endBody <= bodyStart) return "";
    const total = endBody - bodyStart;
    // endBody can shrink when more buffer reveals a longer meta-prefix; never get stuck
    this.bodyEmitted = Math.min(this.bodyEmitted, total);
    if (this.bodyEmitted >= total) return "";
    const out = this.buf.slice(bodyStart + this.bodyEmitted, endBody);
    this.bodyEmitted = total;
    return out;
  }

  finish(): CreateNodeOutput {
    const b = this.buf;
    const ti = b.indexOf(MARK.title);
    if (ti < 0) {
      throw new Error("Model output missing ---ML-TITLE--- (required protocol line).");
    }
    const bi = b.indexOf(MARK.body, ti + MARK.title.length);
    if (bi < 0) {
      throw new Error("Model output missing ---ML-BODY--- (required protocol line).");
    }
    const bodyStart = bi + MARK.body.length;
    const mi = b.indexOf(MARK.meta, bodyStart);
    if (mi < 0) {
      throw new Error("Model output missing ---ML-META--- (required protocol line).");
    }
    const title = normalizeCreateChildTitleLine(b.slice(ti + MARK.title.length, bi));
    const answer = b.slice(bodyStart, mi).trim();
    const jsonPart = b.slice(mi + MARK.meta.length).trim();
    if (!title) {
      throw new Error("Model returned an empty title section.");
    }
    if (answer.length < 1) {
      throw new Error("Model returned an empty body.");
    }
    createChildStreamMetaJsonSchema.parse(JSON.parse(jsonPart) as unknown);
    return createNodeOutputSchema.parse({ title, answer });
  }
}
