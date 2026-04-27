import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWebSearchQuery, searchBrave, searchExa, searchTavily } from "./web-search";

describe("web search", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds an English-first keyword query with the original question as fallback context", () => {
    expect(buildWebSearchQuery("gpt 最新的版本是什么")).toBe(
      "GPT OpenAI latest current official source English gpt 最新的版本是什么"
    );
  });

  it("falls back to the original question when the English-first Tavily search returns no results", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { query: string };
      if (body.query === "GPT OpenAI latest current official source English gpt 最新的版本是什么") {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "OpenAI latest model",
              url: "https://openai.com/latest",
              content: "GPT-5.5 is the latest model."
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const results = await searchTavily({
      query: "gpt 最新的版本是什么",
      apiKey: "tvly-test-key"
    });

    expect(results).toEqual([
      {
        title: "OpenAI latest model",
        url: "https://openai.com/latest",
        content: "GPT-5.5 is the latest model."
      }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the original question when the English-first Brave search returns no results", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const href = String(url);
      if (!href.includes("api.search.brave.com")) {
        return new Response("", { status: 404 });
      }
      const q = new URL(href).searchParams.get("q");
      if (q === "GPT OpenAI latest current official source English gpt 最新的版本是什么") {
        return new Response(JSON.stringify({ web: { results: [] } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(
        JSON.stringify({
          web: {
            results: [
              {
                title: "OpenAI latest model",
                url: "https://openai.com/latest",
                description: "GPT-5.5 is the <strong>latest</strong> model."
              }
            ]
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const results = await searchBrave({
      query: "gpt 最新的版本是什么",
      apiKey: "brave-test-key"
    });

    expect(results).toEqual([
      {
        title: "OpenAI latest model",
        url: "https://openai.com/latest",
        content: "GPT-5.5 is the latest model."
      }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(firstInit?.headers).toMatchObject({
      "X-Subscription-Token": "brave-test-key"
    });
  });

  it("falls back to the original question when the English-first Exa search returns no results", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const href = String(url);
      if (!href.includes("api.exa.ai")) {
        return new Response("", { status: 404 });
      }
      const body = JSON.parse(String((init as RequestInit)?.body)) as { query: string };
      if (body.query === "GPT OpenAI latest current official source English gpt 最新的版本是什么") {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(
        JSON.stringify({
          results: [
            {
              title: "OpenAI latest model",
              url: "https://openai.com/latest",
              summary: "GPT-5.5 is the latest model."
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const results = await searchExa({
      query: "gpt 最新的版本是什么",
      apiKey: "exa-test-key"
    });

    expect(results).toEqual([
      {
        title: "OpenAI latest model",
        url: "https://openai.com/latest",
        content: "GPT-5.5 is the latest model."
      }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(firstInit?.headers).toMatchObject({
      "x-api-key": "exa-test-key"
    });
    const firstBody = JSON.parse(String(firstInit?.body)) as {
      contents?: { summary?: unknown; maxAgeHours?: number };
    };
    expect(firstBody.contents?.summary).toBe(true);
    expect(firstBody.contents?.maxAgeHours).toBe(0);
  });
});
