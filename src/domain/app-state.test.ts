import { describe, expect, it } from "vitest";
import {
  addChildNodeFromJustAsk,
  createInitialState,
  createRootNode,
  deleteNodeAndSubtree,
  handleAskResult,
  setNodeFirstBlockQuestion,
  setNodeMastery
} from "./app-state";

describe("app state", () => {
  it("creates a root node", () => {
    const state = createInitialState("Transformer");
    const r = state.nodes[0]!;
    expect(state.nodes).toHaveLength(1);
    expect(r.mapRootId).toBe(r.id);
    expect(state.activeMapRootId).toBe(r.id);
    expect(state.activeNodeId).toBe(r.id);
  });

  it("creates an additional root node without deleting existing roots", () => {
    const state = createInitialState("Transformer");
    const firstRootId = state.activeNodeId;

    const next = createRootNode(state, "Diffusion Models");

    expect(next.nodes).toHaveLength(2);
    expect(next.nodes[0].id).toBe(firstRootId);
    const second = next.nodes[1]!;
    expect(second.title).toBe("Diffusion Models");
    expect(second).toMatchObject({
      mapRootId: second.id,
      parentNodeId: null,
      title: "Diffusion Models"
    });
    expect(next.activeMapRootId).toBe(second.id);
    expect(next.activeNodeId).toBe(second.id);
  });

  it("adds a child node for create child mode", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "create_child_node",
      question: "Q/K/V 是什么？",
      output: {
        title: "Q/K/V",
        answer: "Answer"
      }
    });
    expect(next.nodes).toHaveLength(2);
    expect(next.activeNodeId).toBe(next.nodes[1].id);
  });

  it("adds a child from just-ask Q&A without a second API call", () => {
    const state = createInitialState("Transformer");
    const rootId = state.nodes[0].id;
    const next = addChildNodeFromJustAsk(state, rootId, "What is X?", "X is Y", null);
    expect(next.nodes).toHaveLength(2);
    expect(next.activeNodeId).toBe(next.nodes[1].id);
    const child = next.nodes[1];
    expect(child.parentNodeId).toBe(rootId);
    expect(child.contentBlocks[0]).toMatchObject({
      question: "What is X?",
      answer: "X is Y"
    });
  });

  it("removes the promoted 随问 entry on the parent", () => {
    const state0 = createInitialState("Transformer");
    const withAsk = handleAskResult(state0, {
      mode: "just_ask",
      question: "What is X?",
      answer: "X is Y"
    });
    const rootId = withAsk.nodes[0].id;
    const entryId = withAsk.nodes[0].justAskEntries[0]!.id;
    const next = addChildNodeFromJustAsk(withAsk, rootId, "What is X?", "X is Y", entryId);
    expect(next.nodes[0].justAskEntries).toHaveLength(0);
  });

  it("just ask stores the exchange on the current node without changing map content or adding a child", () => {
    const state = createInitialState("Transformer");
    const next = handleAskResult(state, {
      mode: "just_ask",
      question: "Give an example",
      answer: "Example answer"
    });
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].contentBlocks).toHaveLength(1);
    expect(next.nodes[0].justAskEntries).toHaveLength(1);
    expect(next.nodes[0].justAskEntries[0]).toMatchObject({
      question: "Give an example",
      answer: "Example answer"
    });
  });

  it("sets first block question when empty and does not overwrite", () => {
    const state = createInitialState("Topic");
    const rootId = state.nodes[0].id;
    const withQ = setNodeFirstBlockQuestion(state, rootId, "User question?");
    expect(withQ.nodes[0].contentBlocks[0]?.question).toBe("User question?");
    const again = setNodeFirstBlockQuestion(withQ, rootId, "Other");
    expect(again.nodes[0].contentBlocks[0]?.question).toBe("User question?");
  });

  it("updates mastery for a node by id", () => {
    const state = createInitialState("T");
    const id = state.nodes[0].id;
    const next = setNodeMastery(state, id, "mastered");
    expect(next.nodes[0].status).toBe("mastered");
  });

  it("deletes a child subtree and focuses the parent", () => {
    const state = handleAskResult(createInitialState("T"), {
      mode: "create_child_node",
      question: "Child?",
      output: {
        title: "Child",
        answer: "A"
      }
    });
    const rootId = state.nodes[0].id;
    const childId = state.nodes[1].id;
    const withActive = { ...state, activeNodeId: childId };
    const next = deleteNodeAndSubtree(withActive, childId);
    expect(next).not.toBeNull();
    expect(next!.nodes).toHaveLength(1);
    expect(next!.nodes[0].id).toBe(rootId);
    expect(next!.activeNodeId).toBe(rootId);
  });

  it("deleting one root leaves the other map and focuses its root", () => {
    const a = createInitialState("A");
    const two = createRootNode(a, "B");
    const rootA = two.nodes.find((n) => n.title === "A" && n.parentNodeId === null)!;
    const rootB = two.nodes.find((n) => n.title === "B" && n.parentNodeId === null)!;
    const focused = { ...two, activeMapRootId: rootA.id, activeNodeId: rootA.id };
    const next = deleteNodeAndSubtree(focused, rootA.id);
    expect(next).not.toBeNull();
    expect(next!.nodes).toHaveLength(1);
    expect(next!.nodes[0].title).toBe("B");
    expect(next!.activeNodeId).toBe(rootB.id);
    expect(next!.activeMapRootId).toBe(rootB.id);
  });

  it("deleting the last root clears the session", () => {
    const state = createInitialState("Only");
    const rootId = state.nodes[0].id;
    expect(deleteNodeAndSubtree(state, rootId)).toBeNull();
  });
});
