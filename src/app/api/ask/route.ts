import { NextResponse } from "next/server";
import { continueNodeOutputSchema, createNodeOutputSchema } from "@/domain/ai-schema";
import { buildAskContext } from "@/domain/context";
import { mockContinueNode, mockCreateNode } from "@/domain/mock-ai";
import type { AskMode, LearningNode, Topic } from "@/domain/types";

type AskRequest = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  relatedConcepts: Array<{ name: string; description: string | null }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AskRequest;
  const question = body.question.trim();
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });

  const context = buildAskContext({ ...body, question });
  if (body.mode === "create_child_node") {
    const output = createNodeOutputSchema.parse(await mockCreateNode(context));
    return NextResponse.json({ kind: "create_child_node", output });
  }

  const output = continueNodeOutputSchema.parse(await mockContinueNode(context));
  return NextResponse.json({ kind: "continue_here", output });
}
