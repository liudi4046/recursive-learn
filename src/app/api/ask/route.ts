import { NextResponse } from "next/server";
import { continueNodeOutputSchema, createNodeOutputSchema } from "@/domain/ai-schema";
import { buildAskContext } from "@/domain/context";
import { deepseekContinueNode, deepseekCreateNode } from "@/domain/deepseek-ask";
import { mockContinueNode, mockCreateNode } from "@/domain/mock-ai";
import { DEFAULT_DEEPSEEK_MODEL, type DeepseekModelId } from "@/lib/deepseek-settings";
import type { AskMode, LearningNode, Topic } from "@/domain/types";

type AskRequest = {
  topic: Topic;
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  relatedConcepts: Array<{ name: string; description: string | null }>;
  /** When empty, falls back to mock answers or DEEPSEEK_API_KEY. */
  deepseek?: { apiKey?: string; model?: DeepseekModelId };
};

function resolveDeepseek(
  body: AskRequest
): { apiKey: string; model: DeepseekModelId } | null {
  const fromBody = body.deepseek?.apiKey?.trim() ?? "";
  const fromEnv = process.env.DEEPSEEK_API_KEY?.trim() ?? "";
  const apiKey = fromBody || fromEnv;
  if (!apiKey) return null;
  const model = body.deepseek?.model ?? (process.env.DEEPSEEK_MODEL as DeepseekModelId | undefined) ?? DEFAULT_DEEPSEEK_MODEL;
  if (model !== "deepseek-v4-pro" && model !== "deepseek-v4-flash") {
    return { apiKey, model: DEFAULT_DEEPSEEK_MODEL };
  }
  return { apiKey, model };
}

export async function POST(request: Request) {
  const body = (await request.json()) as AskRequest;
  const question = body.question.trim();
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });

  const context = buildAskContext({ ...body, question });
  const ds = resolveDeepseek(body);
  if (ds) {
    try {
      if (body.mode === "create_child_node") {
        const output = await deepseekCreateNode(context, ds.model, ds.apiKey);
        return NextResponse.json({ kind: "create_child_node", output });
      }
      const output = await deepseekContinueNode(context, ds.model, ds.apiKey);
      return NextResponse.json({ kind: "continue_here", output });
    } catch (e) {
      const message = e instanceof Error ? e.message : "DeepSeek request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (body.mode === "create_child_node") {
    const output = createNodeOutputSchema.parse(await mockCreateNode(context));
    return NextResponse.json({ kind: "create_child_node", output });
  }

  const output = continueNodeOutputSchema.parse(await mockContinueNode(context));
  return NextResponse.json({ kind: "continue_here", output });
}
