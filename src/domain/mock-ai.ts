import type { AskContext } from "./context";
import type { CreateNodeOutput } from "./types";

export async function mockCreateNode(context: AskContext): Promise<CreateNodeOutput> {
  if (context.question.toLowerCase().includes("q/k/v")) {
    return {
      title: "Q/K/V",
      answer: "Q, K, and V are learned projections used by self-attention to compare tokens and aggregate information."
    };
  }
  return {
    title: context.question.replace(/[?？.!！。]/g, "").slice(0, 40),
    answer: `This child node explains: ${context.question}`
  };
}

export async function mockJustAsk(context: AskContext): Promise<string> {
  return `Here is a direct answer for: ${context.question}`;
}
