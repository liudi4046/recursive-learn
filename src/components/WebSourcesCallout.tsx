"use client";

import Link from "next/link";
import type { WebSourceSummary } from "@/domain/types";
import { useLocale } from "@/i18n/locale-context";
import { IconChevronDown, IconGlobe } from "./Icons";

type Props = {
  /** When true, the user had 联网 on (show even if there are no snippets). */
  webSearchRan: boolean;
  sources: WebSourceSummary[];
  /** Slightly tighter padding for inline / stream cards */
  compact?: boolean;
  /** Initial open state (uncontrolled). Default: collapsed. */
  defaultOpen?: boolean;
};

/**
 * Shows which web pages were consulted and a short snippet so users know search actually ran.
 * Collapsible via native <details>.
 */
export function WebSourcesCallout({ webSearchRan, sources, compact, defaultOpen }: Props) {
  const { t } = useLocale();
  if (!webSearchRan) return null;

  const shown = sources.filter((s) => s.title || s.url || s.snippet);
  const count = shown.length;

  return (
    <details
      className={[
        "web-ref-details rounded-ml border border-ml-green/25 bg-gradient-to-br from-ml-green-soft/80 to-ml-card",
        "shadow-sm open:shadow-md open:shadow-ml-green/5",
        compact ? "px-3 py-2" : "px-4 py-2.5"
      ].join(" ")}
      aria-label={t("webRefAria")}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary
        className={[
          "flex cursor-pointer select-none items-center gap-2 rounded-md py-1 text-left",
          "text-[0.78rem] font-semibold uppercase tracking-wide text-ml-green",
          "transition-[color] hover:text-ml-green/90",
          "-outline-offset-2 outline-ml-blue focus-visible:outline focus-visible:outline-2"
        ].join(" ")}
      >
        <IconChevronDown
          className="web-ref-chevron h-3.5 w-3.5 shrink-0 text-ml-green transition-transform duration-200 ease-out"
          aria-hidden
        />
        <IconGlobe className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          {t("webRefTitle")}
          {count > 0 ? (
            <span className="ml-1.5 font-medium normal-case tracking-normal text-ml-muted">
              {t("webRefCount", { count })}
            </span>
          ) : (
            <span className="ml-1.5 font-medium normal-case tracking-normal text-ml-muted">
              {t("webRefNoSnippets")}
            </span>
          )}
        </span>
        <span className="ml-auto shrink-0 text-[0.7rem] font-medium normal-case tracking-normal text-ml-muted">
          <span className="web-ref-hint-closed">{t("webRefExpand")}</span>
          <span className="web-ref-hint-open">{t("webRefCollapse")}</span>
        </span>
      </summary>
      <div className="mt-2 border-t border-ml-green/15 pt-2.5">
        {shown.length === 0 ? (
          <p className="m-0 text-[0.88rem] leading-relaxed text-ml-muted">{t("webRefNoSummary")}</p>
        ) : (
          <ul className="m-0 list-none space-y-2.5 p-0">
            {shown.map((item, i) => (
              <li
                key={`${item.url}-${i}`}
                className="rounded-md border border-ml-hairline bg-ml-card/80 px-3 py-2"
              >
                <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[0.7rem] font-medium text-ml-muted tabular-nums">[{i + 1}]</span>
                  {item.url ? (
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 text-[0.9rem] font-semibold text-ml-blue hover:text-ml-blue-deep hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.title || item.url}
                    </Link>
                  ) : (
                    <span className="text-[0.9rem] font-semibold text-ml-ink">
                      {item.title || t("webRefNoTitle")}
                    </span>
                  )}
                </div>
                {item.snippet ? (
                  <p className="m-0 mt-1.5 line-clamp-3 text-[0.82rem] leading-relaxed text-ml-muted">
                    {item.snippet}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
