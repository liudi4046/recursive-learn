import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createTopicWithRoot } from "@/domain/learning-tree";

describe("POST /api/ask", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects when stream is not true", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Hi",
          mode: "just_ask",
        })
      })
    );
    expect(response.status).toBe(400);
  });

  it("streams create child with mock when stream: true", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Q/K/V 是什么？",
          mode: "create_child_node",
          stream: true,
        })
      })
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]!) as { done?: boolean; output?: { title: string } };
    expect(last.done).toBe(true);
    expect(last.output?.title).toBe("Q/K/V");
  });

  it("streams just ask with mock when stream: true", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Explain with an example",
          mode: "just_ask",
          stream: true,
        })
      })
    );
    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]!) as { done?: boolean; full?: string };
    expect(response.status).toBe(200);
    expect(last.done).toBe(true);
    expect(last.full).toContain("example");
  });

  it("streams ndjson for just ask with stream: true", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "Hi",
          mode: "just_ask",
          stream: true,
        })
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/ndjson/);
    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThan(1);
    const last = JSON.parse(lines[lines.length - 1]!) as { done?: boolean; full?: string };
    expect(last.done).toBe(true);
    expect(typeof last.full).toBe("string");
    expect(last.full!.length).toBeGreaterThan(0);
  });

  it("streams ndjson for create child with stream: true", async () => {
    const session = createTopicWithRoot("Transformer", "Root");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "What is attention?",
          mode: "create_child_node",
          stream: true,
        })
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/ndjson/);
    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThan(1);
    const last = JSON.parse(lines[lines.length - 1]!) as { done?: boolean; output?: { title: string; answer: string } };
    expect(last.done).toBe(true);
    expect(last.output?.title).toBeDefined();
    expect(last.output?.answer?.length).toBeGreaterThan(0);
  });

  it("adds Tavily web search results to the DeepSeek prompt when requested", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "ds-test-key");
    vi.stubEnv("TAVILY_API_KEY", "tvly-test-key");
    const session = createTopicWithRoot("Transformer", "Root");
    let deepseekPrompt = "";
    let tavilyRequestBody: Record<string, unknown> | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const href = String(url);
      if (href.includes("api.tavily.com")) {
        tavilyRequestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "Attention Is All You Need",
                url: "https://example.com/attention",
                content: "Transformer attention uses queries, keys, and values."
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      deepseekPrompt = body.messages.map((m) => m.content).join("\n\n");
      return new Response(
        'data: {"choices":[{"delta":{"content":"Grounded answer"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "Content-Type": "text/event-stream" } }
      );
    });

    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "What are Q/K/V?",
          mode: "just_ask",
          stream: true,
          webSearch: true,
          webSearchProvider: "tavily",
        })
      })
    );

    const text = await response.text();
    expect(response.status).toBe(200);
    const lines = text.trim().split("\n").filter(Boolean);
    const first = JSON.parse(lines[0]!) as { webSearchRan?: boolean; webSources?: { title: string }[] };
    expect(first.webSearchRan).toBe(true);
    expect(first.webSources?.[0]?.title).toBe("Attention Is All You Need");
    expect(text).toContain("Grounded answer");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tvly-test-key"
        })
      })
    );
    expect(tavilyRequestBody).toMatchObject({
      query: "What are Q/K/V official source English What are Q/K/V?",
      search_depth: "basic",
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
      auto_parameters: true
    });
    expect(deepseekPrompt).toContain("联网搜索资料");
    expect(deepseekPrompt).toContain("Attention Is All You Need");
    expect(deepseekPrompt).toContain("https://example.com/attention");
    expect(deepseekPrompt).toContain("Transformer attention uses queries, keys, and values.");
  });

  it("uses a Tavily API key from the request before the environment", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "ds-test-key");
    vi.stubEnv("TAVILY_API_KEY", "env-tvly-key");
    const session = createTopicWithRoot("Transformer", "Root");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("api.tavily.com")) {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(
        'data: {"choices":[{"delta":{"content":"Answer"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "Content-Type": "text/event-stream" } }
      );
    });

    await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "What are Q/K/V?",
          mode: "just_ask",
          stream: true,
          webSearch: true,
          webSearchProvider: "tavily",
          tavily: { apiKey: "body-tvly-key" },
        })
      })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer body-tvly-key"
        })
      })
    );
  });

  it("adds Brave web search results to the DeepSeek prompt when requested", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "ds-test-key");
    vi.stubEnv("BRAVE_API_KEY", "brave-env-key");
    const session = createTopicWithRoot("Transformer", "Root");
    let deepseekPrompt = "";
    let braveUrl: string | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const href = String(url);
      if (href.includes("api.search.brave.com")) {
        braveUrl = href;
        return new Response(
          JSON.stringify({
            web: {
              results: [
                {
                  title: "Attention Is All You Need",
                  url: "https://example.com/attention",
                  description: "Transformer attention uses queries, keys, and values."
                }
              ]
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      deepseekPrompt = body.messages.map((m) => m.content).join("\n\n");
      return new Response(
        'data: {"choices":[{"delta":{"content":"Grounded answer"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "Content-Type": "text/event-stream" } }
      );
    });

    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "What are Q/K/V?",
          mode: "just_ask",
          stream: true,
          webSearch: true,
          webSearchProvider: "brave",
        })
      })
    );

    const text = await response.text();
    expect(response.status).toBe(200);
    const lines = text.trim().split("\n").filter(Boolean);
    const first = JSON.parse(lines[0]!) as { webSearchRan?: boolean; webSources?: { title: string }[] };
    expect(first.webSearchRan).toBe(true);
    expect(first.webSources?.[0]?.title).toBe("Attention Is All You Need");
    expect(braveUrl).toContain("api.search.brave.com");
    expect(braveUrl).toContain("q=");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "GET",
      headers: expect.objectContaining({
        "X-Subscription-Token": "brave-env-key"
      })
    });
    expect(deepseekPrompt).toContain("联网搜索资料");
    expect(deepseekPrompt).toContain("Attention Is All You Need");
    expect(deepseekPrompt).toContain("https://example.com/attention");
    expect(deepseekPrompt).toContain("Transformer attention uses queries, keys, and values.");
  });

  it("adds Exa web search results to the DeepSeek prompt when requested", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "ds-test-key");
    vi.stubEnv("EXA_API_KEY", "exa-env-key");
    const session = createTopicWithRoot("Transformer", "Root");
    let deepseekPrompt = "";
    let exaRequestBody: Record<string, unknown> | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const href = String(url);
      if (href.includes("api.exa.ai")) {
        exaRequestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "Attention Is All You Need",
                url: "https://example.com/attention",
                summary: "Transformer attention uses queries, keys, and values."
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      deepseekPrompt = body.messages.map((m) => m.content).join("\n\n");
      return new Response(
        'data: {"choices":[{"delta":{"content":"Grounded answer"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { "Content-Type": "text/event-stream" } }
      );
    });

    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        body: JSON.stringify({
          mapRoot: { title: session.nodes[0].title },
          nodes: session.nodes,
          activeNodeId: session.activeNodeId,
          question: "What are Q/K/V?",
          mode: "just_ask",
          stream: true,
          webSearch: true,
          webSearchProvider: "exa",
        })
      })
    );

    const text = await response.text();
    expect(response.status).toBe(200);
    const lines = text.trim().split("\n").filter(Boolean);
    const first = JSON.parse(lines[0]!) as { webSearchRan?: boolean; webSources?: { title: string }[] };
    expect(first.webSearchRan).toBe(true);
    expect(first.webSources?.[0]?.title).toBe("Attention Is All You Need");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        "x-api-key": "exa-env-key"
      })
    });
    expect(exaRequestBody).toMatchObject({
      type: "auto",
      numResults: 8,
      contents: {
        maxAgeHours: 0,
        summary: true
      }
    });
    expect(String(exaRequestBody?.query)).toContain("What are Q/K/V?");
    expect(deepseekPrompt).toContain("联网搜索资料");
    expect(deepseekPrompt).toContain("Attention Is All You Need");
    expect(deepseekPrompt).toContain("https://example.com/attention");
    expect(deepseekPrompt).toContain("Transformer attention uses queries, keys, and values.");
  });
});
