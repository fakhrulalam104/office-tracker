"use client";

import { useMemo, useState } from "react";
import { Card, inputClass, copyText, buttonClass } from "./shared";
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100, lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "split" | "monochromatic";

function generateHarmony(hex: string, type: HarmonyType): string[] {
  const { h, s, l } = hexToHsl(hex);
  switch (type) {
    case "complementary":
      return [hex, hslToHex((h + 180) % 360, s, l)];
    case "analogous":
      return [hslToHex((h + 330) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)];
    case "triadic":
      return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
    case "split":
      return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
    case "monochromatic":
      return [hslToHex(h, s, Math.max(10, l - 30)), hslToHex(h, s, Math.max(10, l - 15)), hex, hslToHex(h, s, Math.min(90, l + 15)), hslToHex(h, s, Math.min(90, l + 30))];
  }
}

const harmonyTypes: { key: HarmonyType; label: string }[] = [
  { key: "complementary", label: "Complementary" },
  { key: "analogous", label: "Analogous" },
  { key: "triadic", label: "Triadic" },
  { key: "split", label: "Split" },
  { key: "monochromatic", label: "Monochromatic" }
];

export function ColorPaletteGeneratorTool() {
  const [seed, setSeed] = useState("#0ea5e9");
  const [harmony, setHarmony] = useState<HarmonyType>("analogous");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const palette = useMemo(() => generateHarmony(seed, harmony), [seed, harmony]);

  return (
    <div className="space-y-4">
      <Card title="Seed Color">
        <div className="flex items-center gap-3">
          <input type="color" value={seed} onChange={(e) => setSeed(e.target.value)} className="h-12 w-24 rounded-xl border border-slate-200 bg-white p-1" />
          <input value={seed} onChange={(e) => setSeed(e.target.value)} className={`flex-1 ${inputClass}`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {harmonyTypes.map((h) => (
            <button key={h.key} type="button" onClick={() => setHarmony(h.key)} className={harmony === h.key ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"}>
              {h.label}
            </button>
          ))}
        </div>
      </Card>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Generated Palette</h2>
        <div className="mt-4 flex overflow-hidden rounded-2xl border border-slate-200">
          {palette.map((color, i) => (
            <button key={i} type="button" onClick={() => { copyText(color); setCopiedIndex(i); window.setTimeout(() => setCopiedIndex(null), 1600); }} className="group relative flex-1 transition hover:flex-[2]" style={{ backgroundColor: color, minHeight: 120 }}>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold opacity-0 shadow transition group-hover:opacity-100">{copiedIndex === i ? "✓ Copied" : color}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {palette.map((color, i) => (
            <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-semibold text-slate-700">{color}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Click any swatch to copy its hex code. Generated palette is saved in your clipboard.</p>
      </section>
      <Card title="CSS Variables">
        <pre className="overflow-auto rounded-2xl bg-slate-50 p-4 font-mono text-sm text-slate-800">
{`:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`}
        </pre>
      </Card>
    </div>
  );
}
