import { getNodePath } from "./learning-tree";
import type { AskMode, LearningNode } from "./types";
import type { WebSearchResult } from "./web-search";

export type AskContext = {
  /** Display label for the current session (root node title). */
  mapTitle: string;
  mode: AskMode;
  /** Root → … → current node, each with full `contentBlocks`. */
  pathNodes: LearningNode[];
  path: Array<{ id: string; title: string }>;
  activeNode: LearningNode;
  question: string;
  webSearchResults: WebSearchResult[];
};

export function buildAskContext(input: {
  mapRoot: { title: string };
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  webSearchResults?: WebSearchResult[];
}): AskContext {
  const pathNodes = getNodePath(input.nodes, input.activeNodeId);
  const activeNode = pathNodes[pathNodes.length - 1];
  if (!activeNode) throw new Error(`Missing active node ${input.activeNodeId}`);
  return {
    mapTitle: input.mapRoot.title,
    mode: input.mode,
    pathNodes,
    path: pathNodes.map((node) => ({ id: node.id, title: node.title })),
    activeNode,
    question: input.question,
    webSearchResults: input.webSearchResults ?? []
  };
}
