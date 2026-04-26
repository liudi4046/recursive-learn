import { z } from "zod";

const STORAGE_KEY = "maplearn.deepseek.v1";

const modelIdSchema = z.enum(["deepseek-v4-pro", "deepseek-v4-flash"]);

const storedSchema = z.object({
  apiKey: z.string(),
  model: modelIdSchema
});

export type DeepseekModelId = z.infer<typeof modelIdSchema>;

export const DEEPSEEK_MODEL_OPTIONS: Array<{ id: DeepseekModelId; label: string; hint: string }> = [
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    hint: "Faster, lower cost — good default for most questions."
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    hint: "Stronger reasoning — better for hard or long tasks."
  }
];

export const DEFAULT_DEEPSEEK_MODEL: DeepseekModelId = "deepseek-v4-flash";

export function loadDeepseekSettings(): { apiKey: string; model: DeepseekModelId } {
  if (typeof window === "undefined") {
    return { apiKey: "", model: DEFAULT_DEEPSEEK_MODEL };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { apiKey: "", model: DEFAULT_DEEPSEEK_MODEL };
    const parsed = JSON.parse(raw) as unknown;
    const data = storedSchema.safeParse(parsed);
    if (!data.success) return { apiKey: "", model: DEFAULT_DEEPSEEK_MODEL };
    return { apiKey: data.data.apiKey, model: data.data.model };
  } catch {
    return { apiKey: "", model: DEFAULT_DEEPSEEK_MODEL };
  }
}

export function saveDeepseekSettings(input: { apiKey: string; model: DeepseekModelId }): void {
  if (typeof window === "undefined") return;
  const payload: z.infer<typeof storedSchema> = {
    apiKey: input.apiKey.trim(),
    model: input.model
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearDeepseekSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
