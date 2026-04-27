"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/i18n/locale-context";

type QaQuestionProps = {
  children: ReactNode;
  /** Main topic line — larger, soft blue panel */
  variant?: "lead" | "followUp" | "justAsk";
  className?: string;
};

/**
 * Visually distinct “question” block (Q badge + label) for learning content and 随问.
 */
export function QaQuestion({ children, variant = "lead", className = "" }: QaQuestionProps) {
  const { t } = useLocale();
  const isLead = variant === "lead";
  const label = variant === "justAsk" ? t("qaLabelYourQuestion") : t("qaLabelQuestion");
  return (
    <div
      className={[
        "rounded-ml border border-ml-blue/20 bg-gradient-to-b from-ml-blue-soft/95 to-ml-blue-soft/45",
        isLead ? "px-4 py-3.5 shadow-sm" : "mb-3 px-3.5 py-2.5 shadow-[0_1px_0_rgba(0,102,255,0.06)]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-ml-blue text-[0.58rem] font-bold tabular-nums text-white"
          aria-hidden
        >
          Q
        </span>
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ml-blue">
          {label}
        </span>
      </div>
      <div
        className={[
          "font-medium leading-relaxed text-ml-ink [overflow-wrap:anywhere]",
          isLead ? "text-[0.95rem]" : "text-[0.9rem]"
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

type QaAnswerBoxProps = {
  children: ReactNode;
  /** When true, show a clear “A / 回答” header (e.g. first answer under a lead question). */
  withHeader?: boolean;
  className?: string;
};

/**
 * Visually distinct “answer” area: neutral surface + green accent, pairs with {@link QaQuestion}.
 */
export function QaAnswerBox({ children, withHeader = false, className = "" }: QaAnswerBoxProps) {
  const { t } = useLocale();
  return (
    <div
      className={[
        "overflow-hidden rounded-ml border border-ml-hairline bg-ml-preview-bg/95 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.65)]",
        "border-l-[3px] border-l-ml-green/80",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {withHeader ? (
        <div className="bg-ml-card/60 px-4 py-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-ml-green text-[0.58rem] font-bold tabular-nums text-white"
              aria-hidden
            >
              A
            </span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ml-green">
              {t("qaLabelAnswer")}
            </span>
          </div>
        </div>
      ) : null}
      <div
        className={[
          "min-w-0 text-ml-ink",
          withHeader ? "px-4 py-3" : "px-3.5 py-2.5 sm:px-4 sm:py-3"
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
