"use client";

import type { ConceptGraph } from "@/domain/concept-network";

const labelDisplay: Record<string, string> = {
  related: "related",
  part_of: "part of",
  uses: "uses",
  used_by: "used by"
};

type Props = {
  graph: ConceptGraph;
  selectedId?: string | null;
  onSelectNode?: (id: string) => void;
  /** Smaller render for minimap */
  variant?: "default" | "minimap";
};

export function ConceptNetworkGraph({ graph, selectedId, onSelectNode, variant = "default" }: Props) {
  const W = variant === "minimap" ? 140 : 560;
  const H = variant === "minimap" ? 96 : 380;
  const n = graph.nodes.length;

  if (n === 0) {
    return (
      <p className="p-6 text-center text-ml-muted">
        No concepts yet. Ask questions from a node to add concepts.
      </p>
    );
  }

  const pos = new Map<string, { x: number; y: number }>();
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) * (variant === "minimap" ? 0.28 : 0.34);
  graph.nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    pos.set(node.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });

  const nodeW = variant === "minimap" ? 36 : 88;
  const nodeH = variant === "minimap" ? 22 : 34;
  const fs = variant === "minimap" ? 5 : 10;

  return (
    <svg
      className="h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={variant === "minimap" ? 96 : 380}
      role="img"
      aria-label="Concept network graph"
    >
      {graph.edges.map((e) => {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const t = labelDisplay[e.label] ?? e.label;
        return (
          <g key={e.id}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#b8c4d9"
              strokeWidth={1.5}
            />
            <text x={mx} y={my} className="fill-ml-muted" textAnchor="middle" fontSize={9}>
              {variant === "minimap" ? "" : t}
            </text>
          </g>
        );
      })}
      {graph.nodes.map((node) => {
        const p = pos.get(node.id);
        if (!p) return null;
        const isSel = selectedId === node.id;
        const short =
          node.label.length > (variant === "minimap" ? 6 : 14)
            ? `${node.label.slice(0, variant === "minimap" ? 5 : 12)}…`
            : node.label;
        return (
          <g
            key={node.id}
            transform={`translate(${p.x},${p.y})`}
            className={onSelectNode ? "cursor-pointer" : undefined}
            onClick={onSelectNode ? () => onSelectNode(node.id) : undefined}
            role={onSelectNode ? "button" : undefined}
            tabIndex={onSelectNode ? 0 : undefined}
            onKeyDown={
              onSelectNode
                ? (ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSelectNode(node.id);
                    }
                  }
                : undefined
            }
          >
            <rect
              x={-nodeW / 2}
              y={-nodeH / 2}
              width={nodeW}
              height={nodeH}
              rx={variant === "minimap" ? 4 : 8}
              fill="white"
              stroke={isSel ? "#0066ff" : "#e2e8f4"}
              strokeWidth={isSel ? 2.5 : 1.5}
              className={isSel ? "drop-shadow-[0_4px_12px_rgba(0,102,255,0.22)]" : ""}
            />
            <text
              y={variant === "minimap" ? 2 : 4}
              textAnchor="middle"
              className="pointer-events-none fill-ml-ink font-medium"
              fontSize={fs}
            >
              {short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
