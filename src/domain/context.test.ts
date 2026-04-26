import { describe, expect, it } from "vitest";
import { buildAskContext } from "./context";
import { createChildNode, createTopicWithRoot } from "./learning-tree";

describe("buildAskContext", () => {
  it("includes selected ask mode and only the active path", () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const child = createChildNode(session.nodes[0], {
      title: "Self-attention",
      answer: "Attention answer",
      conceptCandidate: "Self-attention",
      relatedConceptCandidates: []
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "Positional Encoding",
      answer: "Position answer",
      conceptCandidate: "Positional Encoding",
      relatedConceptCandidates: []
    });

    const context = buildAskContext({
      topic: session.topic,
      nodes: [session.nodes[0], child, sibling],
      activeNodeId: child.id,
      question: "Q/K/V 是什么？",
      mode: "create_child_node",
      relatedConcepts: [{ name: "Self-attention", description: null }]
    });

    expect(context.mode).toBe("create_child_node");
    expect(context.path.map((node) => node.title)).toEqual(["Transformer", "Self-attention"]);
    expect(JSON.stringify(context)).not.toContain("Positional Encoding");
  });
});
