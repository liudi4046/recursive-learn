"use client";

import Link from "next/link";
import { use } from "react";
import { LearningMapPage } from "@/components/LearningMapPage";
import { getRootNode } from "@/domain/topic-tree";
import { useLocale } from "@/i18n/locale-context";
import { useAppState } from "@/state/app-state-context";

export default function MapRoutePage({ params }: { params: Promise<{ mapRootId: string }> }) {
  const { mapRootId } = use(params);
  const { t } = useLocale();
  const { rehydrated, state, setState } = useAppState();

  if (!rehydrated) {
    return null;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-[1320px] px-10 py-12">
        <p>
          {t("searchNoSession")}{" "}
          <Link href="/">{t("searchStartHome")}</Link>.
        </p>
      </main>
    );
  }
  if (!getRootNode(state.nodes, mapRootId)) {
    return (
      <main className="mx-auto max-w-[900px] px-10 py-12">
        <p>{t("mapRouteMissingRoot")}</p>
        <p className="mt-2 text-ml-muted">
          <Link className="font-medium text-ml-blue" href="/maps">
            {t("mapRouteBackSessions")}
          </Link>{" "}
          {t("mapRouteOr")} <Link href="/">{t("mapRouteHome")}</Link>.
        </p>
      </main>
    );
  }

  return (
    <LearningMapPage
      key={mapRootId}
      state={state}
      onStateChange={setState}
      mapRootId={mapRootId}
    />
  );
}
