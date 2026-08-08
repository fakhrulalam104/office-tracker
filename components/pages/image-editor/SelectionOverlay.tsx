"use client";

import type { Selection } from "./types";

type SelectionOverlayProps = {
  selection: Selection | null;
  width: number;
  height: number;
  zoom: number;
};

function pointString(points: { x: number; y: number }[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function SelectionOverlay({ selection, width, height, zoom }: SelectionOverlayProps) {
  if (!selection) return null;

  const strokeWidth = 1.5 / zoom;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      {selection.kind === "rect" && selection.rect ? (
        (() => {
          const { x0, y0, x1, y1 } = selection.rect;
          const left = Math.min(x0, x1);
          const top = Math.min(y0, y1);
          const w = Math.abs(x1 - x0);
          const h = Math.abs(y1 - y0);
          return (
            <rect
              x={left}
              y={top}
              width={w}
              height={h}
              fill="rgba(56,189,248,0.12)"
              stroke="rgba(2,132,199,0.95)"
              strokeWidth={strokeWidth}
              strokeDasharray="6 5"
              className="overflow-visible"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="22" dur="0.9s" repeatCount="indefinite" />
            </rect>
          );
        })()
      ) : selection.kind === "lasso" && selection.points ? (
        <polygon
          points={pointString(selection.points)}
          fill="rgba(56,189,248,0.12)"
          stroke="rgba(2,132,199,0.95)"
          strokeWidth={strokeWidth}
          strokeDasharray="6 5"
          strokeLinejoin="round"
          className="overflow-visible"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="22" dur="0.9s" repeatCount="indefinite" />
        </polygon>
      ) : null}
    </svg>
  );
}