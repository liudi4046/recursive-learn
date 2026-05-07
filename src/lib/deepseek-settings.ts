import { z } from "zod";
import { deleteIndexedDbRecord, getIndexedDbRecord, putIndexedDbRecord } from "./indexed-db";

const SETTINGS_ID = "deepseek-settings";
const LEGACY_STORAGE_KEY = "maplearn.deepseek.v1";

const legacyModelIdSchema = z.enum(["deepseek-v4-pro", "deepseek-v4-flash"]);

export const LLM_PROVIDER_IDS = [
  "openai",
  "gemini",
  "claude",
  "deepseek",
  "kimi",
  "glm",
  "qwen",
  "minimax"
] as const;
export const llmProviderSchema = z.enum(LLM_PROVIDER_IDS);
export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number];

export const LLM_PROVIDER_OPTIONS: Array<{
  id: LlmProviderId;
  label: string;
  hint: string;
  defaultModel: string;
}> = [
  {
    id: "openai",
    label: "OpenAI",
    hint: "API key from platform.openai.com; uses the OpenAI Chat Completions API.",
    defaultModel: "gpt-4o-mini"
  },
  {
    id: "gemini",
    label: "Gemini (Google AI)",
    hint: "API key from Google AI Studio; uses the OpenAI-compatible endpoint.",
    defaultModel: "gemini-2.0-flash"
  },
  {
    id: "claude",
    label: "Claude (Anthropic)",
    hint: "API key from Anthropic Console; uses the Messages API.",
    defaultModel: "claude-sonnet-4-20250514"
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    hint: "API key from DeepSeek; OpenAI-compatible base URL.",
    defaultModel: "deepseek-chat"
  },
  {
    id: "kimi",
    label: "Kimi (Moonshot)",
    hint: "API key from Moonshot; OpenAI-compatible endpoint.",
    defaultModel: "moonshot-v1-8k"
  },
  {
    id: "glm",
    label: "GLM (Zhipu)",
    hint: "API key from Zhipu Open Platform; OpenAI-compatible v4 endpoint.",
    defaultModel: "glm-4-flash"
  },
  {
    id: "qwen",
    label: "Qwen (DashScope)",
    hint: "API key from Alibaba DashScope; compatible-mode OpenAI endpoint.",
    defaultModel: "qwen-turbo"
  },
  {
    id: "minimax",
    label: "MiniMax",
    hint: "API key from platform.minimaxi.com; uses Anthropic-compatible Messages endpoint (base: https://api.minimaxi.com/anthropic).",
    defaultModel: "MiniMax-M2.7"
  }
];

/** OpenAI-style `/v1/chat/completions` base URL (no trailing slash). Not used for `claude`. */
export const LLM_PROVIDER_BASE_URL: Record<Exclude<LlmProviderId, "claude">, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  deepseek: "https://api.deepseek.com/v1",
  kimi: "https://api.moonshot.cn/v1",
  glm: "https://open.bigmodel.cn/api/paas/v4",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  minimax: "https://api.minimaxi.com/v1"
};

export function defaultModelForProvider(id: LlmProviderId): string {
  return LLM_PROVIDER_OPTIONS.find((o) => o.id === id)?.defaultModel ?? "gpt-4o-mini";
}

const emptyKeys = (): Record<LlmProviderId, string> => ({
  openai: "",
  gemini: "",
  claude: "",
  deepseek: "",
  kimi: "",
  glm: "",
  qwen: "",
  minimax: ""
});

const keysSchema = z
  .object({
    openai: z.string().optional(),
    gemini: z.string().optional(),
    claude: z.string().optional(),
    deepseek: z.string().optional(),
    kimi: z.string().optional(),
    glm: z.string().optional(),
    qwen: z.string().optional(),
    minimax: z.string().optional()
  })
  .optional();

export const webSearchProviderSchema = z.enum(["tavily", "brave", "exa"]);
export type WebSearchProviderId = z.infer<typeof webSearchProviderSchema>;

export const WEB_SEARCH_PROVIDER_OPTIONS: Array<{ id: WebSearchProviderId; label: string; hint: string }> = [
  {
    id: "exa",
    label: "Exa",
    hint: "Exa neural search API (x-api-key from dashboard.exa.ai)."
  },
  {
    id: "tavily",
    label: "Tavily",
    hint: "Search API optimized for LLM context."
  },
  {
    id: "brave",
    label: "Brave Search",
    hint: "Brave Web Search API (subscription token)."
  }
];

const storedSchemaV2 = z.object({
  llmProvider: llmProviderSchema,
  llmModel: z.string(),
  keys: keysSchema,
  tavilyApiKey: z.string().optional().default(""),
  braveApiKey: z.string().optional().default(""),
  exaApiKey: z.string().optional().default(""),
  webSearchProvider: webSearchProviderSchema.optional().default("exa")
});

/** @deprecated Use LlmProviderId + string model instead */
export type DeepseekModelId = z.infer<typeof legacyModelIdSchema>;

export type DeepseekSettings = {
  llmProvider: LlmProviderId;
  llmModel: string;
  keys: Record<LlmProviderId, string>;
  tavilyApiKey: string;
  braveApiKey: string;
  exaApiKey: string;
  webSearchProvider: WebSearchProviderId;
};

/** @deprecated Use defaultModelForProvider("deepseek") */
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

type SettingsRecord = {
  id: typeof SETTINGS_ID;
} & DeepseekSettings;

function defaultSettings(): DeepseekSettings {
  return {
    llmProvider: "deepseek",
    llmModel: defaultModelForProvider("deepseek"),
    keys: emptyKeys(),
    tavilyApiKey: "",
    braveApiKey: "",
    exaApiKey: "",
    webSearchProvider: "exa"
  };
}

function normalizeKeys(raw: z.infer<typeof keysSchema>): Record<LlmProviderId, string> {
  const base = emptyKeys();
  if (!raw) return base;
  for (const id of LLM_PROVIDER_IDS) {
    const v = raw[id];
    if (typeof v === "string" && v.length > 0) base[id] = v.trim();
  }
  return base;
}

function parseV2(record: unknown): DeepseekSettings | null {
  const data = storedSchemaV2.safeParse(record);
  if (!data.success) return null;
  return {
    llmProvider: data.data.llmProvider,
    llmModel: data.data.llmModel.trim(),
    keys: normalizeKeys(data.data.keys),
    tavilyApiKey: data.data.tavilyApiKey.trim(),
    braveApiKey: data.data.braveApiKey.trim(),
    exaApiKey: data.data.exaApiKey.trim(),
    webSearchProvider: data.data.webSearchProvider
  };
}

const legacyStoredSchema = z.object({
  apiKey: z.string(),
  model: legacyModelIdSchema,
  tavilyApiKey: z.string().optional().default(""),
  braveApiKey: z.string().optional().default(""),
  exaApiKey: z.string().optional().default(""),
  webSearchProvider: webSearchProviderSchema.optional().default("exa")
});

function fromLegacy(data: z.infer<typeof legacyStoredSchema>): DeepseekSettings {
  const keys = emptyKeys();
  keys.deepseek = data.apiKey.trim();
  return {
    llmProvider: "deepseek",
    llmModel: data.model,
    keys,
    tavilyApiKey: data.tavilyApiKey.trim(),
    braveApiKey: data.braveApiKey.trim(),
    exaApiKey: data.exaApiKey.trim(),
    webSearchProvider: data.webSearchProvider
  };
}

function loadLegacyDeepseekSettings(): DeepseekSettings | null {
  try {
    const storage = typeof window === "undefined" ? undefined : window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return null;
    const raw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const data = legacyStoredSchema.safeParse(parsed);
    if (!data.success) return null;
    return fromLegacy(data.data);
  } catch {
    return null;
  }
}

function clearLegacyDeepseekSettings(): void {
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  if (!storage || typeof storage.removeItem !== "function") return;
  storage.removeItem(LEGACY_STORAGE_KEY);
}

function migrateIndexedRecord(record: unknown): DeepseekSettings | null {
  const v2 = parseV2(record);
  if (v2) return v2;
  const legacy = legacyStoredSchema.safeParse(record);
  if (legacy.success) return fromLegacy(legacy.data);
  return null;
}

export async function loadDeepseekSettings(): Promise<DeepseekSettings> {
  try {
    const record = await getIndexedDbRecord<unknown>(SETTINGS_ID);
    if (record != null && typeof record === "object" && "id" in record) {
      const migrated = migrateIndexedRecord(record);
      if (migrated) {
        if (!parseV2(record)) {
          await saveDeepseekSettings(migrated);
        }
        return migrated;
      }
    }

    const legacy = loadLegacyDeepseekSettings();
    if (!legacy) return defaultSettings();
    await saveDeepseekSettings(legacy);
    clearLegacyDeepseekSettings();
    return legacy;
  } catch {
    return defaultSettings();
  }
}

export async function saveDeepseekSettings(input: {
  llmProvider: LlmProviderId;
  llmModel: string;
  keys: Partial<Record<LlmProviderId, string>>;
  tavilyApiKey?: string;
  braveApiKey?: string;
  exaApiKey?: string;
  webSearchProvider?: WebSearchProviderId;
}): Promise<void> {
  const keys = emptyKeys();
  for (const id of LLM_PROVIDER_IDS) {
    const v = input.keys[id];
    keys[id] = typeof v === "string" ? v.trim() : "";
  }
  const payload: SettingsRecord = {
    id: SETTINGS_ID,
    llmProvider: input.llmProvider,
    llmModel: input.llmModel.trim(),
    keys,
    tavilyApiKey: input.tavilyApiKey?.trim() ?? "",
    braveApiKey: input.braveApiKey?.trim() ?? "",
    exaApiKey: input.exaApiKey?.trim() ?? "",
    webSearchProvider: input.webSearchProvider ?? "exa"
  };
  await putIndexedDbRecord(payload);
}

/** Resolved model string for API calls (falls back to provider default). */
export function resolvedLlmModel(settings: DeepseekSettings): string {
  const m = settings.llmModel.trim();
  return m || defaultModelForProvider(settings.llmProvider);
}

/**
 * Fields to attach to `/api/ask` so the server can pick provider, model, and optional key.
 * Omits `apiKey` when empty so the server can fall back to environment variables.
 */
export function buildAskLlmFields(settings: DeepseekSettings): {
  llm: { provider: LlmProviderId; model: string; apiKey?: string };
} {
  const apiKey = settings.keys[settings.llmProvider].trim();
  const model = resolvedLlmModel(settings);
  return {
    llm: {
      provider: settings.llmProvider,
      model,
      ...(apiKey ? { apiKey } : {})
    }
  };
}

/** Fields to send on `/api/ask` when web search is enabled (keys optional — server can use env). */
export function webSearchApiFields(
  settings: DeepseekSettings,
  useWebSearch: boolean
): {
  webSearchProvider?: WebSearchProviderId;
  tavily?: { apiKey: string };
  brave?: { apiKey: string };
  exa?: { apiKey: string };
} {
  if (!useWebSearch) return {};
  if (settings.webSearchProvider === "brave") {
    const base: { webSearchProvider: "brave"; brave?: { apiKey: string } } = {
      webSearchProvider: "brave"
    };
    if (settings.braveApiKey) base.brave = { apiKey: settings.braveApiKey };
    return base;
  }
  if (settings.webSearchProvider === "exa") {
    const base: { webSearchProvider: "exa"; exa?: { apiKey: string } } = {
      webSearchProvider: "exa"
    };
    if (settings.exaApiKey) base.exa = { apiKey: settings.exaApiKey };
    return base;
  }
  const base: { webSearchProvider: "tavily"; tavily?: { apiKey: string } } = {
    webSearchProvider: "tavily"
  };
  if (settings.tavilyApiKey) base.tavily = { apiKey: settings.tavilyApiKey };
  return base;
}

export async function clearDeepseekSettings(): Promise<void> {
  await deleteIndexedDbRecord(SETTINGS_ID);
  clearLegacyDeepseekSettings();
}
