import {
  appendJustAskEntry,
  createChildNode,
  createMapWithRoot,
  createPlaceholderChildNode,
  removeJustAskEntry,
  updateNodeStatus
} from "./learning-tree";
import { collectSubtreeNodeIds, getRootNode } from "./topic-tree";
import type { CreateNodeOutput, LearningNode, NodeStatus, WebSourceSummary } from "./types";

const nowIso = () => new Date().toISOString();

/** Transient UI for create-child streaming; not persisted to localStorage. */
export type CreateChildStreamUi =
  | {
      childId: string;
      phase: "thinking";
      webSearchRan?: boolean;
      webSources?: WebSourceSummary[];
      /** Create-child: show “标题生成中” until NDJSON `title` is seen. */
      streamTitleSet?: boolean;
      streamPurpose?: "create_child";
    }
  | {
      childId: string;
      phase: "streaming";
      webSearchRan?: boolean;
      webSources?: WebSourceSummary[];
      streamTitleSet?: boolean;
      streamPurpose?: "create_child";
    }
  | null;

/** Transient notice (e.g. missing API key); shown above the ask form, not inside the answer body. */
export type AskSetupBanner =
  | {
      nodeId: string;
      message: string;
    }
  | null;

export type AppState = {
  nodes: LearningNode[];
  /** Root node id of the map in focus (same as that root’s `id`). */
  activeMapRootId: string;
  activeNodeId: string;
  createChildStreamUi: CreateChildStreamUi;
  askSetupBanner: AskSetupBanner;
};

export function setCreateChildStreamUi(state: AppState, ui: CreateChildStreamUi): AppState {
  return { ...state, createChildStreamUi: ui };
}

export function setNodeMastery(state: AppState, nodeId: string, status: NodeStatus): AppState {
  return {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? updateNodeStatus(node, status) : node
    )
  };
}

export function setActiveNodeId(state: AppState, activeNodeId: string): AppState {
  return { ...state, activeNodeId };
}

/** 流式过程中一旦解析出最终标题，可先更新节点名（如 LLM 已写出标题行而正文未结束）。 */
export function setNodeTitle(state: AppState, nodeId: string, title: string): AppState {
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, title, updatedAt: nowIso() } : n
    )
  };
}

export function setNodeReferenceSources(
  state: AppState,
  nodeId: string,
  next: { webSearchUsed: false } | { webSearchUsed: true; webSources: WebSourceSummary[] }
): AppState {
  return {
    ...state,
    nodes: state.nodes.map((n) => {
      if (n.id !== nodeId) return n;
      if (next.webSearchUsed) {
        return { ...n, referenceSources: next.webSources, updatedAt: nowIso() };
      }
      const { referenceSources: _r, ...rest } = n;
      return { ...rest, updatedAt: nowIso() };
    })
  };
}

/** When the NDJSON prologue with web search refs arrives, merge into the active create-child stream UI. */
export function mergeCreateChildStreamMeta(
  state: AppState,
  childId: string,
  meta: { webSearchRan: boolean; webSources: WebSourceSummary[] }
): AppState {
  const ui = state.createChildStreamUi;
  if (!ui || ui.childId !== childId) return state;
  return { ...state, createChildStreamUi: { ...ui, ...meta } };
}

export function setCreateChildStreamTitleReady(state: AppState, childId: string): AppState {
  const ui = state.createChildStreamUi;
  if (!ui || ui.childId !== childId) return state;
  return { ...state, createChildStreamUi: { ...ui, streamTitleSet: true } };
}

export function addPlaceholderChild(state: AppState, parentId: string, question: string): AppState {
  const { nodes, child } = createPlaceholderChildNode(state.nodes, parentId, question);
  return { ...state, nodes, activeNodeId: child.id };
}

export function replaceChildFirstBlockAnswer(state: AppState, childId: string, answer: string): AppState {
  return {
    ...state,
    nodes: state.nodes.map((node) => {
      if (node.id !== childId) return node;
      const b0 = node.contentBlocks[0];
      if (!b0) return node;
      return {
        ...node,
        contentBlocks: [{ ...b0, answer }, ...node.contentBlocks.slice(1)],
        updatedAt: nowIso()
      };
    })
  };
}

/** Sets the first block's `question` when still empty (e.g. root stream from maps). */
export function setNodeFirstBlockQuestion(state: AppState, nodeId: string, question: string): AppState {
  const q = question.trim();
  if (!q) return state;
  return {
    ...state,
    nodes: state.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const b0 = node.contentBlocks[0];
      if (!b0) return node;
      const hasQ = b0.question != null && String(b0.question).trim() !== "";
      if (hasQ) return node;
      return {
        ...node,
        contentBlocks: [{ ...b0, question: q }, ...node.contentBlocks.slice(1)],
        updatedAt: nowIso()
      };
    })
  };
}

export function removePlaceholderChild(state: AppState, childId: string, parentId: string): AppState {
  return {
    ...state,
    nodes: state.nodes.filter((n) => n.id !== childId),
    activeNodeId: parentId,
    createChildStreamUi: null
  };
}

/**
 * Fills in title and final answer on a child that was created as a placeholder.
 */
export function finalizeCreateChild(
  state: AppState,
  childId: string,
  question: string,
  output: CreateNodeOutput,
  options?: { referenceSources?: { webSearchUsed: false } | { webSearchUsed: true; webSources: WebSourceSummary[] } }
): AppState {
  const child = state.nodes.find((n) => n.id === childId);
  if (!child) {
    throw new Error(`Missing child node ${childId}`);
  }

  const b0 = child.contentBlocks[0];
  let updatedChild: LearningNode = {
    ...child,
    title: output.title,
    contentBlocks: b0
      ? [{ ...b0, question, answer: output.answer, createdAt: b0.createdAt }, ...child.contentBlocks.slice(1)]
      : child.contentBlocks,
    updatedAt: nowIso()
  };
  if (options?.referenceSources != null) {
    const r = options.referenceSources;
    if (r.webSearchUsed) {
      updatedChild = { ...updatedChild, referenceSources: r.webSources };
    } else {
      const { referenceSources: _d, ...rest } = updatedChild;
      updatedChild = rest;
    }
  }

  return {
    ...state,
    nodes: state.nodes.map((n) => (n.id === childId ? updatedChild : n)),
    activeNodeId: childId,
    createChildStreamUi: null
  };
}

/** Select a map by its root node id and focus that root. No-op if there is no such root. */
export function setActiveMapByRootId(state: AppState, mapRootId: string): AppState {
  const root = getRootNode(state.nodes, mapRootId);
  if (!root) {
    return state;
  }
  if (state.activeMapRootId === mapRootId) {
    return state;
  }
  return {
    ...state,
    activeMapRootId: mapRootId,
    activeNodeId: root.id
  };
}

/** @deprecated use setActiveMapByRootId */
export const setActiveTopicById = setActiveMapByRootId;

export function createInitialState(rootTitle: string): AppState {
  const session = createMapWithRoot(rootTitle, `Start learning ${rootTitle}.`);
  const rootId = session.nodes[0]!.id;
  return {
    nodes: session.nodes,
    activeMapRootId: rootId,
    activeNodeId: session.activeNodeId,
    createChildStreamUi: null,
    askSetupBanner: null
  };
}

export function createRootNode(state: AppState, title: string): AppState {
  const trimmed = title.trim();
  if (!trimmed) {
    return state;
  }
  const session = createMapWithRoot(trimmed, `Start learning ${trimmed}.`);
  const rootId = session.nodes[0]!.id;
  return {
    ...state,
    nodes: [...state.nodes, ...session.nodes],
    activeMapRootId: rootId,
    activeNodeId: session.activeNodeId,
    createChildStreamUi: null,
    askSetupBanner: null
  };
}

/**
 * Removes a node and all descendants. Deleting a root removes the whole map.
 * Returns `null` if nothing remains (session empty). No-op if `nodeId` is missing.
 */
export function deleteNodeAndSubtree(state: AppState, nodeId: string): AppState | null {
  const target = state.nodes.find((n) => n.id === nodeId);
  if (!target) {
    return state;
  }

  const idsToRemove = collectSubtreeNodeIds(state.nodes, target.mapRootId, nodeId);
  if (idsToRemove.size === 0) {
    return state;
  }

  const nextNodes = state.nodes.filter((n) => !idsToRemove.has(n.id));

  if (nextNodes.length === 0) {
    return null;
  }

  let activeNodeId = state.activeNodeId;
  let activeMapRootId = state.activeMapRootId;
  if (idsToRemove.has(activeNodeId)) {
    if (target.parentNodeId != null) {
      activeNodeId = target.parentNodeId;
      activeMapRootId = nextNodes.find((n) => n.id === activeNodeId)?.mapRootId ?? activeMapRootId;
    } else {
      const remainingRoots = nextNodes.filter((n) => n.parentNodeId === null);
      const r = remainingRoots[0]!;
      activeNodeId = r.id;
      activeMapRootId = r.id;
    }
  }

  if (!nextNodes.some((n) => n.id === activeNodeId)) {
    const r =
      getRootNode(nextNodes, activeMapRootId) ?? nextNodes.find((n) => n.parentNodeId === null);
    if (r) {
      activeNodeId = r.id;
      activeMapRootId = r.id;
    }
  } else {
    const owner = nextNodes.find((n) => n.id === activeNodeId);
    if (owner) {
      activeMapRootId = owner.mapRootId;
    }
  }

  if (!getRootNode(nextNodes, activeMapRootId)) {
    const r = nextNodes.find((n) => n.parentNodeId == null);
    if (r) {
      activeMapRootId = r.id;
      activeNodeId = r.id;
    }
  }

  const ui = state.createChildStreamUi;
  const createChildStreamUi =
    ui && idsToRemove.has(ui.childId) ? null : ui;

  let askSetupBanner = state.askSetupBanner;
  if (askSetupBanner && idsToRemove.has(askSetupBanner.nodeId)) {
    askSetupBanner = null;
  }

  return {
    ...state,
    nodes: nextNodes,
    activeMapRootId,
    activeNodeId,
    createChildStreamUi,
    askSetupBanner
  };
}

export function handleAskResult(
  state: AppState,
  input:
    | { mode: "create_child_node"; question: string; output: CreateNodeOutput }
    | {
        mode: "just_ask";
        question: string;
        answer: string;
        webSearchUsed?: boolean;
        webSources?: WebSourceSummary[];
      }
): AppState {
  const active = state.nodes.find((node) => node.id === state.activeNodeId);
  if (!active) throw new Error(`Missing active node ${state.activeNodeId}`);

  if (input.mode === "just_ask") {
    const updated = appendJustAskEntry(
      active,
      input.question,
      input.answer,
      input.webSearchUsed
        ? { webSearchUsed: true, webSources: input.webSources ?? [] }
        : undefined
    );
    return {
      ...state,
      nodes: state.nodes.map((node) => (node.id === active.id ? updated : node))
    };
  }

  const generatedChild = createChildNode(active, input.output);
  const child = {
    ...generatedChild,
    contentBlocks: [{ ...generatedChild.contentBlocks[0], question: input.question }]
  };
  return {
    ...state,
    nodes: [...state.nodes, child],
    activeNodeId: child.id
  };
}

/**
 * New child with the just-ask Q&A as body (no API). Title is truncated from the question.
 * Removes the matching 随便问问 record on the parent so it cannot be promoted twice.
 */
export function addChildNodeFromJustAsk(
  state: AppState,
  parentId: string,
  question: string,
  answer: string,
  justAskEntryId: string | null
): AppState {
  const shortTitle = question.length > 52 ? `${question.slice(0, 49)}…` : question;
  const withChild = handleAskResult(
    { ...state, activeNodeId: parentId },
    {
      mode: "create_child_node",
      question,
      output: {
        title: shortTitle,
        answer
      }
    }
  );
  const parent = withChild.nodes.find((n) => n.id === parentId);
  if (!parent) {
    return withChild;
  }
  let idToRemove = justAskEntryId;
  if (!idToRemove) {
    idToRemove =
      (parent.justAskEntries ?? []).find(
        (e) => e.question === question && e.answer === answer
      )?.id ?? null;
  }
  if (!idToRemove) {
    return withChild;
  }
  return {
    ...withChild,
    nodes: withChild.nodes.map((n) =>
      n.id === parentId ? removeJustAskEntry(n, idToRemove!) : n
    )
  };
}
