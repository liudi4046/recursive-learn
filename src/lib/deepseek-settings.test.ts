import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDeepseekSettings,
  loadDeepseekSettings,
  saveDeepseekSettings
} from "./deepseek-settings";

describe("deepseek settings", () => {
  beforeEach(async () => {
    indexedDB = new IDBFactory();
    await clearDeepseekSettings();
  });

  it("saves and loads LLM provider, model, and per-provider keys", async () => {
    await saveDeepseekSettings({
      llmProvider: "openai",
      llmModel: "gpt-4o",
      keys: { openai: " sk-openai " },
      tavilyApiKey: " tvly-key ",
      webSearchProvider: "tavily"
    });

    await expect(loadDeepseekSettings()).resolves.toEqual({
      llmProvider: "openai",
      llmModel: "gpt-4o",
      keys: expect.objectContaining({
        openai: "sk-openai",
        deepseek: "",
        claude: ""
      }),
      tavilyApiKey: "tvly-key",
      braveApiKey: "",
      exaApiKey: "",
      webSearchProvider: "tavily"
    });
  });

  it("defaults web search provider to Exa when omitted on save", async () => {
    await saveDeepseekSettings({
      llmProvider: "deepseek",
      llmModel: "",
      keys: { deepseek: "k" }
    });

    await expect(loadDeepseekSettings()).resolves.toMatchObject({
      webSearchProvider: "exa"
    });
  });

  it("saves Brave provider and API key", async () => {
    await saveDeepseekSettings({
      llmProvider: "deepseek",
      llmModel: "",
      keys: {},
      braveApiKey: " brave-key ",
      webSearchProvider: "brave"
    });

    await expect(loadDeepseekSettings()).resolves.toMatchObject({
      braveApiKey: "brave-key",
      webSearchProvider: "brave"
    });
  });

  it("saves Exa provider and API key", async () => {
    await saveDeepseekSettings({
      llmProvider: "deepseek",
      llmModel: "",
      keys: {},
      exaApiKey: " exa-key ",
      webSearchProvider: "exa"
    });

    await expect(loadDeepseekSettings()).resolves.toMatchObject({
      exaApiKey: "exa-key",
      webSearchProvider: "exa"
    });
  });
});
