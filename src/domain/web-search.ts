import type { WebSourceSummary } from "./types";

export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

const SNIPPET_MAX = 200;

/** Maps provider results to client-friendly snippets for the reference panel. */
export function toClientWebSources(results: WebSearchResult[]): WebSourceSummary[] {
  return results.map((r) => {
    const raw = (r.content ?? "").trim();
    return {
      title: r.title?.trim() ?? "",
      url: r.url?.trim() ?? "",
      snippet: raw.length > SNIPPET_MAX ? `${raw.slice(0, SNIPPET_MAX)}…` : raw
    };
  });
}

type TavilySearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
};

type BraveWebSearchResponse = {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      extra_snippets?: string[];
    }>;
  };
};

function stripHtmlSnippet(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FRESHNESS_PATTERN =
  /最新|目前|现在|今天|版本|价格|发布|上线|更新|current|latest|today|now|version|price|release|launched|updated/i;

function extractAsciiTerms(text: string): string {
  const terms = text.match(/[a-z0-9][a-z0-9.+#/-]*/gi) ?? [];
  return Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean))).join(" ");
}

/** Augments the user question for English-first web search (all providers). */
export function buildWebSearchQuery(question: string): string {
  const normalized = question.trim();
  const asciiTerms = extractAsciiTerms(normalized);
  const topicHint = /\bgpt\b/i.test(normalized) && !/\bopenai\b/i.test(normalized) ? "GPT OpenAI" : "";
  const freshnessHint = FRESHNESS_PATTERN.test(normalized) ? "latest current" : "";
  return [topicHint || asciiTerms, freshnessHint, "official source English", normalized]
    .filter(Boolean)
    .join(" ");
}

export const buildTavilySearchQuery = buildWebSearchQuery;

export async function searchTavily(input: {
  query: string;
  apiKey: string;
  maxResults?: number;
}): Promise<WebSearchResult[]> {
  const requestSearch = async (query: string): Promise<WebSearchResult[]> => {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: input.maxResults ?? 8,
        include_answer: false,
        include_raw_content: false,
        auto_parameters: true
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Tavily API ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as TavilySearchResponse;
    return (data.results ?? [])
      .map((item) => ({
        title: item.title?.trim() ?? "",
        url: item.url?.trim() ?? "",
        content: item.content?.trim() ?? ""
      }))
      .filter((item) => item.title && item.url);
  };

  const normalized = input.query.trim();
  const primary = await requestSearch(buildWebSearchQuery(normalized));
  if (primary.length > 0) return primary;
  return requestSearch(normalized);
}

export async function searchBrave(input: {
  query: string;
  apiKey: string;
  maxResults?: number;
}): Promise<WebSearchResult[]> {
  const count = input.maxResults ?? 8;
  const requestSearch = async (query: string): Promise<WebSearchResult[]> => {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(count));
    url.searchParams.set("extra_snippets", "true");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": input.apiKey
      }
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brave Search API ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as BraveWebSearchResponse;
    return (data.web?.results ?? [])
      .map((item) => {
        const desc = stripHtmlSnippet(item.description ?? "");
        const extra = (item.extra_snippets ?? []).map(stripHtmlSnippet).filter(Boolean).join(" ");
        const content = [desc, extra].filter(Boolean).join(" ");
        return {
          title: item.title?.trim() ?? "",
          url: item.url?.trim() ?? "",
          content
        };
      })
      .filter((item) => item.title && item.url);
  };

  const normalized = input.query.trim();
  const primary = await requestSearch(buildWebSearchQuery(normalized));
  if (primary.length > 0) return primary;
  return requestSearch(normalized);
}

type ExaSearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    text?: string;
    highlights?: string[];
    summary?: string;
  }>;
};

function exaSnippetFromItem(item: {
  text?: string;
  highlights?: string[];
  summary?: string;
}): string {
  const summary = (item.summary ?? "").trim();
  if (summary) return summary;
  const text = (item.text ?? "").trim();
  if (text) return text;
  const fromHighlights = (item.highlights ?? []).map((h) => h.trim()).filter(Boolean).join(" ");
  return fromHighlights;
}

export async function searchExa(input: {
  query: string;
  apiKey: string;
  maxResults?: number;
}): Promise<WebSearchResult[]> {
  const numResults = input.maxResults ?? 8;
  const requestSearch = async (query: string): Promise<WebSearchResult[]> => {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey
      },
      body: JSON.stringify({
        query,
        type: "auto",
        numResults,
        contents: {
          // LLM-generated page summary (not full text); smaller and usually coherent vs raw highlights.
          summary: true,
          maxAgeHours: 0
        }
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Exa Search API ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = (await res.json()) as ExaSearchResponse;
    return (data.results ?? [])
      .map((item) => ({
        title: item.title?.trim() ?? "",
        url: item.url?.trim() ?? "",
        content: exaSnippetFromItem(item)
      }))
      .filter((item) => item.title && item.url);
  };

  const normalized = input.query.trim();
  const primary = await requestSearch(buildWebSearchQuery(normalized));
  if (primary.length > 0) return primary;
  return requestSearch(normalized);
}

/** `en` | `zh` — matches UI locale for LLM prompts. */
export function formatWebSearchResultsForPrompt(
  results: WebSearchResult[],
  locale: "en" | "zh" = "zh"
): string {
  if (results.length === 0) {
    return locale === "en"
      ? "Web search results:\nNo usable results found."
      : "联网搜索资料：\n没有找到可用结果。";
  }
  const header = locale === "en" ? "Web search results:" : "联网搜索资料：";
  const snippetLabel = locale === "en" ? "\nSnippet: " : "\n摘要：";
  const urlLabel = locale === "en" ? "\nURL: " : "\nURL：";
  return [
    header,
    ...results.map((item, index) => {
      const content = item.content ? `${snippetLabel}${item.content}` : "";
      return `[${index + 1}] ${item.title}${urlLabel}${item.url}${content}`;
    })
  ].join("\n\n");
}
