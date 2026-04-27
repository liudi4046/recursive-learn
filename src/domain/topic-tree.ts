import type { LearningNode } from "./types";

/** `mapRootId` is the root node’s id for that map. */
export function getRootNode(nodes: LearningNode[], mapRootId: string): LearningNode | undefined {
  return nodes.find((n) => n.id === mapRootId && n.parentNodeId === null);
}

export function getChildrenOf(
  nodes: LearningNode[],
  mapRootId: string,
  parentId: string | null
): LearningNode[] {
  return nodes.filter((n) => n.mapRootId === mapRootId && n.parentNodeId === parentId);
}

/** All node ids in the subtree rooted at `rootId` (inclusive), same map only. */
export function collectSubtreeNodeIds(
  nodes: LearningNode[],
  mapRootId: string,
  rootId: string
): Set<string> {
  const root = nodes.find((n) => n.id === rootId);
  if (!root || root.mapRootId !== mapRootId) {
    return new Set();
  }
  const byParent = new Map<string | null, string[]>();
  for (const n of nodes) {
    if (n.mapRootId !== mapRootId) continue;
    const p = n.parentNodeId;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(n.id);
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    const kids = byParent.get(id);
    if (kids) for (const k of kids) stack.push(k);
  }
  return out;
}

export function orderNodesDepthFirst(nodes: LearningNode[], mapRootId: string): LearningNode[] {
  const root = getRootNode(nodes, mapRootId);
  if (!root) return [];

  const out: LearningNode[] = [];

  function walk(node: LearningNode) {
    out.push(node);
    const children = getChildrenOf(nodes, mapRootId, node.id).slice().sort((a, b) => a.title.localeCompare(b.title));
    for (const child of children) {
      walk(child);
    }
  }

  walk(root);
  return out;
}

export function matchesNodeFilter(node: LearningNode, filter: "all" | "unmastered" | "mastered"): boolean {
  if (filter === "all") return true;
  if (filter === "unmastered") return node.status === "unmastered";
  return node.status === "mastered";
}
