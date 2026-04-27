import { nanoid } from "nanoid";
import type { CreateNodeOutput, LearningNode, NodeStatus, WebSourceSummary } from "./types";

export type MapSession = {
  nodes: LearningNode[];
  activeNodeId: string;
};

const createId = (prefix: string) => `${prefix}_${nanoid(8)}`;
const nowIso = () => new Date().toISOString();

/** One learning session tree: a root node and no separate topic record—`mapRootId` is the root’s id. */
export function createMapWithRoot(title: string, answer: string): MapSession {
  const timestamp = nowIso();
  const id = createId("node");
  const rootNode: LearningNode = {
    id,
    mapRootId: id,
    parentNodeId: null,
    title,
    contentBlocks: [
      {
        id: createId("block"),
        question: null,
        answer,
        createdAt: timestamp
      }
    ],
    justAskEntries: [],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    nodes: [rootNode],
    activeNodeId: rootNode.id
  };
}

/** @deprecated use createMapWithRoot */
export const createTopicWithRoot = createMapWithRoot;

/**
 * A minimal child with empty body, used to navigate immediately while the answer is streamed in.
 */
export function createPlaceholderChildNode(
  nodes: LearningNode[],
  parentId: string,
  question: string
): { nodes: LearningNode[]; child: LearningNode } {
  const parent = nodes.find((n) => n.id === parentId);
  if (!parent) {
    throw new Error(`Missing parent node ${parentId}`);
  }
  const timestamp = nowIso();
  const title = question.length > 52 ? `${question.slice(0, 49)}…` : question;
  const child: LearningNode = {
    id: createId("node"),
    mapRootId: parent.mapRootId,
    parentNodeId: parent.id,
    title,
    contentBlocks: [
      { id: createId("block"), question, answer: "", createdAt: timestamp }
    ],
    justAskEntries: [],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  return { nodes: [...nodes, child], child };
}

export function createChildNode(parent: LearningNode, output: CreateNodeOutput): LearningNode {
  const timestamp = nowIso();

  return {
    id: createId("node"),
    mapRootId: parent.mapRootId,
    parentNodeId: parent.id,
    title: output.title,
    contentBlocks: [
      {
        id: createId("block"),
        question: output.title,
        answer: output.answer,
        createdAt: timestamp
      }
    ],
    justAskEntries: [],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function appendJustAskEntry(
  node: LearningNode,
  question: string,
  answer: string,
  options?: { webSources: WebSourceSummary[]; webSearchUsed: true }
): LearningNode {
  const timestamp = nowIso();
  return {
    ...node,
    justAskEntries: [
      ...(node.justAskEntries ?? []),
      {
        id: createId("ja"),
        question,
        answer,
        createdAt: timestamp,
        ...(options
          ? { webSearchUsed: true as const, webSources: options.webSources }
          : {})
      }
    ],
    updatedAt: timestamp
  };
}

export function removeJustAskEntry(node: LearningNode, entryId: string): LearningNode {
  return {
    ...node,
    justAskEntries: (node.justAskEntries ?? []).filter((e) => e.id !== entryId),
    updatedAt: nowIso()
  };
}

export function appendToNode(node: LearningNode, question: string, answer: string): LearningNode {
  const timestamp = nowIso();

  return {
    ...node,
    contentBlocks: [
      ...node.contentBlocks,
      {
        id: createId("block"),
        question,
        answer,
        createdAt: timestamp
      }
    ],
    updatedAt: timestamp
  };
}

export function updateNodeStatus(node: LearningNode, status: NodeStatus): LearningNode {
  return {
    ...node,
    status,
    updatedAt: nowIso()
  };
}

export function getNodePath(nodes: LearningNode[], nodeId: string): LearningNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const visitedNodeIds = new Set<string>();
  const path: LearningNode[] = [];
  let current = nodesById.get(nodeId);

  while (current) {
    if (visitedNodeIds.has(current.id)) {
      throw new Error(`Cycle detected in learning node path at ${current.id}`);
    }

    visitedNodeIds.add(current.id);
    path.unshift(current);
    current = current.parentNodeId ? nodesById.get(current.parentNodeId) : undefined;
  }

  return path;
}
