"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AppState } from "@/domain/app-state";
import {
  collectTreeDisplayNodeIds,
  getMapTreeCanvasSize,
  getTreeMaxDepth,
  layoutTopicMapTree,
  MAP_TREE_CARD
} from "@/domain/map-tree-layout";
import { getRootNode } from "@/domain/topic-tree";
import type { LearningNode } from "@/domain/types";
import { useLocale } from "@/i18n/locale-context";
import { IconMapTreeNode } from "./Icons";

/** Softer grid like the design: light, airy. */
const treeBg =
  "bg-[radial-gradient(circle,_#d8e0ed_0.7px,transparent_0.7px),#f6f8fc] bg-[length:20px_20px]";

const w = MAP_TREE_CARD.w;
const h = MAP_TREE_CARD.h;
/** Shorten end segment so the arrow cap sits just above the node. */
const ARROW_TIP = 4;

const TREE_ARROW_MARKER = "ml-tree-arrow";

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
/** Ctrl/⌘ + wheel zoom; higher = more sensitive (was 0.0012). */
const WHEEL_ZOOM_SENSITIVITY = 0.005;

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

type Pt = { x: number; y: number };

function keyPt(p: Pt) {
  return `${Math.round(p.x * 4) / 4},${Math.round(p.y * 4) / 4}`;
}

function junctionDots(pxc: number, midY: number, childX: number[]) {
  const d: Pt[] = [{ x: pxc, y: midY }];
  for (const x of childX) {
    d.push({ x, y: midY });
  }
  return d;
}

/** `plain` = no marker; `arrow` = marker at path end (flows parent → child). */
function buildConnectorElements(
  parentId: string,
  childIds: string[],
  positions: Map<string, { left: number; top: number }>,
  cardW: number,
  cardH: number
): { plainPaths: string[]; arrowPaths: string[]; dots: Pt[] } {
  const P = positions.get(parentId);
  if (!P || childIds.length === 0) {
    return { plainPaths: [], arrowPaths: [], dots: [] };
  }

  const pxc = P.left + cardW / 2;
  const y1 = P.top + cardH;

  const cInfos = childIds
    .map((id) => {
      const c = positions.get(id);
      if (!c) return null;
      return { cxc: c.left + cardW / 2, cTop: c.top };
    })
    .filter(Boolean) as { cxc: number; cTop: number }[];

  if (cInfos.length === 0) {
    return { plainPaths: [], arrowPaths: [], dots: [] };
  }

  const y2 = cInfos[0]!.cTop;
  const yEnd = y2 - ARROW_TIP;
  const midY = y1 + (y2 - y1) * 0.45;
  const plainPaths: string[] = [];
  const arrowPaths: string[] = [];
  const dots: Pt[] = [];

  if (cInfos.length === 1) {
    const cxc = cInfos[0]!.cxc;
    if (Math.abs(pxc - cxc) < 0.5) {
      arrowPaths.push(`M ${pxc} ${y1} L ${pxc} ${yEnd}`);
    } else {
      plainPaths.push(`M ${pxc} ${y1} L ${pxc} ${midY} L ${cxc} ${midY}`);
      arrowPaths.push(`M ${cxc} ${midY} L ${cxc} ${yEnd}`);
      dots.push(...junctionDots(pxc, midY, [cxc]));
    }
  } else {
    const childX = cInfos.map((c) => c.cxc);
    const cMin = Math.min(...childX);
    const cMax = Math.max(...childX);
    const juncX = (cMin + cMax) / 2;
    // Trunk: parent → midY, then run along the bus to the symmetric T at the child row centre (not pxc, which
    // can be off when left/right subtrees have different widths).
    plainPaths.push(`M ${pxc} ${y1} L ${pxc} ${midY} L ${juncX} ${midY}`);
    plainPaths.push(`M ${cMin} ${midY} L ${cMax} ${midY}`);
    for (const c of cInfos) {
      arrowPaths.push(`M ${c.cxc} ${midY} L ${c.cxc} ${yEnd}`);
    }
    dots.push(...junctionDots(juncX, midY, childX));
  }

  return { plainPaths, arrowPaths, dots };
}

export function TopicNodeTreeView({
  state,
  mapRootId,
  q,
  selectedId,
  onSelect
}: {
  state: AppState;
  mapRootId: string;
  q: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLocale();
  const display = collectTreeDisplayNodeIds(state.nodes, mapRootId, "all", q);
  const root = getRootNode(state.nodes, mapRootId);
  const positions = root ? layoutTopicMapTree(state.nodes, mapRootId, display) : null;
  const maxDepth =
    root && display.has(root.id) ? getTreeMaxDepth(state.nodes, mapRootId, root.id, display) : 0;

  /** 100% = full panel width; tall maps scroll vertically so text stays readable. Adjust with − / +. */
  const [userZoom, setUserZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const mapScrollRef = useRef<HTMLDivElement | null>(null);

  const showTree = !!(root && positions && display.has(root.id));
  const { width, height } = showTree
    ? getMapTreeCanvasSize(positions!, maxDepth)
    : { width: 0, height: 0 };

  const effectiveScale = fitScale * userZoom;

  useEffect(() => {
    setUserZoom(1);
  }, [mapRootId]);

  useLayoutEffect(() => {
    if (width === 0) {
      return;
    }
    const el = mapScrollRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const ew = el.clientWidth;
      if (ew < 1 || el.clientHeight < 1) {
        return;
      }
      // Width-fit only: fitting height as well (min(ew,eh)) shrinks tall trees so much that
      // labels become unreadable; vertical (and wide maps horizontal) use native scroll.
      setFitScale(Math.min(ew / width, 1));
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    if (width === 0) {
      return;
    }
    const el = mapScrollRef.current;
    if (!el) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      setUserZoom((z) => clampZoom(z - e.deltaY * WHEEL_ZOOM_SENSITIVITY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [width, height, mapRootId, q]);

  if (!root || !positions || !display.has(root.id)) {
    return (
      <section
        className={`flex min-h-[200px] items-center justify-center p-6 ${treeBg}`}
        aria-label={t("treeTopic")}
      >
        <p className="m-0 text-[0.95rem] text-ml-muted">{t("treeNoMatch")}</p>
      </section>
    );
  }
  const nodeById = new Map(state.nodes.map((n) => [n.id, n] as const));

  const byParent = new Map<string, string[]>();
  for (const id of display) {
    const n = nodeById.get(id);
    if (!n?.parentNodeId) continue;
    if (display.has(n.parentNodeId)) {
      const pid = n.parentNodeId;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(id);
    }
  }
  for (const kids of byParent.values()) {
    kids.sort((a, b) => positions.get(a)!.left - positions.get(b)!.left);
  }

  const allPlain: string[] = [];
  const allArrow: string[] = [];
  const allDots: Pt[] = [];
  const seenDot = new Set<string>();
  for (const [pId, children] of byParent) {
    const { plainPaths, arrowPaths, dots } = buildConnectorElements(pId, children, positions, w, h);
    allPlain.push(...plainPaths);
    allArrow.push(...arrowPaths);
    for (const p of dots) {
      const k = keyPt(p);
      if (!seenDot.has(k)) {
        seenDot.add(k);
        allDots.push(p);
      }
    }
  }

  const wScaled = width * effectiveScale;
  const hScaled = height * effectiveScale;
  const zoomIn = () => setUserZoom((z) => clampZoom(z + ZOOM_STEP));
  const zoomOut = () => setUserZoom((z) => clampZoom(z - ZOOM_STEP));
  const zoomReset = () => setUserZoom(1);

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col border-0 ${treeBg}`}
      aria-label={t("treeTopic")}
    >
      <div
        className="flex flex-wrap items-center justify-end gap-1.5 bg-ml-card/60 px-5 py-2"
        role="toolbar"
        aria-label={t("treeZoom")}
      >

        <div className="inline-flex items-center gap-0.5 rounded-full border border-ml-line bg-ml-card p-0.5">
          <button
            type="button"
            className="flex h-7 min-w-7 items-center justify-center rounded-full text-[0.95rem] font-medium leading-none text-ml-ink hover:bg-ml-blue-soft disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("treeZoomOut")}
            disabled={userZoom <= ZOOM_MIN + 1e-6}
            onClick={zoomOut}
          >
            −
          </button>
          <span className="min-w-[2.8rem] select-none text-center text-[0.75rem] font-medium tabular-nums text-ml-ink">
            {Math.round(userZoom * 100)}%
          </span>
          <button
            type="button"
            className="flex h-7 min-w-7 items-center justify-center rounded-full text-[0.95rem] font-medium leading-none text-ml-ink hover:bg-ml-blue-soft disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("treeZoomIn")}
            disabled={userZoom >= ZOOM_MAX - 1e-6}
            onClick={zoomIn}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="rounded-ml-sm border border-ml-line bg-ml-card px-2.5 py-1 text-[0.75rem] font-medium text-ml-ink hover:bg-ml-blue-soft"
          onClick={zoomReset}
        >
          {t("treeReset")}
        </button>
      </div>
      <div
        ref={mapScrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-x-contain px-5 py-5 pb-8"
      >
        <div className="relative min-w-0" style={{ width: "100%", minHeight: hScaled }}>
          <div
            className="relative mx-auto"
            style={{ width: wScaled, height: hScaled, minWidth: wScaled }}
          >
            <div
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width,
                height,
                transform: `scale(${effectiveScale})`,
                transformOrigin: "0 0"
              }}
            >
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={width}
                height={height}
                aria-hidden
              >
                <defs>
                  <marker
                    id={TREE_ARROW_MARKER}
                    viewBox="0 0 10 10"
                    refX="9.2"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M 0 0.5 L 9.2 5 L 0 9.5 Z" fill="var(--color-ml-hero-line)" />
                  </marker>
                </defs>
                <g
                  fill="none"
                  stroke="var(--color-ml-hero-line)"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {allPlain.map((d, i) => (
                    <path key={`p-${i}`} d={d} vectorEffect="non-scaling-stroke" />
                  ))}
                </g>
                <g
                  fill="none"
                  stroke="var(--color-ml-hero-line)"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {allArrow.map((d, i) => (
                    <path
                      key={`a-${i}`}
                      d={d}
                      vectorEffect="non-scaling-stroke"
                      markerEnd={`url(#${TREE_ARROW_MARKER})`}
                    />
                  ))}
                </g>
                {allDots.map((p, i) => (
                  <circle
                    key={`d-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={2.75}
                    fill="var(--color-ml-card)"
                    stroke="var(--color-ml-hero-line)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              {Array.from(positions.entries()).map(([id, pos]) => {
                const n = nodeById.get(id);
                if (!n) return null;
                const master = n.status === "mastered";
                const statusIcon = master ? "bg-ml-green-soft text-ml-green" : "bg-ml-yellow-soft text-ml-yellow";
                const statusText = master ? "text-ml-green" : "text-ml-yellow";
                const statusDot = master ? "bg-ml-green" : "bg-ml-yellow";
                return (
                  <button
                    key={id}
                    type="button"
                    className={[
                      "group absolute flex cursor-pointer items-center gap-2.5 rounded-ml border px-2.5 py-2",
                      "bg-ml-card text-left",
                      "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_rgba(15,23,42,0.04)]",
                      "transition-[box-shadow,transform,border-color] duration-200",
                      "hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(15,23,42,0.07),0_10px_24px_rgba(15,23,42,0.06)]",
                      "hover:border-ml-hairline",
                      id === selectedId
                        ? "z-[2] border-2 border-ml-blue shadow-ml-node"
                        : "z-[1] border-ml-line"
                    ].join(" ")}
                    style={{
                      left: pos.left,
                      top: pos.top,
                      width: w,
                      minHeight: h
                    }}
                    onClick={() => onSelect(id)}
                  >
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md",
                        statusIcon
                      ].join(" ")}
                      aria-hidden
                    >
                      <IconMapTreeNode className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-0.5 pr-0.5">
                      <span className="line-clamp-2 text-[0.8rem] font-semibold leading-tight tracking-[-0.01em] text-ml-ink">
                        {n.title}
                      </span>
                      <span
                        className={["inline-flex items-center gap-1.5 text-[0.72rem] font-medium", statusText].join(" ")}
                      >
                        <span className={["h-1.5 w-1.5 shrink-0 rounded-full", statusDot].join(" ")} />
                        {master ? "Mastered" : "Unmastered"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PathTraceTreeView({
  state: _state,
  mapRootId: _mapRootId,
  path,
  activeNodeId
}: {
  state: AppState;
  mapRootId: string;
  path: LearningNode[];
  activeNodeId: string;
}) {
  const { t } = useLocale();
  if (path.length === 0) {
    return (
      <p className="m-0 text-center text-[0.88rem] text-ml-muted">{t("treeNoPath")}</p>
    );
  }

  return (
    <ol
      className="m-0 flex h-[360px] w-full list-none flex-col items-center overflow-y-auto rounded-ml-sm border border-ml-line bg-ml-preview-bg p-3"
      aria-label={t("treePath")}
    >
      {path.map((node, index) => {
        const isActive = node.id === activeNodeId;
        return (
          <li
            key={node.id}
            className="m-0 inline-flex list-none max-w-full flex-col items-center p-0"
          >
            <Link
              href={`/nodes/${node.id}`}
              className={[
                "block w-fit max-w-full rounded-ml-sm border px-3 py-2 text-center text-[0.88rem] font-semibold leading-snug no-underline",
                "transition-[border-color,background,color] duration-200",
                isActive
                  ? "border-ml-blue bg-ml-card text-ml-blue shadow-ml-focus"
                  : "border-ml-line bg-ml-card text-ml-ink hover:border-ml-hairline hover:text-ml-blue"
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
              title={node.title}
            >
              <span className="line-clamp-2 break-words">{node.title}</span>
            </Link>
            {index < path.length - 1 ? (
              <div className="flex h-6 items-center justify-center text-ml-muted" aria-hidden>
                <svg width="12" height="22" viewBox="0 0 12 22" fill="none">
                  <path
                    d="M6 2v15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2.75 14.5 6 17.75l3.25-3.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
