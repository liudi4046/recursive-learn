import { nanoid } from "nanoid";
import type { Concept, ConceptRelation, ConceptRelationLabel } from "./types";

export type FindOrCreateConceptResult = {
  concept: Concept;
  created: boolean;
};

export type RelationCandidate = {
  name: string;
  relation: ConceptRelationLabel;
};

export type ConceptGraph = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ id: string; source: string; target: string; label: ConceptRelationLabel }>;
};

const createId = (prefix: string) => `${prefix}_${nanoid(8)}`;
const nowIso = () => new Date().toISOString();

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function conceptNames(concept: Concept): string[] {
  return [concept.name, ...concept.aliases];
}

export function findOrCreateConcept(concepts: Concept[], candidateName: string): FindOrCreateConceptResult {
  const normalizedCandidateName = normalizeName(candidateName);
  const existingConcept = concepts.find((concept) =>
    conceptNames(concept).some((name) => normalizeName(name) === normalizedCandidateName)
  );

  if (existingConcept) {
    return {
      concept: existingConcept,
      created: false
    };
  }

  const timestamp = nowIso();

  return {
    concept: {
      id: createId("concept"),
      name: candidateName.trim(),
      description: null,
      aliases: [],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    created: true
  };
}

export function upsertConceptRelations(
  concepts: Concept[],
  relations: ConceptRelation[],
  sourceConceptId: string,
  candidates: RelationCandidate[]
): ConceptRelation[] {
  const updatedRelations = [...relations];
  const sourceConcept = concepts.find((concept) => concept.id === sourceConceptId);

  if (!sourceConcept) {
    return updatedRelations;
  }

  for (const candidate of candidates) {
    const normalizedCandidateName = normalizeName(candidate.name);
    const targetConcept = concepts.find((concept) => normalizeName(concept.name) === normalizedCandidateName);

    if (!targetConcept || targetConcept.id === sourceConcept.id) {
      continue;
    }

    const alreadyExists = updatedRelations.some(
      (relation) =>
        relation.sourceConceptId === sourceConcept.id &&
        relation.targetConceptId === targetConcept.id &&
        relation.label === candidate.relation
    );

    if (alreadyExists) {
      continue;
    }

    updatedRelations.push({
      id: createId("relation"),
      sourceConceptId: sourceConcept.id,
      targetConceptId: targetConcept.id,
      label: candidate.relation
    });
  }

  return updatedRelations;
}

export function buildConceptGraph(concepts: Concept[], relations: ConceptRelation[]): ConceptGraph {
  return {
    nodes: concepts.map((concept) => ({
      id: concept.id,
      label: concept.name
    })),
    edges: relations.map((relation) => ({
      id: relation.id,
      source: relation.sourceConceptId,
      target: relation.targetConceptId,
      label: relation.label
    }))
  };
}
