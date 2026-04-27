import { describe, expect, it } from "vitest";
import {
  appendJustAskEntry,
  appendToNode,
  createChildNode,
  createTopicWithRoot,
  getNodePath,
  removeJustAskEntry,
  updateNodeStatus
} from "./learning-tree";
import type { CreateNodeOutput, LearningNode } from "./types";

function withTraversalLimit(node: LearningNode, limit = 10): LearningNode {
  let parentReads = 0;
  const parentNodeId = node.parentNodeId;

  return Object.defineProperty({ ...node }, "parentNodeId", {
    enumerable: true,
    get() {
      parentReads += 1;
      if (parentReads > limit) {
        throw new Error("Traversal did not stop");
      }

      return parentNodeId;
    }
  });
}

describe("learning tree domain", () => {
  it("creates a map with one unmastered root node", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");
    const root = session.nodes[0]!;

    expect(session.nodes).toHaveLength(1);
    expect(session.activeNodeId).toBe(root.id);
    expect(root).toMatchObject({
      id: expect.stringMatching(/^node_[A-Za-z0-9_-]{8}$/),
      mapRootId: root.id,
      parentNodeId: null,
      title: "Transformers",
      status: "unmastered"
    });
    expect(session.nodes[0].contentBlocks).toEqual([
      {
        id: expect.stringMatching(/^block_[A-Za-z0-9_-]{8}$/),
        question: null,
        answer: "A transformer is a neural network architecture.",
        createdAt: expect.any(String)
      }
    ]);
  });

  it("creates a child node from model output", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");
    const output: CreateNodeOutput = {
      title: "What is self-attention?",
      answer: "Self-attention compares tokens with each other."
    };

    const child = createChildNode(session.nodes[0], output);

    expect(child).toMatchObject({
      mapRootId: session.nodes[0].id,
      parentNodeId: session.nodes[0].id,
      title: "What is self-attention?",
      status: "unmastered"
    });
    expect(child.contentBlocks).toEqual([
      {
        id: expect.stringMatching(/^block_[A-Za-z0-9_-]{8}$/),
        question: "What is self-attention?",
        answer: "Self-attention compares tokens with each other.",
        createdAt: expect.any(String)
      }
    ]);
    expect(child.justAskEntries).toEqual([]);
  });

  it("appends a just-ask exchange without touching map content", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");

    const updated = appendJustAskEntry(session.nodes[0], "Quick question?", "Quick answer.");

    expect(updated.contentBlocks).toHaveLength(1);
    expect(updated.justAskEntries).toHaveLength(1);
    expect(updated.justAskEntries[0]).toEqual({
      id: expect.stringMatching(/^ja_[A-Za-z0-9_-]{8}$/),
      question: "Quick question?",
      answer: "Quick answer.",
      createdAt: expect.any(String)
    });
  });

  it("removes a just-ask entry by id", () => {
    const session = createTopicWithRoot("T", "root");
    const withJa = appendJustAskEntry(session.nodes[0], "Q?", "A.");
    const id = withJa.justAskEntries[0]!.id;
    const pruned = removeJustAskEntry(withJa, id);
    expect(pruned.justAskEntries).toHaveLength(0);
  });

  it("appends another Q&A block to the same node", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");

    const updated = appendToNode(session.nodes[0], "How does attention work?", "It weights context by relevance.");

    expect(updated.id).toBe(session.nodes[0].id);
    expect(updated.contentBlocks).toHaveLength(2);
    expect(updated.contentBlocks[1]).toEqual({
      id: expect.stringMatching(/^block_[A-Za-z0-9_-]{8}$/),
      question: "How does attention work?",
      answer: "It weights context by relevance.",
      createdAt: expect.any(String)
    });
  });

  it("returns only the root-to-selected path and excludes siblings", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");
    const selected = createChildNode(session.nodes[0], {
      title: "What is self-attention?",
      answer: "Self-attention compares tokens with each other."
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "What is an embedding?",
      answer: "An embedding is a learned vector representation."
    });

    const path = getNodePath([session.nodes[0], selected, sibling], selected.id);

    expect(path.map((node) => node.id)).toEqual([session.nodes[0].id, selected.id]);
    expect(path).not.toContain(sibling);
  });

  it("throws a clear error for a self-parent cycle", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");
    const cyclicRoot: LearningNode = {
      ...session.nodes[0],
      parentNodeId: session.nodes[0].id
    };

    expect(() => getNodePath([withTraversalLimit(cyclicRoot)], cyclicRoot.id)).toThrow(/Cycle detected/);
  });

  it("throws a clear error for a two-node parent cycle", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");
    const nodeA: LearningNode = {
      ...session.nodes[0],
      id: "node_a",
      parentNodeId: "node_b"
    };
    const nodeB: LearningNode = {
      ...session.nodes[0],
      id: "node_b",
      parentNodeId: "node_a"
    };

    expect(() => getNodePath([withTraversalLimit(nodeA), withTraversalLimit(nodeB)], nodeA.id)).toThrow(
      /Cycle detected/
    );
  });

  it("updates node mastery status", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");

    const updated = updateNodeStatus(session.nodes[0], "mastered");

    expect(updated.status).toBe("mastered");
    expect(updated.id).toBe(session.nodes[0].id);
  });
});
