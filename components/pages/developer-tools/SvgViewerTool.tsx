"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, textAreaClass, buttonClass, softButtonClass, inputClass, formatBytes } from "./shared";

const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#0ea5e9" stroke="#0f172a" stroke-width="3"/>
  <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function minifySvg(svg: string): string {
  return svg
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*\/>/g, "/>")
    .trim();
}

export function SvgViewerTool() {
  const [svg, setSvg] = useState(sampleSvg);
  const [scale, setScale] = useState(4);

  const minified = useMemo(() => minifySvg(svg), [svg]);
  const originalSize = useMemo(() => new Blob([svg]).size, [svg]);
  const minifiedSize = useMemo(() => new Blob([minified]).size, [minified]);
  const savings = useMemo(() => originalSize - minifiedSize, [originalSize, minifiedSize]);

  function downloadPng() {
    const canvas = document.createElement("canvas");
    const size = scale * 100;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = "svg-export.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="SVG Code">
          <textarea value={svg} onChange={(e) => setSvg(e.target.value)} className={`${textAreaClass} min-h-48`} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={downloadPng} className={buttonClass}>Export PNG ({scale}x)</button>
            <button type="button" onClick={() => setScale((s) => Math.max(1, s - 1))} className={softButtonClass}>-</button>
            <button type="button" onClick={() => setScale((s) => s + 1)} className={softButtonClass}>+</button>
          </div>
        </Card>
        <Card title="Preview">
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div dangerouslySetInnerHTML={{ __html: svg }} className="max-h-64" style={{ maxWidth: "100%" }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-xs text-slate-500">Original</p>
              <p className="text-sm font-semibold">{formatBytes(originalSize)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2">
              <p className="text-xs text-slate-500">Minified</p>
              <p className="text-sm font-semibold text-emerald-700">{formatBytes(minifiedSize)}</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2">
              <p className="text-xs text-slate-500">Saved</p>
              <p className="text-sm font-semibold text-sky-700">{formatBytes(savings)}</p>
            </div>
          </div>
        </Card>
      </div>
      <OutputBox value={minified} label="Minified SVG" />
    </div>
  );
}
