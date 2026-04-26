import { describe, expect, it } from "vitest";
import { createInitialState, handleAskResult } from "./app-state";

describe("app state", () => {
  it("creates a topic, root node, and empty concept list", () => {
    const state = createInitialState("Transformer");
    expect(state.topics).toHaveLength(1);
    expect(state.nodes).toHaveLength(1);
    expect(state.activeNodeId).toBe(state.nodes[0].id);
    expect(state.concepts).toEqual([]);
  });

  it("adds a child node for create child mode", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "create_child_node",
      question: "Q/K/V 是什么？",
      output: {
        title: "Q/K/V",
        answer: "Answer",
        conceptCandidate: "Q/K/V",
        relatedConceptCandidates: []
      }
    });
    expect(next.nodes).toHaveLength(2);
    expect(next.activeNodeId).toBe(next.nodes[1].id);
    expect(next.concepts.some((concept) => concept.name === "Q/K/V")).toBe(true);
  });

  it("continues current node without changing node count", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "continue_here",
      question: "Give an example",
      output: {
        answer: "Example answer",
        conceptCandidate: null,
        relatedConceptCandidates: []
      }
    });
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].contentBlocks).toHaveLength(2);
  });

  it("adds concept relations for related candidates when creating a child", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "create_child_node",
      question: "Q/K/V?",
      output: {
        title: "Q/K/V",
        answer: "Answer",
        conceptCandidate: "Q/K/V",
        relatedConceptCandidates: [{ name: "Self-attention", relation: "part_of" }]
      }
    });
    const qk = next.concepts.find((c) => c.name === "Q/K/V");
    const sa = next.concepts.find((c) => c.name === "Self-attention");
    expect(qk).toBeDefined();
    expect(sa).toBeDefined();
    expect(next.conceptRelations).toHaveLength(1);
    expect(next.conceptRelations[0].sourceConceptId).toBe(qk!.id);
    expect(next.conceptRelations[0].targetConceptId).toBe(sa!.id);
    expect(next.conceptRelations[0].label).toBe("part_of");
  });
});
