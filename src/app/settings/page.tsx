"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  clearDeepseekSettings,
  DEEPSEEK_MODEL_OPTIONS,
  loadDeepseekSettings,
  type DeepseekModelId,
  saveDeepseekSettings
} from "@/lib/deepseek-settings";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<DeepseekModelId>("deepseek-v4-flash");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadDeepseekSettings();
    setApiKey(s.apiKey);
    setModel(s.model);
  }, []);

  function onSave(e: FormEvent) {
    e.preventDefault();
    saveDeepseekSettings({ apiKey, model });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function onClear() {
    clearDeepseekSettings();
    setApiKey("");
    setModel("deepseek-v4-flash");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="mx-auto max-w-[720px] px-10 pb-16 pt-10">
      <h1 className="text-[1.85rem] font-bold leading-tight tracking-tight text-ml-ink">Settings</h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ml-muted">
        Add your DeepSeek API key to get real answers when you ask on a learning node. The key is kept in this
        browser only (local storage) and is sent to this app’s server when you submit a question, then to DeepSeek. Do
        not use on a shared device unless you clear it when done.
      </p>

      <form onSubmit={onSave} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-[0.9rem] font-semibold text-ml-ink" htmlFor="ds-key">
            DeepSeek API key
          </label>
          <input
            id="ds-key"
            name="apiKey"
            type="password"
            autoComplete="off"
            className="w-full rounded-ml border border-ml-line bg-ml-card px-3.5 py-2.5 text-[0.95rem] text-ml-ink outline-none focus:border-ml-blue focus:ring-2 focus:ring-ml-blue/20"
            placeholder="sk-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div>
          <span className="mb-2 block text-[0.9rem] font-semibold text-ml-ink">Model</span>
          <div className="space-y-3" role="radiogroup" aria-label="DeepSeek model">
            {DEEPSEEK_MODEL_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={[
                  "flex cursor-pointer gap-3 rounded-ml border border-ml-line bg-ml-card p-4",
                  model === opt.id ? "border-ml-blue ring-1 ring-ml-blue/30" : ""
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="model"
                  value={opt.id}
                  checked={model === opt.id}
                  onChange={() => setModel(opt.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-ml-ink">{opt.label}</span>
                  <span className="mt-0.5 block text-[0.88rem] text-ml-muted">{opt.hint}</span>
                  <span className="mt-1 block font-mono text-[0.78rem] text-ml-muted/90">{opt.id}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border-0 bg-ml-blue px-6 py-2.5 text-[0.9rem] font-semibold text-white shadow-ml-cta-tight"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex cursor-pointer items-center gap-2 rounded-ml-sm border border-ml-line bg-ml-card px-6 py-2.5 text-[0.9rem] font-medium text-ml-ink"
          >
            Clear key
          </button>
          {saved ? <span className="text-[0.9rem] text-ml-green">Saved.</span> : null}
        </div>
      </form>
    </main>
  );
}
