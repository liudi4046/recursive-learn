import { describe, expect, it } from "vitest";
import { layoutTopicMapTree, MAP_TREE_CARD, SIBLING_H_GAP } from "./map-tree-layout";
import type { LearningNode } from "./types";

function node(id: string, parentNodeId: string | null, title = id): LearningNode {
  return {
    id,
    mapRootId: "root",
    parentNodeId,
    title,
    contentBlocks: [],
    justAskEntries: [],
    status: "unmastered",
    createdAt: "x",
    updatedAt: "x"
  };
}

describe("map tree layout", () => {
  it("keeps a shallow leaf sibling close to its parent when another sibling has a wide subtree", () => {
    const nodes = [
      node("root", null),
      node("wide", "root"),
      node("leaf", "root"),
      node("wide-a", "wide"),
      node("wide-b", "wide"),
      node("wide-c", "wide")
    ];
    const positions = layoutTopicMapTree(nodes, "root", new Set(nodes.map((n) => n.id)));

    expect(positions).not.toBeNull();
    const root = positions!.get("root")!;
    const wide = positions!.get("wide")!;
    const leaf = positions!.get("leaf")!;

    const rootCenter = root.left + MAP_TREE_CARD.w / 2;
    const leafCenter = leaf.left + MAP_TREE_CARD.w / 2;
    const wideCenter = wide.left + MAP_TREE_CARD.w / 2;

    expect(Math.abs(leafCenter - rootCenter)).toBeLessThan(MAP_TREE_CARD.w + SIBLING_H_GAP * 4);
    expect(Math.abs(leafCenter - wideCenter)).toBeGreaterThanOrEqual(MAP_TREE_CARD.w + SIBLING_H_GAP);
  });
});
