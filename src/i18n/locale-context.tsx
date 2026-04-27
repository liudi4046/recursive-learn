"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { type AppLocale, type MessageKey, MESSAGES, formatMessage } from "./strings";

const STORAGE_KEY = "maplearn-locale";

function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "zh") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultLocaleFromEnv(): AppLocale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

type LocaleCtx = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  /** Fixed "en" on first paint so SSR/CSR hydration matches; sync from storage after. */
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useLayoutEffect(() => {
    setLocaleState(readStoredLocale() ?? defaultLocaleFromEnv());
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const raw = MESSAGES[locale][key];
      return formatMessage(raw, vars);
    },
    [locale]
  );

  useEffect(() => {
    const lang = locale === "zh" ? "zh-CN" : "en";
    document.documentElement.lang = lang;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
