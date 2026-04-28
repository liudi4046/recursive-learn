import { getNodePath } from "./learning-tree";
import type { AskMode, LearningNode } from "./types";
import type { WebSearchResult } from "./web-search";

/** UI locale for LLM prompts (`en` / `zh`); aligns with client `AppLocale`. */
export type AskPromptLocale = "en" | "zh";

export type AskContext = {
  /** Display label for the current session (root node title). */
  mapTitle: string;
  mode: AskMode;
  /** Shapes system/user wording and context labels (not auto-detected from the question). */
  locale: AskPromptLocale;
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
  /** When omitted, defaults to `zh` (legacy API behavior). */
  locale?: AskPromptLocale;
  webSearchResults?: WebSearchResult[];
}): AskContext {
  const pathNodes = getNodePath(input.nodes, input.activeNodeId);
  const activeNode = pathNodes[pathNodes.length - 1];
  if (!activeNode) throw new Error(`Missing active node ${input.activeNodeId}`);
  return {
    mapTitle: input.mapRoot.title,
    mode: input.mode,
    locale: input.locale === "en" ? "en" : "zh",
    pathNodes,
    path: pathNodes.map((node) => ({ id: node.id, title: node.title })),
    activeNode,
    question: input.question,
    webSearchResults: input.webSearchResults ?? []
  };
}
