"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n/locale-context";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useLocale();
  const resolvedCancel = cancelLabel ?? t("dialogCancel");
  const resolvedConfirm = confirmLabel ?? t("dialogDelete");
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ml-ink/45 backdrop-blur-[3px] transition-opacity"
        aria-label={t("dialogClose")}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={[
          "relative z-[1] w-full max-w-[400px] rounded-ml border border-ml-line bg-ml-card",
          "p-6 shadow-[0_24px_48px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]"
        ].join(" ")}
      >
        <h2 id={titleId} className="m-0 text-[1.1rem] font-semibold leading-snug tracking-tight text-ml-ink">
          {title}
        </h2>
        <p id={descId} className="mb-0 mt-3 text-[0.92rem] leading-relaxed text-ml-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={[
              "cursor-pointer rounded-ml-sm border border-ml-line bg-ml-card px-4 py-2.5",
              "text-[0.88rem] font-semibold text-ml-ink shadow-ml-card",
              "transition-[background,border-color] hover:bg-ml-preview-bg"
            ].join(" ")}
            onClick={onCancel}
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            className={[
              "cursor-pointer rounded-ml-sm border border-transparent bg-ml-error px-4 py-2.5",
              "text-[0.88rem] font-semibold text-white shadow-ml-card",
              "transition-[background,filter] hover:brightness-110 active:brightness-95"
            ].join(" ")}
            onClick={onConfirm}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
