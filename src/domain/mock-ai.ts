import type { AskContext } from "./context";
import type { ContinueNodeOutput, CreateNodeOutput } from "./types";

export async function mockCreateNode(context: AskContext): Promise<CreateNodeOutput> {
  if (context.question.toLowerCase().includes("q/k/v")) {
    return {
      title: "Q/K/V",
      answer: "Q, K, and V are learned projections used by self-attention to compare tokens and aggregate information.",
      conceptCandidate: "Q/K/V",
      relatedConceptCandidates: [{ name: "Self-attention", relation: "part_of" }]
    };
  }
  return {
    title: context.question.replace(/[?？.!！。]/g, "").slice(0, 40),
    answer: `This child node explains: ${context.question}`,
    conceptCandidate: context.question.replace(/[?？.!！。]/g, "").slice(0, 40),
    relatedConceptCandidates: []
  };
}

export async function mockContinueNode(context: AskContext): Promise<ContinueNodeOutput> {
  return {
    answer: `Here is a continued explanation with an example for: ${context.question}`,
    conceptCandidate: null,
    relatedConceptCandidates: []
  };
}
