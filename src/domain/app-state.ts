import { findOrCreateConcept, upsertConceptRelations } from "./concept-network";
import { appendToNode, createChildNode, createTopicWithRoot } from "./learning-tree";
import type { Concept, ConceptRelation, ContinueNodeOutput, CreateNodeOutput, LearningNode, Topic } from "./types";

export type AppState = {
  topics: Topic[];
  nodes: LearningNode[];
  concepts: Concept[];
  conceptRelations: ConceptRelation[];
  activeTopicId: string;
  activeNodeId: string;
};

export function createInitialState(topicTitle: string): AppState {
  const session = createTopicWithRoot(topicTitle, `Start learning ${topicTitle}.`);
  return {
    topics: [session.topic],
    nodes: session.nodes,
    concepts: [],
    conceptRelations: [],
    activeTopicId: session.topic.id,
    activeNodeId: session.activeNodeId
  };
}

export function handleAskResult(
  state: AppState,
  input:
    | { mode: "create_child_node"; question: string; output: CreateNodeOutput }
    | { mode: "continue_here"; question: string; output: ContinueNodeOutput }
): AppState {
  const active = state.nodes.find((node) => node.id === state.activeNodeId);
  if (!active) throw new Error(`Missing active node ${state.activeNodeId}`);

  const conceptResult = input.output.conceptCandidate
    ? findOrCreateConcept(state.concepts, input.output.conceptCandidate)
    : null;
  let nextConcepts = conceptResult?.created ? [...state.concepts, conceptResult.concept] : state.concepts;
  for (const c of input.output.relatedConceptCandidates) {
    const rel = findOrCreateConcept(nextConcepts, c.name);
    if (rel.created) nextConcepts = [...nextConcepts, rel.concept];
  }

  const sourceConceptId: string | null =
    input.mode === "create_child_node"
      ? (conceptResult?.concept.id ?? null)
      : (active.linkedConceptId ?? conceptResult?.concept.id ?? null);

  let nextRelations = state.conceptRelations;
  if (sourceConceptId) {
    nextRelations = upsertConceptRelations(
      nextConcepts,
      state.conceptRelations,
      sourceConceptId,
      input.output.relatedConceptCandidates
    );
  }

  if (input.mode === "create_child_node") {
    const generatedChild = createChildNode(active, input.output);
    const child = {
      ...generatedChild,
      linkedConceptId: conceptResult?.concept.id ?? null,
      contentBlocks: [{ ...generatedChild.contentBlocks[0], question: input.question }]
    };
    return {
      ...state,
      concepts: nextConcepts,
      conceptRelations: nextRelations,
      nodes: [...state.nodes, child],
      activeNodeId: child.id
    };
  }

  const updated = {
    ...appendToNode(active, input.question, input.output.answer),
    linkedConceptId: active.linkedConceptId ?? conceptResult?.concept.id ?? null
  };
  return {
    ...state,
    concepts: nextConcepts,
    conceptRelations: nextRelations,
    nodes: state.nodes.map((node) => (node.id === active.id ? updated : node))
  };
}
