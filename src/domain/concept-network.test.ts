import { describe, expect, it } from "vitest";
import { buildConceptGraph, findOrCreateConcept, upsertConceptRelations } from "./concept-network";
import type { Concept, ConceptRelation } from "./types";

const baseTimestamp = "2026-04-26T00:00:00.000Z";

function concept(overrides: Partial<Concept> & Pick<Concept, "id" | "name">): Concept {
  return {
    description: null,
    aliases: [],
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    ...overrides
  };
}

describe("concept network domain", () => {
  it("matches concepts by normalized name and aliases", () => {
    const concepts = [
      concept({
        id: "concept_self_attention",
        name: "Self-attention",
        aliases: ["Self Attention"]
      })
    ];

    const result = findOrCreateConcept(concepts, "self attention");

    expect(result.concept).toBe(concepts[0]);
    expect(result.created).toBe(false);
  });

  it("creates concept when no strong local match exists", () => {
    const result = findOrCreateConcept([], " Q/K/V ");

    expect(result.created).toBe(true);
    expect(result.concept).toMatchObject({
      id: expect.stringMatching(/^concept_[A-Za-z0-9_-]{8}$/),
      name: "Q/K/V",
      description: null,
      aliases: []
    });
    expect(result.concept.createdAt).toEqual(expect.any(String));
    expect(result.concept.updatedAt).toEqual(expect.any(String));
  });

  it("builds graph nodes and edges for concepts and relations", () => {
    const concepts = [concept({ id: "concept_a", name: "Attention" }), concept({ id: "concept_b", name: "Q/K/V" })];
    const relations: ConceptRelation[] = [
      {
        id: "relation_ab",
        sourceConceptId: "concept_a",
        targetConceptId: "concept_b",
        label: "uses"
      }
    ];

    const graph = buildConceptGraph(concepts, relations);

    expect(graph.nodes).toEqual([
      { id: "concept_a", label: "Attention" },
      { id: "concept_b", label: "Q/K/V" }
    ]);
    expect(graph.edges).toEqual([
      {
        id: "relation_ab",
        source: "concept_a",
        target: "concept_b",
        label: "uses"
      }
    ]);
  });

  it("adds relation candidates without duplicating existing edges", () => {
    const concepts = [concept({ id: "a", name: "Self-attention" }), concept({ id: "b", name: "Q/K/V" })];
    const relations: ConceptRelation[] = [
      {
        id: "relation_existing",
        sourceConceptId: "a",
        targetConceptId: "b",
        label: "uses"
      }
    ];

    const updated = upsertConceptRelations(concepts, relations, "a", [{ name: "Q/K/V", relation: "uses" }]);

    expect(updated).toHaveLength(1);
    expect(updated).toEqual(relations);
  });
});
