"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  clearDeepseekSettings,
  defaultModelForProvider,
  LLM_PROVIDER_OPTIONS,
  loadDeepseekSettings,
  type LlmProviderId,
  type WebSearchProviderId,
  saveDeepseekSettings,
  WEB_SEARCH_PROVIDER_OPTIONS
} from "@/lib/deepseek-settings";
import { exportStateJson, importStateJson } from "@/lib/storage";
import { useLocale } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/strings";
import { useAppState } from "@/state/app-state-context";

const LLM_KEY_MSG: Record<LlmProviderId, MessageKey> = {
  openai: "llmKeyOpenai",
  gemini: "llmKeyGemini",
  claude: "llmKeyClaude",
  deepseek: "llmKeyDeepseek",
  kimi: "llmKeyKimi",
  glm: "llmKeyGlm",
  qwen: "llmKeyQwen",
  minimax: "llmKeyMinimax"
};

const LLM_HINT_MSG: Record<LlmProviderId, MessageKey> = {
  openai: "llmHintOpenai",
  gemini: "llmHintGemini",
  claude: "llmHintClaude",
  deepseek: "llmHintDeepseek",
  kimi: "llmHintKimi",
  glm: "llmHintGlm",
  qwen: "llmHintQwen",
  minimax: "llmHintMinimax"
};

const WEB_HINT_MSG: Record<WebSearchProviderId, MessageKey> = {
  exa: "webHintExa",
  tavily: "webHintTavily",
  brave: "webHintBrave"
};

export default function SettingsPage() {
  const { t } = useLocale();
  const { state, setState } = useAppState();
  const [llmProvider, setLlmProvider] = useState<LlmProviderId>("deepseek");
  const [llmModel, setLlmModel] = useState("");
  const [keys, setKeys] = useState<Record<LlmProviderId, string>>(() =>
    LLM_PROVIDER_OPTIONS.reduce(
      (acc, o) => {
        acc[o.id] = "";
        return acc;
      },
      {} as Record<LlmProviderId, string>
    )
  );
  const [tavilyApiKey, setTavilyApiKey] = useState("");
  const [braveApiKey, setBraveApiKey] = useState("");
  const [exaApiKey, setExaApiKey] = useState("");
  const [webSearchProvider, setWebSearchProvider] = useState<WebSearchProviderId>("exa");
  const [saved, setSaved] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let ignore = false;
    void loadDeepseekSettings().then((s) => {
      if (ignore) return;
      setLlmProvider(s.llmProvider);
      setLlmModel(s.llmModel);
      setKeys(s.keys);
      setTavilyApiKey(s.tavilyApiKey);
      setBraveApiKey(s.braveApiKey);
      setExaApiKey(s.exaApiKey);
      setWebSearchProvider(s.webSearchProvider);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await saveDeepseekSettings({
      llmProvider,
      llmModel,
      keys,
      tavilyApiKey,
      braveApiKey,
      exaApiKey,
      webSearchProvider
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function onClear() {
    await clearDeepseekSettings();
    setLlmProvider("deepseek");
    setLlmModel("");
    setKeys(
      LLM_PROVIDER_OPTIONS.reduce(
        (acc, o) => {
          acc[o.id] = "";
          return acc;
        },
        {} as Record<LlmProviderId, string>
      )
    );
    setTavilyApiKey("");
    setBraveApiKey("");
    setExaApiKey("");
    setWebSearchProvider("exa");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function onExportData() {
    setDataMessage(null);
    try {
      const json = await exportStateJson(state ?? undefined);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recursive-learn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDataMessage(t("settingsExported"));
    } catch (e) {
      const message = e instanceof Error ? e.message : t("settingsExportFailed");
      setDataMessage(message);
    }
  }

  async function onImportData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDataMessage(null);
    try {
      const imported = await importStateJson(await file.text());
      setState(imported);
      setDataMessage(t("settingsImported"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("settingsImportFailed");
      setDataMessage(message);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  const providerHint = LLM_PROVIDER_OPTIONS.find((o) => o.id === llmProvider);
  const modelPlaceholder = providerHint?.defaultModel ?? defaultModelForProvider(llmProvider);

  return (
    <main className="mx-auto max-w-[720px] px-10 pb-16 pt-10">
      <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-ml-ink">{t("settingsTitle")}</h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ml-muted">{t("settingsIntro")}</p>

      <form onSubmit={onSave} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="llm-provider">
            {t("settingsLlmProvider")}
          </label>
          <select
            id="llm-provider"
            name="llmProvider"
            aria-label={t("settingsLlmProvider")}
            className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value as LlmProviderId)}
          >
            {LLM_PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {providerHint ? (
            <p className="mt-2 text-[0.88rem] leading-relaxed text-ml-muted">{t(LLM_HINT_MSG[llmProvider])}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="llm-model">
            {t("settingsModelName")}
          </label>
          <input
            id="llm-model"
            name="llmModel"
            type="text"
            autoComplete="off"
            className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
            placeholder={modelPlaceholder}
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
          />
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ml-muted">
            {t("settingsModelHint", { default: modelPlaceholder })}
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-[0.9rem] font-semibold text-ml-ink"
            htmlFor={`llm-api-key-${llmProvider}`}
          >
            {t(LLM_KEY_MSG[llmProvider])}
          </label>
          <input
            id={`llm-api-key-${llmProvider}`}
            key={llmProvider}
            name="llmApiKey"
            type="password"
            autoComplete="off"
            className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
            placeholder={t("settingsApiKeyPlaceholder")}
            value={keys[llmProvider]}
            onChange={(e) =>
              setKeys((prev) => ({ ...prev, [llmProvider]: e.target.value }))
            }
          />
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ml-muted">{t("settingsKeySwitchHint")}</p>
        </div>

        <div>
          <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="web-search-provider">
            {t("settingsWebSearchProvider")}
          </label>
          <select
            id="web-search-provider"
            name="webSearchProvider"
            aria-label={t("settingsWebSearchProvider")}
            className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
            value={webSearchProvider}
            onChange={(e) => setWebSearchProvider(e.target.value as WebSearchProviderId)}
          >
            {WEB_SEARCH_PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ml-muted">
            {t(WEB_HINT_MSG[webSearchProvider])}
          </p>
        </div>

        {webSearchProvider === "tavily" ? (
          <div>
            <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="tavily-key">
              {t("settingsTavilyKey")}
            </label>
            <input
              id="tavily-key"
              name="tavilyApiKey"
              type="password"
              autoComplete="off"
              className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
              placeholder="tvly-..."
              value={tavilyApiKey}
              onChange={(e) => setTavilyApiKey(e.target.value)}
            />
          </div>
        ) : webSearchProvider === "brave" ? (
          <div>
            <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="brave-key">
              {t("settingsBraveKey")}
            </label>
            <input
              id="brave-key"
              name="braveApiKey"
              type="password"
              autoComplete="off"
              className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
              placeholder="BSA…"
              value={braveApiKey}
              onChange={(e) => setBraveApiKey(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="exa-key">
              {t("settingsExaKey")}
            </label>
            <input
              id="exa-key"
              name="exaApiKey"
              type="password"
              autoComplete="off"
              className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
              placeholder="exa-…"
              value={exaApiKey}
              onChange={(e) => setExaApiKey(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border-0 bg-ml-blue px-6 py-2.5 text-[0.9rem] font-semibold text-white shadow-ml-cta-tight"
          >
            {t("settingsSave")}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border border-ml-line bg-ml-card px-6 py-2.5 text-[0.9rem] font-medium text-ml-ink"
          >
            {t("settingsClearKeys")}
          </button>
          {saved ? <span className="text-[0.9rem] text-ml-green">{t("settingsSaved")}</span> : null}
        </div>
      </form>

      <section className="mt-12 border-t border-ml-line pt-8" aria-labelledby="data-management-heading">
        <h2 id="data-management-heading" className="text-[1.2rem] font-bold text-ml-ink">
          {t("settingsDataManagement")}
        </h2>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-ml-muted">{t("settingsDataIntro")}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportData}
            className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border border-ml-line bg-ml-card px-6 py-2.5 text-[0.9rem] font-medium text-ml-ink"
          >
            {t("settingsExportJson")}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border border-ml-line bg-ml-card px-6 py-2.5 text-[0.9rem] font-medium text-ml-ink">
            {t("settingsImportJson")}
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label={t("settingsImportJson")}
              onChange={onImportData}
            />
          </label>
          {dataMessage ? <span className="text-[0.9rem] text-ml-green">{dataMessage}</span> : null}
        </div>
      </section>
    </main>
  );
}
