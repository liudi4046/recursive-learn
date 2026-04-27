import { describe, expect, it } from "vitest";
import type { LearningNode } from "./types";
import { filterNodesByKeyword, nodeMatchesKeywordQuery } from "./node-search";

const baseNode = (overrides: Partial<LearningNode>): LearningNode => ({
  id: "n1",
  mapRootId: "root1",
  parentNodeId: null,
  title: "Alpha Topic",
  contentBlocks: [
    {
      id: "b1",
      question: "What is X?",
      answer: "X is a letter.",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ],
  justAskEntries: [],
  status: "unmastered",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides
});

describe("nodeMatchesKeywordQuery", () => {
  it("returns false for empty or whitespace query", () => {
    const n = baseNode({});
    expect(nodeMatchesKeywordQuery(n, "")).toBe(false);
    expect(nodeMatchesKeywordQuery(n, "   ")).toBe(false);
  });

  it("matches title case-insensitively", () => {
    const n = baseNode({ title: "Quantum Mechanics" });
    expect(nodeMatchesKeywordQuery(n, "quantum")).toBe(true);
    expect(nodeMatchesKeywordQuery(n, "MECHAN")).toBe(true);
  });

  it("matches block question and answer", () => {
    const n = baseNode({});
    expect(nodeMatchesKeywordQuery(n, "what is")).toBe(true);
    expect(nodeMatchesKeywordQuery(n, "letter")).toBe(true);
  });

  it("matches just-ask entries", () => {
    const n = baseNode({
      justAskEntries: [
        {
          id: "j1",
          question: "Side question?",
          answer: "Side answer about frogs.",
          createdAt: "2026-01-02T00:00:00.000Z"
        }
      ]
    });
    expect(nodeMatchesKeywordQuery(n, "frogs")).toBe(true);
    expect(nodeMatchesKeywordQuery(n, "side question")).toBe(true);
  });

  it("matches reference source title and snippet", () => {
    const n = baseNode({
      referenceSources: [{ title: "Wikipedia: Foo", url: "https://ex", snippet: "Foo is a bar." }]
    });
    expect(nodeMatchesKeywordQuery(n, "wikipedia")).toBe(true);
    expect(nodeMatchesKeywordQuery(n, "bar")).toBe(true);
  });
});

describe("filterNodesByKeyword", () => {
  it("returns empty when query is empty", () => {
    const a = baseNode({ id: "a", title: "Zed" });
    const b = baseNode({ id: "b", title: "Beta", mapRootId: "root1", parentNodeId: "a" });
    expect(filterNodesByKeyword([a, b], "")).toEqual([]);
    expect(filterNodesByKeyword([a, b], "  ")).toEqual([]);
  });

  it("sorts by title then id", () => {
    const z = baseNode({ id: "z", title: "Zed" });
    const a2 = baseNode({ id: "a2", title: "Alpha", mapRootId: "r2", parentNodeId: null });
    const a1 = baseNode({ id: "a1", title: "Alpha", mapRootId: "r1", parentNodeId: null });
    const out = filterNodesByKeyword([z, a2, a1], "alpha");
    expect(out.map((n) => n.id)).toEqual(["a1", "a2"]);
  });
});
