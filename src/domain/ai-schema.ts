import { z } from "zod";

const relationSchema = z.enum(["related", "part_of", "uses", "used_by"]);

export const createNodeOutputSchema = z.object({
  title: z.string().min(1),
  answer: z.string().min(1),
  conceptCandidate: z.string().min(1).nullable(),
  relatedConceptCandidates: z.array(z.object({ name: z.string().min(1), relation: relationSchema }))
});

export const continueNodeOutputSchema = z.object({
  answer: z.string().min(1),
  conceptCandidate: z.string().min(1).nullable(),
  relatedConceptCandidates: z.array(z.object({ name: z.string().min(1), relation: relationSchema }))
});
