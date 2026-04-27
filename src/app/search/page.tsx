"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterNodesByKeyword } from "@/domain/node-search";
import { getRootNode } from "@/domain/topic-tree";
import { IconExternalLink, IconNodeCard } from "@/components/Icons";
import { useLocale } from "@/i18n/locale-context";
import { useAppState } from "@/state/app-state-context";

export default function SearchPage() {
  const { t } = useLocale();
  const { rehydrated, state } = useAppState();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!state) return [];
    return filterNodesByKeyword(state.nodes, query);
  }, [state, query]);

  if (!rehydrated) {
    return null;
  }

  if (!state) {
    return (
      <main className="mx-auto max-w-[900px] px-10 py-12">
        <h1 className="text-2xl font-bold text-ml-ink">{t("searchTitle")}</h1>
        <p className="mt-3 text-ml-muted">
          {t("searchNoSession")}{" "}
          <Link href="/">{t("searchStartHome")}</Link>.
        </p>
      </main>
    );
  }

  const trimmed = query.trim();
  const showHint = trimmed.length === 0;
  const showEmpty = !showHint && results.length === 0;

  return (
    <main className="mx-auto max-w-[900px] px-10 py-10">
      <nav className="mb-2 text-[0.88rem] text-ml-muted" aria-label="Breadcrumb">
        <span>{t("searchTitle")}</span>
      </nav>
      <h1 className="m-0 text-[1.75rem] font-bold tracking-tight text-ml-ink">{t("searchHeading")}</h1>
      <p className="mt-2 max-w-lg text-[0.95rem] text-ml-muted">{t("searchDescription")}</p>
      <div className="mt-6">
        <input
          type="search"
          autoComplete="off"
          aria-label={t("searchNodesAria")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-12 w-full max-w-2xl rounded-ml-sm border border-ml-line bg-ml-card px-4 py-3 text-[0.95rem] text-ml-ink shadow-ml-card outline-none transition-[border-color,box-shadow] placeholder:text-ml-muted focus:border-ml-blue focus:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]"
        />
      </div>
      {showHint ? (
        <p className="mt-6 text-[0.95rem] text-ml-muted">{t("searchKeywordHint")}</p>
      ) : null}
      {showEmpty ? (
        <p className="mt-6 text-[0.95rem] text-ml-muted">{t("searchNoMatch")}</p>
      ) : null}
      {!showHint && results.length > 0 ? (
        <ul className="mt-8 list-none p-0">
          {results.map((node) => {
            const root = getRootNode(state.nodes, node.mapRootId);
            const mapTitle = root?.title ?? t("searchMapFallback");
            const isRoot = node.parentNodeId === null;
            return (
              <li key={node.id} className="mb-3">
                <div
                  className={[
                    "group flex w-full max-w-lg items-stretch gap-2 rounded-ml",
                    "border border-ml-line bg-ml-card shadow-ml-card transition-[box-shadow,transform] duration-200",
                    "hover:-translate-y-px hover:border-ml-hairline hover:shadow-ml-card"
                  ].join(" ")}
                >
                  <Link
                    href={`/nodes/${node.id}`}
                    className={[
                      "flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 no-underline",
                      "text-inherit"
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-start gap-3.5">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-ml-sm bg-ml-blue-soft text-ml-blue"
                        aria-hidden
                      >
                        <IconNodeCard className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block text-[1.02rem] font-semibold text-ml-ink group-hover:text-ml-blue">
                          {node.title}
                        </span>
                        <span className="mt-0.5 block text-[0.85rem] text-ml-muted">
                          {mapTitle}
                          {isRoot ? ` · ${t("searchRoot")}` : ""} ·{" "}
                          {node.status === "mastered" ? t("searchMastered") : t("searchUnmastered")}
                        </span>
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.86rem] font-semibold text-ml-blue">
                      {t("searchOpen")}
                      <IconExternalLink />
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
