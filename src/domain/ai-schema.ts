import { z } from "zod";

export const createNodeOutputSchema = z.object({
  title: z.string().min(1),
  answer: z.string().min(1)
});

/** Legacy META line may still contain concept keys; we only require valid JSON object. */
export const createChildStreamMetaJsonSchema = z.record(z.string(), z.unknown());
