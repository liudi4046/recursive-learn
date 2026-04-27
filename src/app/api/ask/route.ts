import { NextResponse } from "next/server";
import { createNodeOutputSchema } from "@/domain/ai-schema";
import { buildAskContext } from "@/domain/context";
import {
  buildCreateChildMockProtocolString,
  CreateChildProtocolStreamParser
} from "@/domain/create-child-stream-protocol";
import {
  streamLlmCreateChildProtocol,
  streamLlmJustAsk,
  type LlmRouting
} from "@/domain/deepseek-ask";
import { mockCreateNode, mockJustAsk } from "@/domain/mock-ai";
import {
  searchBrave,
  searchExa,
  searchTavily,
  toClientWebSources,
  type WebSearchResult
} from "@/domain/web-search";
import { defaultModelForProvider, type LlmProviderId } from "@/lib/deepseek-settings";
import type { AskMode, LearningNode } from "@/domain/types";

type AskRequest = {
  /** Root of the current map; `title` is the root node title (for prompts). */
  mapRoot: { title: string };
  nodes: LearningNode[];
  activeNodeId: string;
  question: string;
  mode: AskMode;
  /** When true, searches the web and adds results to the model context. */
  webSearch?: boolean;
  /** Default `exa` when omitted. */
  webSearchProvider?: "tavily" | "brave" | "exa";
  /** When empty, falls back to TAVILY_API_KEY. */
  tavily?: { apiKey?: string };
  /** When empty, falls back to BRAVE_API_KEY. */
  brave?: { apiKey?: string };
  /** When empty, falls back to EXA_API_KEY. */
  exa?: { apiKey?: string };
  /** 必须传 `true`；本接口仅支持流式响应。 */
  stream?: boolean;
  /** Preferred: provider + model + optional API key (server falls back to env per provider). */
  llm?: { provider?: LlmProviderId; apiKey?: string; model?: string };
  /** @deprecated Use `llm` with provider `deepseek`. */
  deepseek?: { apiKey?: string; model?: string };
};

function envKeyForProvider(p: LlmProviderId): string {
  switch (p) {
    case "openai":
      return process.env.OPENAI_API_KEY?.trim() ?? "";
    case "gemini":
      return (
        process.env.GEMINI_API_KEY?.trim() ||
        process.env.GOOGLE_API_KEY?.trim() ||
        ""
      );
    case "claude":
      return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY?.trim() ?? "";
    case "kimi":
      return (
        process.env.MOONSHOT_API_KEY?.trim() ||
        process.env.KIMI_API_KEY?.trim() ||
        ""
      );
    case "glm":
      return process.env.ZHIPU_API_KEY?.trim() || process.env.GLM_API_KEY?.trim() || "";
    case "qwen":
      return (
        process.env.DASHSCOPE_API_KEY?.trim() ||
        process.env.QWEN_API_KEY?.trim() ||
        ""
      );
    case "minimax":
      return process.env.MINIMAX_API_KEY?.trim() ?? "";
    default:
      return "";
  }
}

function resolveLlm(body: AskRequest): LlmRouting | null {
  if (body.llm?.provider) {
    const provider = body.llm.provider;
    const model =
      body.llm.model?.trim() || defaultModelForProvider(provider);
    const fromBody = body.llm.apiKey?.trim() ?? "";
    const fromEnv = envKeyForProvider(provider);
    const apiKey = fromBody || fromEnv;
    if (!apiKey) return null;
    return { provider, apiKey, model };
  }

  if (body.deepseek) {
    const fromBody = body.deepseek.apiKey?.trim() ?? "";
    const fromEnv = envKeyForProvider("deepseek");
    const apiKey = fromBody || fromEnv;
    if (!apiKey) return null;
    const model =
      body.deepseek.model?.trim() ||
      process.env.DEEPSEEK_MODEL?.trim() ||
      defaultModelForProvider("deepseek");
    return { provider: "deepseek", apiKey, model };
  }

  const apiKey = envKeyForProvider("deepseek");
  if (!apiKey) return null;
  const model =
    process.env.DEEPSEEK_MODEL?.trim() || defaultModelForProvider("deepseek");
  return { provider: "deepseek", apiKey, model };
}

export async function POST(request: Request) {
  const body = (await request.json()) as AskRequest;
  const question = body.question.trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  if (body.stream !== true) {
    return NextResponse.json(
      { error: "本接口只支持流式，请在请求体中设置 stream: true" },
      { status: 400 }
    );
  }

  let webSearchResults: WebSearchResult[] = [];
  if (body.webSearch === true) {
    const provider: "tavily" | "brave" | "exa" =
      body.webSearchProvider === "brave"
        ? "brave"
        : body.webSearchProvider === "tavily"
          ? "tavily"
          : "exa";
    try {
      if (provider === "brave") {
        const braveApiKey = body.brave?.apiKey?.trim() || process.env.BRAVE_API_KEY?.trim() || "";
        if (!braveApiKey) {
          return NextResponse.json(
            { error: "BRAVE_API_KEY is required when web search uses Brave." },
            { status: 400 }
          );
        }
        webSearchResults = await searchBrave({ query: question, apiKey: braveApiKey });
      } else if (provider === "exa") {
        const exaApiKey = body.exa?.apiKey?.trim() || process.env.EXA_API_KEY?.trim() || "";
        if (!exaApiKey) {
          return NextResponse.json(
            { error: "EXA_API_KEY is required when web search uses Exa." },
            { status: 400 }
          );
        }
        webSearchResults = await searchExa({ query: question, apiKey: exaApiKey });
      } else {
        const tavilyApiKey = body.tavily?.apiKey?.trim() || process.env.TAVILY_API_KEY?.trim() || "";
        if (!tavilyApiKey) {
          return NextResponse.json(
            { error: "TAVILY_API_KEY is required when web search uses Tavily." },
            { status: 400 }
          );
        }
        webSearchResults = await searchTavily({ query: question, apiKey: tavilyApiKey });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Web search failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const context = buildAskContext({
    mapRoot: body.mapRoot,
    nodes: body.nodes,
    activeNodeId: body.activeNodeId,
    question,
    mode: body.mode,
    webSearchResults
  });
  const llm = resolveLlm(body);
  const enc = new TextEncoder();
  const writeLine = (obj: object, controller: ReadableStreamDefaultController<Uint8Array>) => {
    controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`));
  };

  const writeWebSourcePrologue = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (body.webSearch === true) {
      writeLine(
        { webSearchRan: true, webSources: toClientWebSources(webSearchResults) },
        controller
      );
    }
  };

  if (body.mode === "just_ask") {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          writeWebSourcePrologue(controller);
          if (llm) {
            const full = await streamLlmJustAsk(
              context,
              llm,
              (delta) => writeLine({ t: delta }, controller)
            );
            writeLine({ done: true, full }, controller);
          } else {
            const text = await mockJustAsk(context);
            const step = 6;
            for (let i = 0; i < text.length; i += step) {
              if (i > 0) {
                await new Promise((r) => setTimeout(r, 8));
              }
              const t = text.slice(i, i + step);
              writeLine({ t }, controller);
            }
            writeLine({ done: true, full: text }, controller);
          }
          controller.close();
        } catch (e) {
          const message = e instanceof Error ? e.message : "Request failed";
          writeLine({ err: message }, controller);
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" }
    });
  }

  if (body.mode === "create_child_node") {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          writeWebSourcePrologue(controller);
          if (llm) {
            const output = await streamLlmCreateChildProtocol(
              context,
              llm,
              (delta) => {
                if (delta) writeLine({ t: delta }, controller);
              },
              (title) => writeLine({ title }, controller)
            );
            writeLine({ done: true, output }, controller);
          } else {
            const out = createNodeOutputSchema.parse(await mockCreateNode(context));
            const text = buildCreateChildMockProtocolString(out);
            const p = new CreateChildProtocolStreamParser((title) => writeLine({ title }, controller));
            for (let i = 0; i < text.length; i += 1) {
              if (i > 0 && i % 6 === 0) {
                await new Promise((r) => setTimeout(r, 8));
              }
              const d = p.append(text[i]!);
              if (d) writeLine({ t: d }, controller);
            }
            const parsed = p.finish();
            writeLine({ done: true, output: parsed }, controller);
          }
          controller.close();
        } catch (e) {
          const message = e instanceof Error ? e.message : "Request failed";
          writeLine({ err: message }, controller);
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8" }
    });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
