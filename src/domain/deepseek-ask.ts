import type { AskContext } from "./context";
import type { ContinueNodeOutput, CreateNodeOutput } from "./types";
import { continueNodeOutputSchema, createNodeOutputSchema } from "./ai-schema";

const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

function extractAssistantJson(content: string): string {
  const t = content.trim();
  if (t.startsWith("```")) {
    return t
      .replace(/^```(?:json)?\r?\n?/i, "")
      .replace(/\r?\n?```\s*$/i, "")
      .trim();
  }
  return t;
}

async function chatJson(args: {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}): Promise<string> {
  const res = await fetch(DEEPSEEK_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: args.messages
    })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errBody.slice(0, 800)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (raw == null || raw.length === 0) {
    throw new Error("DeepSeek returned an empty message.");
  }
  return raw;
}

function nodeDigest(ctx: AskContext): string {
  return ctx.activeNode.contentBlocks
    .map((b) => {
      const q = b.question ? `Q: ${b.question}\n` : "";
      return `${q}A: ${b.answer}`;
    })
    .join("\n\n");
}

function contextForPrompt(ctx: AskContext): string {
  const pathLine = ctx.path.map((n) => n.title).join(" > ");
  const related = ctx.relatedConcepts
    .map((c) => (c.description ? `${c.name}: ${c.description}` : c.name))
    .join("\n");
  return [
    `Topic: ${ctx.topicTitle}`,
    `Path: ${pathLine}`,
    `Current node title: ${ctx.activeNode.title}`,
    `Current node content:\n${nodeDigest(ctx)}`,
    related ? `Related concepts in knowledge base (optional links):\n${related}` : "",
    `Learner question:\n${ctx.question}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

const JSON_RULES = `You must output a single JSON object only (no markdown fences). 
Field "relation" in relatedConceptCandidates must be exactly one of: related, part_of, uses, used_by.
Use relatedConceptCandidates only when a named concept connection helps; it may be an empty array.
"conceptCandidate" is an optional new concept name for the main idea, or null if not applicable.`;

export async function deepseekCreateNode(
  ctx: AskContext,
  model: string,
  apiKey: string
): Promise<CreateNodeOutput> {
  const user = [
    "Mode: create a NEW child node under the current path node. The child should address the learner's question with a clear, educational answer.",
    contextForPrompt(ctx),
    JSON_RULES,
    "Required JSON shape: {",
    '  "title": string,',
    '  "answer": string,',
    '  "conceptCandidate": string | null,',
    '  "relatedConceptCandidates": [ { "name": string, "relation": "related" | "part_of" | "uses" | "used_by" } ]',
    "}"
  ].join("\n");
  const raw = await chatJson({
    apiKey,
    model,
    messages: [
      { role: "system", content: "You are MapLearn, a patient tutor that builds learning maps. Follow the JSON shape exactly." },
      { role: "user", content: user }
    ]
  });
  const text = extractAssistantJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Model did not return valid JSON.");
  }
  return createNodeOutputSchema.parse(parsed);
}

export async function deepseekContinueNode(
  ctx: AskContext,
  model: string,
  apiKey: string
): Promise<ContinueNodeOutput> {
  const user = [
    "Mode: continue the CURRENT node — add a thoughtful continuation that answers the learner's question, building on existing content. Do not invent a new node title; stay on the same node.",
    contextForPrompt(ctx),
    JSON_RULES,
    "Required JSON shape: {",
    '  "answer": string,',
    '  "conceptCandidate": string | null,',
    '  "relatedConceptCandidates": [ { "name": string, "relation": "related" | "part_of" | "uses" | "used_by" } ]',
    "}"
  ].join("\n");
  const raw = await chatJson({
    apiKey,
    model,
    messages: [
      { role: "system", content: "You are MapLearn, a patient tutor. Answer in the same language as the question when possible. Follow the JSON shape exactly." },
      { role: "user", content: user }
    ]
  });
  const text = extractAssistantJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Model did not return valid JSON.");
  }
  return continueNodeOutputSchema.parse(parsed);
}
