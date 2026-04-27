import type { LearningNode } from "./types";
import { getChildrenOf, getRootNode, matchesNodeFilter } from "./topic-tree";

/**
 * Compact horizontally (packed siblings); vertical step `LEVEL_V_GAP` sets how far
 * each level sits below the previous (≈ gap between card bottoms and the next row).
 */
export const MAP_TREE_CARD = { w: 176, h: 56 } as const;
export const SIBLING_H_GAP = 10;
/** Distance between level baselines; keep > `MAP_TREE_CARD.h` for clear y spacing. */
export const LEVEL_V_GAP = 112;

/** Card size + vertical rhythm for layout; defaults match the full-session tree view. */
export type MapTreeLayoutMetrics = {
  cardW: number;
  cardH: number;
  levelGap: number;
};

export const MAP_TREE_LAYOUT_DEFAULT: MapTreeLayoutMetrics = {
  cardW: MAP_TREE_CARD.w,
  cardH: MAP_TREE_CARD.h,
  levelGap: LEVEL_V_GAP
};

/**
 * Ids to show: nodes matching filter+search plus every ancestor so the tree stays connected.
 */
export function collectTreeDisplayNodeIds(
  nodes: LearningNode[],
  mapRootId: string,
  filter: "all" | "unmastered" | "mastered",
  q: string
): Set<string> {
  const qLower = q.trim().toLowerCase();
  const direct = new Set<string>();
  for (const n of nodes) {
    if (n.mapRootId !== mapRootId) continue;
    if (matchesNodeFilter(n, filter) && n.title.toLowerCase().includes(qLower)) {
      direct.add(n.id);
    }
  }
  const out = new Set(direct);
  for (const id of direct) {
    let current = nodes.find((n) => n.id === id);
    while (current?.parentNodeId) {
      out.add(current.parentNodeId);
      const pid = current.parentNodeId;
      current = nodes.find((n) => n.id === pid);
    }
  }
  return out;
}

function sortedDisplayChildren(
  nodes: LearningNode[],
  mapRootId: string,
  parentId: string,
  display: Set<string>,
  widthMemo: Map<string, number> | undefined,
  metrics: MapTreeLayoutMetrics
): LearningNode[] {
  const memo = widthMemo ?? new Map<string, number>();
  return getChildrenOf(nodes, mapRootId, parentId)
    .filter((c) => display.has(c.id))
    .slice()
    .sort((a, b) => {
      const wa = measureSubtreeWidth(nodes, mapRootId, a, display, memo, metrics);
      const wb = measureSubtreeWidth(nodes, mapRootId, b, display, memo, metrics);
      if (wb !== wa) {
        return wb - wa;
      }
      return a.title.localeCompare(b.title);
    });
}

type RelativePosition = { centerX: number; depth: number };
type Contour = { left: number; right: number };
type RelativeLayout = {
  positions: Map<string, RelativePosition>;
  contours: Map<number, Contour>;
};

function mergeContour(target: Map<number, Contour>, depth: number, next: Contour) {
  const current = target.get(depth);
  if (!current) {
    target.set(depth, { ...next });
    return;
  }
  current.left = Math.min(current.left, next.left);
  current.right = Math.max(current.right, next.right);
}

function getRequiredShift(
  placed: Map<number, Contour>,
  candidate: Map<number, Contour>,
  candidateDepthOffset: number
): number {
  let shift = 0;
  for (const [depth, c] of candidate) {
    const p = placed.get(depth + candidateDepthOffset);
    if (!p) continue;
    shift = Math.max(shift, p.right + SIBLING_H_GAP - c.left);
  }
  return shift;
}

/**
 * Build a tidy tree using per-level contours. A leaf next to a wide sibling only
 * has to avoid that sibling's root row, not all of the sibling's deeper descendants.
 */
function buildRelativeLayout(
  nodes: LearningNode[],
  mapRootId: string,
  node: LearningNode,
  display: Set<string>,
  widthMemo: Map<string, number>,
  metrics: MapTreeLayoutMetrics
): RelativeLayout {
  const children = sortedDisplayChildren(nodes, mapRootId, node.id, display, widthMemo, metrics);
  const positions = new Map<string, RelativePosition>();
  const contours = new Map<number, Contour>();

  if (children.length === 0) {
    positions.set(node.id, { centerX: 0, depth: 0 });
    contours.set(0, { left: -metrics.cardW / 2, right: metrics.cardW / 2 });
    return { positions, contours };
  }

  const childRoots: number[] = [];
  for (const child of children) {
    const childLayout = buildRelativeLayout(nodes, mapRootId, child, display, widthMemo, metrics);
    const shift = contours.size === 0 ? 0 : getRequiredShift(contours, childLayout.contours, 1);
    const childRoot = childLayout.positions.get(child.id);
    if (childRoot) {
      childRoots.push(childRoot.centerX + shift);
    }

    for (const [id, p] of childLayout.positions) {
      positions.set(id, { centerX: p.centerX + shift, depth: p.depth + 1 });
    }
    for (const [depth, c] of childLayout.contours) {
      mergeContour(contours, depth + 1, {
        left: c.left + shift,
        right: c.right + shift
      });
    }
  }

  const parentCenter = (childRoots[0]! + childRoots[childRoots.length - 1]!) / 2;
  positions.set(node.id, { centerX: parentCenter, depth: 0 });
  mergeContour(contours, 0, {
    left: parentCenter - metrics.cardW / 2,
    right: parentCenter + metrics.cardW / 2
  });

  return { positions, contours };
}

export function measureSubtreeWidth(
  nodes: LearningNode[],
  mapRootId: string,
  node: LearningNode,
  display: Set<string>,
  widthMemo = new Map<string, number>(),
  metrics: MapTreeLayoutMetrics = MAP_TREE_LAYOUT_DEFAULT
): number {
  const cached = widthMemo.get(node.id);
  if (cached !== undefined) {
    return cached;
  }
  const layout = buildRelativeLayout(nodes, mapRootId, node, display, widthMemo, metrics);
  let left = Infinity;
  let right = -Infinity;
  for (const c of layout.contours.values()) {
    left = Math.min(left, c.left);
    right = Math.max(right, c.right);
  }
  const width = right - left;
  widthMemo.set(node.id, width);
  return width;
}

export type MapTreePosition = { left: number; top: number };

/**
 * Hierarchical top-down layout: parent centred over a packed child row, with child
 * subtrees separated by their per-level contours instead of one big bounding box.
 */
export function layoutTopicMapTree(
  nodes: LearningNode[],
  mapRootId: string,
  display: Set<string>,
  metrics: MapTreeLayoutMetrics = MAP_TREE_LAYOUT_DEFAULT
): Map<string, MapTreePosition> | null {
  const root = getRootNode(nodes, mapRootId);
  if (!root || !display.has(root.id)) {
    return null;
  }
  const positions = new Map<string, MapTreePosition>();

  const layout = buildRelativeLayout(nodes, mapRootId, root, display, new Map(), metrics);
  let minLeft = Infinity;
  for (const p of layout.positions.values()) {
    minLeft = Math.min(minLeft, p.centerX - metrics.cardW / 2);
  }
  const shift = minLeft < 0 ? -minLeft : 0;

  for (const [id, p] of layout.positions) {
    positions.set(id, {
      left: p.centerX + shift - metrics.cardW / 2,
      top: p.depth * metrics.levelGap
    });
  }
  return positions;
}

export function getMapTreeCanvasSize(
  positions: Map<string, MapTreePosition>,
  maxDepth: number,
  metrics: MapTreeLayoutMetrics = MAP_TREE_LAYOUT_DEFAULT,
  padding: { widthPad: number; heightPad: number } = { widthPad: 16, heightPad: 12 }
): { width: number; height: number } {
  let maxRight = 0;
  for (const p of positions.values()) {
    maxRight = Math.max(maxRight, p.left + metrics.cardW);
  }
  return {
    width: maxRight + padding.widthPad,
    height: maxDepth * metrics.levelGap + metrics.cardH + padding.heightPad
  };
}

export function getTreeMaxDepth(
  nodes: LearningNode[],
  mapRootId: string,
  rootId: string,
  display: Set<string>,
  metrics: MapTreeLayoutMetrics = MAP_TREE_LAYOUT_DEFAULT
): number {
  function depthFrom(id: string, d: number): number {
    const children = sortedDisplayChildren(nodes, mapRootId, id, display, undefined, metrics);
    if (children.length === 0) return d;
    return Math.max(...children.map((c) => depthFrom(c.id, d + 1)));
  }
  return depthFrom(rootId, 0);
}
