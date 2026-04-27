import { describe, expect, it } from "vitest";
import { collectSubtreeNodeIds, getChildrenOf, getRootNode, orderNodesDepthFirst } from "./topic-tree";
import type { LearningNode } from "./types";

function node(overrides: Partial<LearningNode> & Pick<LearningNode, "id" | "mapRootId" | "parentNodeId">): LearningNode {
  return {
    title: "T",
    contentBlocks: [],
    justAskEntries: [],
    status: "unmastered",
    createdAt: "x",
    updatedAt: "x",
    ...overrides
  } as LearningNode;
}

describe("topic tree helpers", () => {
  it("finds the root node for a map", () => {
    const nodes: LearningNode[] = [
      node({ id: "r", mapRootId: "r", parentNodeId: null, title: "Root" }),
      node({ id: "c", mapRootId: "r", parentNodeId: "r", title: "Child" })
    ];
    expect(getRootNode(nodes, "r")?.id).toBe("r");
  });

  it("lists children for a parent id", () => {
    const nodes: LearningNode[] = [
      node({ id: "r", mapRootId: "r", parentNodeId: null }),
      node({ id: "a", mapRootId: "r", parentNodeId: "r", title: "A" }),
      node({ id: "b", mapRootId: "r", parentNodeId: "r", title: "B" })
    ];
    const kids = getChildrenOf(nodes, "r", "r");
    expect(kids.map((k) => k.title).sort()).toEqual(["A", "B"]);
  });

  it("orders nodes depth-first from the map root", () => {
    const nodes: LearningNode[] = [
      node({ id: "r", mapRootId: "r", parentNodeId: null, title: "R" }),
      node({ id: "a", mapRootId: "r", parentNodeId: "r", title: "A" }),
      node({ id: "b", mapRootId: "r", parentNodeId: "r", title: "B" }),
      node({ id: "a1", mapRootId: "r", parentNodeId: "a", title: "A1" })
    ];
    expect(orderNodesDepthFirst(nodes, "r").map((n) => n.title)).toEqual(["R", "A", "A1", "B"]);
  });

  it("collects subtree ids within a map", () => {
    const nodes: LearningNode[] = [
      node({ id: "r", mapRootId: "r", parentNodeId: null, title: "R" }),
      node({ id: "a", mapRootId: "r", parentNodeId: "r", title: "A" }),
      node({ id: "b", mapRootId: "r", parentNodeId: "r", title: "B" }),
      node({ id: "a1", mapRootId: "r", parentNodeId: "a", title: "A1" }),
      node({ id: "x", mapRootId: "x", parentNodeId: null, title: "X" })
    ];
    expect([...collectSubtreeNodeIds(nodes, "r", "a")].sort()).toEqual(["a", "a1"]);
    expect([...collectSubtreeNodeIds(nodes, "r", "r")].sort()).toEqual(["a", "a1", "b", "r"]);
  });
});
