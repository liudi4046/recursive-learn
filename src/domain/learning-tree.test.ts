import { describe, expect, it } from "vitest";
import {
  appendToNode,
  createChildNode,
  createTopicWithRoot,
  getNodePath,
  updateNodeStatus
} from "./learning-tree";
import type { CreateNodeOutput } from "./types";

describe("learning tree domain", () => {
  it("creates a topic with one unmastered root node", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");

    expect(session.topic.title).toBe("Transformers");
    expect(session.topic.id).toMatch(/^topic_[A-Za-z0-9_-]{8}$/);
    expect(session.nodes).toHaveLength(1);
    expect(session.activeNodeId).toBe(session.nodes[0].id);
    expect(session.nodes[0]).toMatchObject({
      id: expect.stringMatching(/^node_[A-Za-z0-9_-]{8}$/),
      topicId: session.topic.id,
      parentNodeId: null,
      linkedConceptId: null,
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
      answer: "Self-attention compares tokens with each other.",
      conceptCandidate: "Self-attention",
      relatedConceptCandidates: []
    };

    const child = createChildNode(session.nodes[0], output);

    expect(child).toMatchObject({
      topicId: session.topic.id,
      parentNodeId: session.nodes[0].id,
      linkedConceptId: null,
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
  });

  it("appends continued learning content to the same node", () => {
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
      answer: "Self-attention compares tokens with each other.",
      conceptCandidate: null,
      relatedConceptCandidates: []
    });
    const sibling = createChildNode(session.nodes[0], {
      title: "What is an embedding?",
      answer: "An embedding is a learned vector representation.",
      conceptCandidate: null,
      relatedConceptCandidates: []
    });

    const path = getNodePath([session.nodes[0], selected, sibling], selected.id);

    expect(path.map((node) => node.id)).toEqual([session.nodes[0].id, selected.id]);
    expect(path).not.toContain(sibling);
  });

  it("updates node mastery status", () => {
    const session = createTopicWithRoot("Transformers", "A transformer is a neural network architecture.");

    const updated = updateNodeStatus(session.nodes[0], "mastered");

    expect(updated.status).toBe("mastered");
    expect(updated.id).toBe(session.nodes[0].id);
  });
});
