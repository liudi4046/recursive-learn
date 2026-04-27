import type { AppState } from "./app-state";
import type { LearningNode } from "./types";

type LegacyNode = LearningNode & { topicId?: string; linkedConceptId?: string | null };

function stripLegacyConceptLayer(state: Record<string, unknown>): AppState {
  const nodesRaw = state.nodes;
  if (!Array.isArray(nodesRaw)) {
    throw new Error("Invalid state: nodes");
  }
  const nodes = nodesRaw.map((raw) => {
    const n = raw as Record<string, unknown>;
    const { linkedConceptId: _lc, ...rest } = n;
    return rest as LearningNode;
  });
  return {
    nodes,
    activeMapRootId: state.activeMapRootId as string,
    activeNodeId: state.activeNodeId as string,
    createChildStreamUi: (state.createChildStreamUi ?? null) as AppState["createChildStreamUi"],
    askSetupBanner: (state.askSetupBanner ?? null) as AppState["askSetupBanner"]
  };
}

/**
 * v1: `topics[]` + `node.topicId` (topic id) + `activeTopicId`.
 * v2: `activeMapRootId` + `node.mapRootId` (root node id, shared by the whole tree).
 * Also drops deprecated concept graph fields from persisted state.
 */
export function migrateAppStateV1toV2(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid state");
  }
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.nodes)) {
    throw new Error("Invalid state: nodes");
  }
  if (!("topics" in s) || !Array.isArray(s.topics)) {
    return stripLegacyConceptLayer(s);
  }
  const nodes = s.nodes as LegacyNode[];
  const topicIdToMapRoot = new Map<string, string>();
  for (const n of nodes) {
    if (n.parentNodeId == null && n.topicId) {
      topicIdToMapRoot.set(n.topicId, n.id);
    }
  }
  const migrated: LearningNode[] = nodes.map((n) => {
    const { topicId: _legacyTopic, ...base } = n;
    if ("mapRootId" in n && n.mapRootId) {
      return n as LearningNode;
    }
    const mapRootId =
      n.parentNodeId == null
        ? n.id
        : n.topicId
          ? (topicIdToMapRoot.get(n.topicId) ?? n.id)
          : n.id;
    return { ...base, mapRootId } as LearningNode;
  });

  const activeTopicId = s.activeTopicId as string | undefined;
  let activeMapRootId: string;
  if (activeTopicId && topicIdToMapRoot.has(activeTopicId)) {
    activeMapRootId = topicIdToMapRoot.get(activeTopicId)!;
  } else {
    const activeNodeId = s.activeNodeId as string;
    const m = migrated.find((n) => n.id === activeNodeId);
    activeMapRootId = m?.mapRootId ?? migrated.find((n) => n.parentNodeId == null)!.id;
  }

  const { topics: _topics, activeTopicId: _at, ...rest } = s;
  return stripLegacyConceptLayer({
    ...rest,
    nodes: migrated,
    activeMapRootId
  } as Record<string, unknown>);
}
