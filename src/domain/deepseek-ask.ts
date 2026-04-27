import type { LlmProviderId } from "@/lib/deepseek-settings";
import { LLM_PROVIDER_BASE_URL } from "@/lib/deepseek-settings";
import type { AskContext } from "./context";
import { CreateChildProtocolStreamParser } from "./create-child-stream-protocol";
import type { CreateNodeOutput } from "./types";
import type { LearningNode } from "./types";
import { formatWebSearchResultsForPrompt } from "./web-search";

export type LlmRouting = {
  provider: LlmProviderId;
  apiKey: string;
  model: string;
};

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

function trimBaseUrl(base: string): string {
  return base.replace(/\/+$/, "");
}

function chatCompletionsUrl(baseUrl: string): string {
  return `${trimBaseUrl(baseUrl)}/chat/completions`;
}

function nodeBlocksDigest(node: LearningNode): string {
  if (node.contentBlocks.length === 0) {
    return "（此条下尚未有问与答）";
  }
  return node.contentBlocks
    .map((b) => {
      const q = b.question ? `问：${b.question}\n` : "";
      return `${q}答：${b.answer}`;
    })
    .join("\n\n");
}

function justAskDigestForPrompt(node: LearningNode): string {
  const entries = node.justAskEntries ?? [];
  if (entries.length === 0) {
    return "";
  }
  return (
    "\n\n此条上另有即兴追问与回复（与主线问答并列）：\n" +
    entries
      .map((e) => `问：${e.question}\n答：${e.answer}`)
      .join("\n\n")
  );
}

/**
 * 上文：路径上各条目的问与答记录、可选相关知识、可选检索摘要、最新要答的问题。流式/仅问/建子段共用。
 */
export function buildPromptContextForAsk(ctx: AskContext): string {
  const pathSection = ctx.pathNodes
    .map((node) => {
      return `### ${node.title}\n${nodeBlocksDigest(node)}${justAskDigestForPrompt(node)}`;
    })
    .join("\n\n");
  return [
    "用户此前已进行多轮问与答。下为按顺序整理出来的记录。每个「###」小标题只用于区分不同条目的范围；条目下依次是当时留下的提问与回答，同一条下可以有多问多答。",
    pathSection,
    ctx.webSearchResults.length > 0 ? formatWebSearchResultsForPrompt(ctx.webSearchResults) : "",
    `最新问题：\n${ctx.question}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

const JUST_ASK_USER_SUFFIX =
  "尽量使用与问题相同的主要语言；需要时可用 Markdown。";

const JUST_ASK_SYSTEM =
  "用户消息中先是与当前问题相关的背景，最后一段是「最新问题」。请回答该问题。";

function getJustAskUserContent(ctx: AskContext): string {
  return [buildPromptContextForAsk(ctx), JUST_ASK_USER_SUFFIX].join("\n\n");
}

function getJustAskMessages(ctx: AskContext) {
  return [
    { role: "system" as const, content: JUST_ASK_SYSTEM },
    { role: "user" as const, content: getJustAskUserContent(ctx) }
  ];
}

const CREATE_CHILD_PROTOCOL_SYSTEM = "分节与分隔行必须和 user 中约定的一致；除此之外不要加开场白、尾声或题外话。";

/**
 * OpenAI-style SSE: stream `delta.content` to `onToken`, return the full (trimmed) string.
 */
async function streamOpenAiCompatibleDeltas(
  baseUrl: string,
  model: string,
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  onToken: (delta: string) => void,
  errorLabel: string
): Promise<string> {
  const res = await fetch(chatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      stream: true,
      messages
    })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${errorLabel} ${res.status}: ${errBody.slice(0, 800)}`);
  }
  if (!res.body) {
    throw new Error(`${errorLabel} returned an empty body.`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const n = buffer.indexOf("\n");
      if (n < 0) break;
      let line = buffer.slice(0, n);
      buffer = buffer.slice(n + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      const t = line.trim();
      if (!t.startsWith("data: ")) continue;
      const data = t.slice(6);
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        const c = json.choices?.[0]?.delta?.content;
        if (c) {
          full += c;
          onToken(c);
        }
      } catch {
        // skip
      }
    }
  }
  return full.trim();
}

/**
 * Anthropic Messages API SSE (`content_block_delta` with `text_delta`).
 */
async function streamAnthropicText(
  model: string,
  apiKey: string,
  system: string,
  userContent: string,
  onToken: (delta: string) => void
): Promise<string> {
  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      stream: true,
      system,
      messages: [{ role: "user", content: userContent }]
    })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errBody.slice(0, 800)}`);
  }
  if (!res.body) {
    throw new Error("Anthropic returned an empty body.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const n = buffer.indexOf("\n");
      if (n < 0) break;
      let line = buffer.slice(0, n);
      buffer = buffer.slice(n + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      const t = line.trim();
      if (!t.startsWith("data: ")) continue;
      const data = t.slice(6);
      if (data === "[DONE]") continue;
      let json: {
        type?: string;
        error?: { message?: string };
        delta?: { type?: string; text?: string };
      };
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      if (json.type === "error") {
        throw new Error(json.error?.message ?? "Anthropic stream error");
      }
      if (
        json.type === "content_block_delta" &&
        json.delta?.type === "text_delta" &&
        json.delta.text
      ) {
        const c = json.delta.text;
        full += c;
        onToken(c);
      }
    }
  }
  return full.trim();
}

function openAiCompatibleBase(provider: Exclude<LlmProviderId, "claude">): string {
  return LLM_PROVIDER_BASE_URL[provider];
}

function providerErrorLabel(provider: LlmProviderId): string {
  return `${provider} API`;
}

/**
 * Stream tokens from the configured LLM; returns the full answer (trimmed) for persistence.
 */
export async function streamLlmJustAsk(
  ctx: AskContext,
  routing: LlmRouting,
  onToken: (delta: string) => void
): Promise<string> {
  if (routing.provider === "claude") {
    return streamAnthropicText(
      routing.model,
      routing.apiKey,
      JUST_ASK_SYSTEM,
      getJustAskUserContent(ctx),
      onToken
    );
  }
  const base = openAiCompatibleBase(routing.provider);
  return streamOpenAiCompatibleDeltas(
    base,
    routing.model,
    routing.apiKey,
    getJustAskMessages(ctx),
    onToken,
    providerErrorLabel(routing.provider)
  );
}

/**
 * Single streamed completion: title + body + JSON metadata in a fixed wire format. Passes only body text to onBodyDelta.
 */
export async function streamLlmCreateChildProtocol(
  ctx: AskContext,
  routing: LlmRouting,
  onBodyDelta: (s: string) => void,
  onTitleLine?: (t: string) => void
): Promise<CreateNodeOutput> {
  const user = [
    buildPromptContextForAsk(ctx),
    "",
    "请一次写完回复，分四段，行首的标记须与下面逐字相同（且各占单独一行，顺序不可变）：",
    "",
    "第一行只写：---ML-TITLE---",
    "下一行只写节点标题这一行文字本身：用一句话概括上面「最新问题」在问什么。该行不要出现「标题」二字，不要用引号或冒号起头（不要写成「标题」：… 这种形式）；中文时该行总字数（汉字）不超过 10 个；以英文为主时该行不超过 10 个词。",
    "再下一行只写：---ML-BODY---",
    "接着写对「最新问题」的讲解正文，可用轻量 Markdown。正文中不要出现子串：---ML-META---。",
    "再下一行只写：---ML-META---",
    "最后一行是单个 JSON 对象，不用代码块。可为空对象 {}（保留该行以兼容协议）。"
  ].join("\n");
  const parser = new CreateChildProtocolStreamParser(onTitleLine);

  const full =
    routing.provider === "claude"
      ? await streamAnthropicText(
          routing.model,
          routing.apiKey,
          CREATE_CHILD_PROTOCOL_SYSTEM,
          user,
          (delta) => {
            onBodyDelta(parser.append(delta));
          }
        )
      : await streamOpenAiCompatibleDeltas(
          openAiCompatibleBase(routing.provider),
          routing.model,
          routing.apiKey,
          [
            { role: "system", content: CREATE_CHILD_PROTOCOL_SYSTEM },
            { role: "user", content: user }
          ],
          (delta) => {
            onBodyDelta(parser.append(delta));
          },
          providerErrorLabel(routing.provider)
        );

  if (full.length < 1) {
    throw new Error("Model returned an empty child reply.");
  }
  return parser.finish();
}

/** @deprecated Use streamLlmJustAsk with routing */
export async function streamDeepseekJustAsk(
  ctx: AskContext,
  model: string,
  apiKey: string,
  onToken: (delta: string) => void
): Promise<string> {
  return streamLlmJustAsk(ctx, { provider: "deepseek", model, apiKey }, onToken);
}

/** @deprecated Use streamLlmCreateChildProtocol with routing */
export async function streamDeepseekCreateChildProtocol(
  ctx: AskContext,
  model: string,
  apiKey: string,
  onBodyDelta: (s: string) => void,
  onTitleLine?: (t: string) => void
): Promise<CreateNodeOutput> {
  return streamLlmCreateChildProtocol(
    ctx,
    { provider: "deepseek", model, apiKey },
    onBodyDelta,
    onTitleLine
  );
}
