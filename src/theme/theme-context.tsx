"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

const STORAGE_KEY = "recursive-learn-theme";

export type ResolvedTheme = "light" | "dark";

function readStoredTheme(): ResolvedTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveStored(stored: ResolvedTheme | null): ResolvedTheme {
  if (stored !== null) return stored;
  return prefersDark() ? "dark" : "light";
}

type ThemeCtx = {
  theme: ResolvedTheme;
  setTheme: (next: ResolvedTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ResolvedTheme>("light");

  useLayoutEffect(() => {
    setThemeState(resolveStored(readStoredTheme()));
  }, []);

  const setTheme = useCallback((next: ResolvedTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /** Dark tokens must live on `html`, not an inner wrapper: portaled UI (e.g. dialogs) is a sibling of the app root and would miss a nested `.dark` scope. */
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-dvh bg-ml-surface font-sans text-[15px] leading-normal text-ml-ink antialiased">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
