import { nanoid } from "nanoid";
import type { CreateNodeOutput, LearningNode, NodeStatus, Topic } from "./types";

export type LearningSession = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
};

const createId = (prefix: string) => `${prefix}_${nanoid(8)}`;
const nowIso = () => new Date().toISOString();

export function createTopicWithRoot(title: string, answer: string): LearningSession {
  const timestamp = nowIso();
  const topic: Topic = {
    id: createId("topic"),
    title,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const rootNode: LearningNode = {
    id: createId("node"),
    topicId: topic.id,
    parentNodeId: null,
    linkedConceptId: null,
    title,
    contentBlocks: [
      {
        id: createId("block"),
        question: null,
        answer,
        createdAt: timestamp
      }
    ],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    topic,
    nodes: [rootNode],
    activeNodeId: rootNode.id
  };
}

export function createChildNode(parent: LearningNode, output: CreateNodeOutput): LearningNode {
  const timestamp = nowIso();

  return {
    id: createId("node"),
    topicId: parent.topicId,
    parentNodeId: parent.id,
    linkedConceptId: null,
    title: output.title,
    contentBlocks: [
      {
        id: createId("block"),
        question: output.title,
        answer: output.answer,
        createdAt: timestamp
      }
    ],
    status: "unmastered",
    createdAt: timestamp,
    updatedAt: timestamp
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
  const path: LearningNode[] = [];
  let current = nodesById.get(nodeId);

  while (current) {
    path.unshift(current);
    current = current.parentNodeId ? nodesById.get(current.parentNodeId) : undefined;
  }

  return path;
}
