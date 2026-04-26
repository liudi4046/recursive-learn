"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppState } from "@/state/app-state-context";
import {
  IconAccount,
  IconChevronDown,
  IconKnowledgeBase,
  IconLearningMap,
  IconSearch,
  IconSettings,
  LogoMark
} from "./Icons";

const navLink = (active: boolean) =>
  [
    "inline-flex items-center gap-2 border-b-2 border-transparent px-3.5 pb-3 -mb-px text-[0.92rem] font-medium text-ml-ink no-underline",
    "hover:text-ml-blue [&_svg]:opacity-85",
    active ? "border-ml-blue text-ml-blue [&_svg]:text-ml-blue" : ""
  ]
    .filter(Boolean)
    .join(" ");

export function SiteHeader() {
  const { state } = useAppState();
  const [path, setPath] = useState("");

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

  const mapHref = state ? `/maps/${state.activeTopicId}` : "/";

  const learningMapActive =
    path.startsWith("/maps") || path.startsWith("/nodes") || (path === "/" && Boolean(state));
  const knowledgeActive = path.startsWith("/knowledge-base") || path.startsWith("/concepts");
  const searchActive = path.startsWith("/search");
  const settingsActive = path.startsWith("/settings");

  return (
    <header className="flex items-center justify-between gap-6 border-b border-ml-line bg-ml-card px-10 py-3.5">
      <Link href="/" className="inline-flex items-center gap-2.5 no-underline text-ml-ink">
        <LogoMark className="shrink-0 text-ml-blue" />
        <span className="text-[1.05rem] font-bold tracking-tight">MapLearn</span>
      </Link>
      <nav className="flex flex-1 items-center justify-center gap-2" aria-label="Primary">
        <Link href={mapHref} className={navLink(learningMapActive)}>
          <IconLearningMap />
          <span>Learning Map</span>
        </Link>
        <Link href="/knowledge-base" className={navLink(knowledgeActive)}>
          <IconKnowledgeBase />
          <span>Knowledge Base</span>
        </Link>
        <Link href="/search" className={navLink(searchActive)}>
          <IconSearch />
          <span>Search</span>
        </Link>
        <Link href="/settings" className={navLink(settingsActive)}>
          <IconSettings />
          <span>Settings</span>
        </Link>
      </nav>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ml-line bg-ml-card px-3 py-2 text-[0.9rem] text-ml-ink"
        aria-label="Account menu"
      >
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-ml-blue-soft text-ml-blue" aria-hidden>
          <IconAccount />
        </span>
        <span>Account</span>
        <IconChevronDown />
      </button>
    </header>
  );
}
