export type NodeStatus = "unmastered" | "mastered";
export type AskMode = "create_child_node" | "just_ask";

export type NodeContentBlock = {
  id: string;
  question: string | null;
  answer: string;
  createdAt: string;
};

/** A snippet returned from web search for display in the UI (not the full model prompt). */
export type WebSourceSummary = {
  title: string;
  url: string;
  snippet: string;
};

/** A one-off "just ask" Q&A on a node, kept separate from the node's map content. */
export type JustAskEntry = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  /** When the question was sent with 联网 on (even if no snippets came back). */
  webSearchUsed?: boolean;
  /** Snippets from web search when it was on. */
  webSources?: WebSourceSummary[];
};

export type LearningNode = {
  id: string;
  /** Root node id of this learning session’s tree; on the root, `mapRootId === id`. */
  mapRootId: string;
  parentNodeId: string | null;
  title: string;
  contentBlocks: NodeContentBlock[];
  justAskEntries: JustAskEntry[];
  /** Shown for this node when the last streamed answer (root or child) used web search. */
  referenceSources?: WebSourceSummary[];
  status: NodeStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateNodeOutput = {
  title: string;
  answer: string;
};
