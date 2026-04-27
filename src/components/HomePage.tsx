"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-context";
import { IconArrowRight, IconGlobe, IconSearch } from "./Icons";

const heroCardBase =
  "w-full rounded-ml border border-ml-line bg-ml-card p-3.5 shadow-ml-card";

const heroLineY = "w-0.5 rounded-sm bg-ml-hero-line";

/** Vertical connectors in the hero demo (tall = more air between cards). */
const lineAboveRoot = "h-9";
const lineDownToChild = "h-10";
const lineBetweenSiblings = "h-8";

/** Highlights phrases tied to child questions—plain text, not link-styled. */
const em = "rounded-sm bg-ml-segment-bg px-0.5 font-medium text-ml-ink";

function MasteryPill({ mastered, label }: { mastered: boolean; label: string }) {
  return (
    <span
      className={[
        "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
        mastered ? "border-ml-green/40 bg-ml-green-soft text-ml-green" : "border-ml-yellow/45 bg-ml-yellow-soft text-ml-yellow"
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function HomePage({
  onStart,
  continueNodeId
}: {
  onStart: (topic: string, webSearch: boolean) => void;
  continueNodeId?: string;
}) {
  const { t } = useLocale();
  const [topic, setTopic] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onStart(trimmed, webSearch);
    setTopic("");
  }

  return (
    <main className="mx-auto max-w-[1280px] px-10 pb-16 pt-12">
      <div className="grid items-center gap-12 max-[960px]:grid-cols-1 grid-cols-2">
        <div>
          <h1 className="mb-4 text-[clamp(1.85rem,3.2vw,2.65rem)] font-bold leading-[1.15] tracking-tight text-ml-blue">
            {t("homeHeroTitle")}
          </h1>
          <p className="mb-7 max-w-[28rem] text-base text-ml-muted">{t("homeSubtitle")}</p>
          {continueNodeId != null && continueNodeId !== "" && (
            <p className="mb-4 max-w-[28rem]">
              <Link
                href={`/nodes/${continueNodeId}`}
                className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-ml-blue hover:text-ml-blue-deep [&_svg]:shrink-0"
              >
                {t("homeContinue")}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </p>
          )}
          <form
            className="mt-0 flex min-w-0 max-w-2xl flex-nowrap items-center gap-2.5 sm:gap-3"
            onSubmit={handleSubmit}
          >
            <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-ml-line bg-ml-card px-4 py-1 shadow-ml-card">
              <IconSearch className="shrink-0 text-ml-muted" />
              <input
                ref={inputRef}
                aria-label={t("homeTopicAria")}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={t("homeTopicPlaceholder")}
                className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-1 outline-none"
              />
            </div>
            <button
              type="button"
              className={[
                "inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-ml-card transition-[background,color,border-color] duration-150",
                webSearch
                  ? "border-ml-green/40 bg-ml-green-soft text-ml-green"
                  : "border-ml-line bg-ml-card text-ml-muted hover:bg-ml-preview-bg"
              ].join(" ")}
              aria-pressed={webSearch}
              aria-label={t("homeWebSearchAria")}
              title={t("homeWebSearchTitle")}
              onClick={() => setWebSearch((on) => !on)}
            >
              <IconGlobe className="h-5 w-5" />
            </button>
            <button
              type="submit"
              className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-ml-sm bg-ml-blue px-4 py-0 text-[0.9375rem] font-semibold text-white shadow-ml-cta hover:bg-ml-blue-deep sm:px-5 sm:text-base [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] [&_svg]:shrink-0"
            >
              {t("homeStart")}
              <IconArrowRight />
            </button>
          </form>
        </div>
        <div className="relative flex flex-col items-center gap-0 px-3 py-5" aria-hidden>
          <div className="flex flex-col items-center">
            <div className={`${lineAboveRoot} ${heroLineY}`} />
            <div className={`${heroCardBase} max-w-[280px]`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <strong className="min-w-0 text-[0.95rem] leading-tight text-ml-ink">{t("homeDemo1Title")}</strong>
                <MasteryPill mastered={false} label={t("nodeUnmastered")} />
              </div>
              <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                {t("homeDemo1BodyBefore1")}
                <span className={em}>{t("homeDemo1BodyEm1")}</span>
                {t("homeDemo1BodyMid")}
                <span className={em}>{t("homeDemo1BodyEm2")}</span>
                {t("homeDemo1BodyAfter")}
              </p>
            </div>
            <div className="mb-0 mt-5 flex flex-wrap items-start justify-center gap-8 sm:gap-10">
              <div className="flex max-w-[200px] flex-col items-center">
                <div className={`${lineDownToChild} ${heroLineY}`} />
                <div className={heroCardBase}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <strong className="min-w-0 text-[0.95rem] leading-tight text-ml-ink">{t("homeDemo2Title")}</strong>
                    <MasteryPill mastered label={t("nodeMastered")} />
                  </div>
                  <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                    {t("homeDemo2BodyBefore")}
                    <span className={em}>{t("homeDemo2BodyEm")}</span>
                    {t("homeDemo2BodyAfter")}
                  </p>
                </div>
                <div className={`mt-4 ${lineBetweenSiblings} ${heroLineY}`} />
                <div className={`${heroCardBase} mt-4 max-w-[220px]`}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <strong className="min-w-0 text-[0.95rem] leading-tight text-ml-ink">{t("homeDemo3Title")}</strong>
                    <MasteryPill mastered={false} label={t("nodeUnmastered")} />
                  </div>
                  <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">{t("homeDemo3Body")}</p>
                </div>
              </div>
              <div className="flex max-w-[200px] flex-col items-center">
                <div className={`${lineDownToChild} ${heroLineY}`} />
                <div className={heroCardBase}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <strong className="min-w-0 text-[0.95rem] leading-tight text-ml-ink">{t("homeDemo4Title")}</strong>
                    <MasteryPill mastered label={t("nodeMastered")} />
                  </div>
                  <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">{t("homeDemo4Body")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
