"use client";

import type { ToolId } from "./types";

export const toolDefinitions: { id: ToolId; label: string; shortcut: string }[] = [
  { id: "move", label: "Move", shortcut: "V" },
  { id: "brush", label: "Brush", shortcut: "B" },
  { id: "eraser", label: "Eraser", shortcut: "E" },
  { id: "bucket", label: "Bucket Fill", shortcut: "G" },
  { id: "eyedropper", label: "Eyedropper", shortcut: "I" },
  { id: "rectangle-select", label: "Rectangle Select", shortcut: "M" },
  { id: "lasso", label: "Lasso Select", shortcut: "L" },
  { id: "text", label: "Text", shortcut: "T" }
];

function ToolGlyph({ tool }: { tool: ToolId }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8
  };

  if (tool === "move") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M12 3v18" {...common} />
        <path d="m6 9 6-6 6 6" {...common} />
        <path d="m6 15 6 6 6-6" {...common} />
      </svg>
    );
  }

  if (tool === "brush") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M4 20h6M8 20c0-4 1-7 4-10l6-6 2 2-6 6c-3 3-6 4-6 8Z" {...common} />
        <path d="m16.5 6.5 2-2" {...common} />
      </svg>
    );
  }

  if (tool === "eraser") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="m4 15 5-5 8 8" {...common} />
        <path d="M12 12 9 9l5-5 5 5-4 4" {...common} />
        <path d="M6 21h14" {...common} />
      </svg>
    );
  }

  if (tool === "bucket") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M8 4l5 9-5 9-5-9Z" {...common} />
        <path d="M11 6 20 15l3-3-8-8" {...common} />
        <path d="M4 22h14" {...common} />
      </svg>
    );
  }

  if (tool === "eyedropper") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="m15.5 6.5 2 2-6 6-3 1 1-3Z" {...common} />
        <path d="m14 4 6 6 3-3-6-6Z" {...common} />
        <path d="M9 14 3 20" {...common} />
      </svg>
    );
  }

  if (tool === "rectangle-select") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="7 4" {...common} />
      </svg>
    );
  }

  if (tool === "lasso") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M4 7c0-2 3-3 8-3s8 1 8 3-3 3-8 3-8-1-8-3Z" {...common} />
        <path d="M4 7v8c0 1.7 2 3 5 3.5" {...common} />
        <circle cx="7" cy="19" r="1.2" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M6 3h3v2H6v5a3 3 0 1 1-2 2.8V3Z" {...common} />
      <path d="M8.5 21a5 5 0 0 0 5-5c0-4-3-7-8-7" {...common} />
      <path d="M8.5 21v-2" {...common} />
    </svg>
  );
}

export function ToolsRail({
  tool,
  onChange,
  disabled
}: {
  tool: ToolId;
  onChange: (tool: ToolId) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tools</p>
      <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
        {toolDefinitions.map((item) => {
          const isActive = item.id === tool;
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label} (${item.shortcut})`}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={`grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <ToolGlyph tool={item.id} />
            </button>
          );
        })}
      </div>
      <p className="mt-2 hidden text-[10px] leading-4 text-slate-400 lg:block">
        {toolDefinitions
          .map((item) => (item.id === tool ? `${item.shortcut} · ${item.label}` : item.shortcut))
          .join("  ")}
      </p>
    </div>
  );
}