"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-context";
import { useAppState } from "@/state/app-state-context";
import { IconChevronDown, IconLearningMap, IconSearch, IconSettings, LogoMark } from "./Icons";

const navLink = (active: boolean) =>
  [
    "inline-flex items-center gap-2 border-b-2 border-transparent px-3.5 pb-3 -mb-px text-[0.92rem] font-medium text-ml-ink no-underline",
    "hover:text-ml-blue [&_svg]:opacity-85",
    active ? "border-ml-blue text-ml-blue [&_svg]:text-ml-blue" : ""
  ]
    .filter(Boolean)
    .join(" ");

export function SiteHeader() {
  const { t, locale, setLocale } = useLocale();
  const { state } = useAppState();
  const [path, setPath] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    sync();
    const onPop = () => sync();
    window.addEventListener("popstate", onPop);
    const id = window.setInterval(sync, 400);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    const onDoc = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const mapHref = state ? "/maps" : "/";

  const learningMapActive =
    path.startsWith("/maps") || path.startsWith("/nodes") || (path === "/" && Boolean(state));
  const searchActive = path.startsWith("/search");
  const settingsActive = path.startsWith("/settings");

  const currentLangLabel = locale === "en" ? t("localeMenuEnglish") : t("langChinese");

  return (
    <header className="flex items-center justify-between gap-6 border-b border-ml-line bg-ml-card px-10 py-3.5">
      <Link href="/" className="inline-flex items-center gap-2.5 no-underline text-ml-ink">
        <LogoMark className="shrink-0 text-ml-blue" />
        <span className="text-[1.05rem] font-bold tracking-tight">{t("brandName")}</span>
      </Link>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
        <nav className="flex min-w-0 items-center gap-0 sm:gap-0.5" aria-label="Primary">
          <Link href={mapHref} className={navLink(learningMapActive)}>
            <IconLearningMap />
            <span>{t("navLearningMap")}</span>
          </Link>
          <Link href="/search" className={navLink(searchActive)}>
            <IconSearch />
            <span>{t("navSearch")}</span>
          </Link>
          <Link href="/settings" className={navLink(settingsActive)}>
            <IconSettings />
            <span>{t("navSettings")}</span>
          </Link>
          <div className="relative shrink-0" ref={langMenuRef}>
            <button
              type="button"
              className={[
                "inline-flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-3.5 pb-3 -mb-px",
                "text-[0.92rem] font-medium text-ml-ink no-underline",
                "hover:text-ml-blue",
                "transition-[color] [&_svg]:text-ml-muted hover:[&_svg]:text-ml-blue"
              ].join(" ")}
              aria-label={t("navLanguage")}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              onClick={() => setLangOpen((o) => !o)}
            >
              <span className="tabular-nums">{currentLangLabel}</span>
              <IconChevronDown
                className={[
                  "h-[1em] w-[1em] shrink-0 transition-transform duration-200",
                  langOpen ? "rotate-180" : ""
                ].join(" ")}
                aria-hidden
              />
            </button>
          {langOpen ? (
            <ul
              className="absolute right-0 top-[calc(100%+6px)] z-[200] m-0 min-w-[7.5rem] list-none overflow-hidden rounded-ml-sm border border-ml-line bg-ml-card p-0 py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]"
              role="listbox"
              aria-label={t("navLanguage")}
            >
              <li role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === "en"}
                  className={[
                    "w-full cursor-pointer border-0 px-3.5 py-2 text-left text-[0.88rem] font-medium",
                    locale === "en" ? "bg-ml-blue-soft text-ml-blue" : "bg-transparent text-ml-ink hover:bg-ml-preview-bg"
                  ].join(" ")}
                  onClick={() => {
                    setLocale("en");
                    setLangOpen(false);
                  }}
                >
                  {t("localeMenuEnglish")}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === "zh"}
                  className={[
                    "w-full cursor-pointer border-0 px-3.5 py-2 text-left text-[0.88rem] font-medium",
                    locale === "zh" ? "bg-ml-blue-soft text-ml-blue" : "bg-transparent text-ml-ink hover:bg-ml-preview-bg"
                  ].join(" ")}
                  onClick={() => {
                    setLocale("zh");
                    setLangOpen(false);
                  }}
                >
                  {t("langChinese")}
                </button>
              </li>
            </ul>
          ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
