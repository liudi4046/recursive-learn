import type { LearningNode } from "./types";

function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** True if `needle` appears in `haystack` (case-insensitive). */
function includesCi(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

export function nodeMatchesKeywordQuery(node: LearningNode, rawQuery: string): boolean {
  const q = normalizeQuery(rawQuery);
  if (!q) return false;

  if (includesCi(node.title, q)) return true;

  for (const b of node.contentBlocks) {
    if (b.question && includesCi(b.question, q)) return true;
    if (includesCi(b.answer, q)) return true;
  }

  for (const j of node.justAskEntries) {
    if (includesCi(j.question, q)) return true;
    if (includesCi(j.answer, q)) return true;
  }

  for (const s of node.referenceSources ?? []) {
    if (includesCi(s.title, q)) return true;
    if (includesCi(s.snippet, q)) return true;
  }

  return false;
}

export function filterNodesByKeyword(nodes: LearningNode[], rawQuery: string): LearningNode[] {
  const q = normalizeQuery(rawQuery);
  if (!q) return [];

  const hits = nodes.filter((n) => nodeMatchesKeywordQuery(n, q));
  return hits.slice().sort((a, b) => {
    const t = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}
