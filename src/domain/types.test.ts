import { describe, expect, it } from "vitest";
import "./types";
import type { LearningNode, NodeStatus } from "./types";

describe("domain types", () => {
  it("keeps mastery state on learning nodes", () => {
    const status: NodeStatus = "mastered";
    const node: LearningNode = {
      id: "node_1",
      mapRootId: "node_1",
      parentNodeId: null,
      title: "Q/K/V",
      contentBlocks: [{ id: "block_1", question: null, answer: "Root answer", createdAt: "2026-04-26T00:00:00.000Z" }],
      justAskEntries: [],
      status,
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z"
    };

    expect(node.status).toBe("mastered");
  });
});
