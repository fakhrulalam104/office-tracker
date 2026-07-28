"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "./shared";

function hexToRgb(hex: string) {
  const n = hex.replace("#", "");
  if (n.length === 3) {
    return { r: parseInt(n[0] + n[0], 16), g: parseInt(n[1] + n[1], 16), b: parseInt(n[2] + n[2], 16) };
  }
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hslToHex(h: number, s: number, l: number) {
  const sN = s / 100, lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1: string, hex2: string) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b), l2 = luminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function randomColor() {
  return "#" + Array.from({ length: 6 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

type CopiedKey = string | null;

export function ColorPickerTool() {
  const [hex, setHex] = useState("#0ea5e9");
  const [inputValue, setInputValue] = useState("#0ea5e9");
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState<CopiedKey>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const satRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const isLight = luminance(rgb.r, rgb.g, rgb.b) > 0.4;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function doCopy(text: string, key: string) {
    copyText(text);
    setCopied(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(null), 1500);
  }

  function addToHistory(c: string) {
    setHistory((prev) => [c, ...prev.filter((h) => h !== c)].slice(0, 20));
  }

  function handleHexInput(val: string) {
    setInputValue(val);
    if (/^#[0-9a-f]{6}$/i.test(val)) {
      setHex(val);
      addToHistory(val);
    }
  }

  function handleHexBlur() {
    if (!/^#[0-9a-f]{6}$/i.test(inputValue)) {
      setInputValue(hex);
    }
  }

  function handleHueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newHex = hslToHex(Number(e.target.value), hsl.s, hsl.l);
    setHex(newHex);
    setInputValue(newHex);
  }

  function handleSatChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newHex = hslToHex(hsl.h, Number(e.target.value), hsl.l);
    setHex(newHex);
    setInputValue(newHex);
  }

  function handleLightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newHex = hslToHex(hsl.h, hsl.s, Number(e.target.value));
    setHex(newHex);
    setInputValue(newHex);
  }

  function handleRgbChange(channel: "r" | "g" | "b", val: string) {
    const num = Math.max(0, Math.min(255, Number(val) || 0));
    const n = hex.replace("#", "");
    const current = { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
    current[channel] = num;
    const newHex = `#${current.r.toString(16).padStart(2, "0")}${current.g.toString(16).padStart(2, "0")}${current.b.toString(16).padStart(2, "0")}`;
    setHex(newHex);
    setInputValue(newHex);
  }

  function generateTailwind() {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    return steps.map((step) => {
      const lightness = step <= 50 ? 97 : step <= 100 ? 93 : step <= 200 ? 86 : step <= 300 ? 76 : step <= 400 ? 64 : step <= 500 ? 50 : step <= 600 ? 40 : step <= 700 ? 32 : step <= 800 ? 24 : step <= 900 ? 16 : 10;
      const sat = hsl.s + (step <= 100 ? -10 : step >= 700 ? 10 : 0);
      return { step, hex: hslToHex(hsl.h, Math.max(0, Math.min(100, sat)), lightness) };
    });
  }

  const formats = [
    { label: "HEX", value: hex.toUpperCase(), key: "hex" },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, key: "rgb" },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, key: "hsl" },
    { label: "HSV", value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`, key: "hsv" },
    { label: "CSS", value: `--color: ${hex};`, key: "css" },
    { label: "Tailwind", value: `bg-[${hex}]`, key: "tailwind" },
    { label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`, key: "rgba" },
  ];

  const contrastWhite = contrastRatio(hex, "#ffffff").toFixed(2);
  const contrastBlack = contrastRatio(hex, "#000000").toFixed(2);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-lg" style={{ backgroundColor: hex }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-3xl font-bold tracking-tight text-slate-950 font-mono">{hex.toUpperCase()}</span>
                  <button type="button" onClick={() => doCopy(hex.toUpperCase(), "preview-hex")} className={`rounded-full px-2 py-1 text-xs font-semibold transition ${copied === "preview-hex" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {copied === "preview-hex" ? "Copied!" : "Copy"}
                  </button>
                  {typeof window !== "undefined" && "EyeDropper" in window && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // @ts-expect-error EyeDropper API
                          const dropper = new window.EyeDropper();
                          const res = await dropper.open();
                          if (res?.sRGBHex) {
                            setHex(res.sRGBHex);
                            setInputValue(res.sRGBHex);
                            addToHistory(res.sRGBHex);
                          }
                        } catch {
                          // Selection canceled
                        }
                      }}
                      className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-200"
                    >
                      EyeDropper 🎯
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {rgb.r}, {rgb.g}, {rgb.b} · {hsl.h}° {hsl.s}% {hsl.l}%
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hue</span>
                  <span className="text-xs font-mono text-slate-600">{hsl.h}°</span>
                </div>
                <input type="range" min={0} max={360} value={hsl.h} onChange={handleHueChange} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))` }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Saturation</span>
                  <span className="text-xs font-mono text-slate-600">{hsl.s}%</span>
                </div>
                <input type="range" min={0} max={100} value={hsl.s} onChange={handleSatChange} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))` }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lightness</span>
                  <span className="text-xs font-mono text-slate-600">{hsl.l}%</span>
                </div>
                <input type="range" min={0} max={100} value={hsl.l} onChange={handleLightChange} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))` }} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">RGB Channels</p>
            <div className="grid grid-cols-3 gap-3">
              {(["r", "g", "b"] as const).map((ch) => (
                <div key={ch}>
                  <label className="text-xs font-semibold text-slate-500 uppercase">{ch}</label>
                  <input type="number" min={0} max={255} value={rgb[ch]} onChange={(e) => handleRgbChange(ch, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-mono font-semibold text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Hex Input</p>
            <div className="flex gap-2">
              <input value={inputValue} onChange={(e) => handleHexInput(e.target.value)} onBlur={handleHexBlur} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono font-semibold text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" />
              <input type="color" value={hex} onChange={(e) => { setHex(e.target.value); setInputValue(e.target.value); addToHistory(e.target.value); }} className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border-0 p-0" />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Code Formats</p>
            <div className="space-y-1.5">
              {formats.map((f) => (
                <button key={f.key} type="button" onClick={() => doCopy(f.value, f.key)} className="group w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.label}</span>
                    <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-800">{f.value}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition ${copied === f.key ? "bg-emerald-100 text-emerald-700" : "text-slate-400 group-hover:text-sky-600"}`}>
                    {copied === f.key ? "Copied!" : "Copy"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contrast</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 text-center" style={{ backgroundColor: hex }}>
                <p className="text-lg font-bold" style={{ color: "#ffffff" }}>Aa</p>
                <p className="text-xs font-mono font-semibold" style={{ color: "#ffffff" }}>{contrastWhite}:1</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-lg font-bold text-black">Aa</p>
                <p className="text-xs font-mono font-semibold text-black">{contrastBlack}:1</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${Number(contrastWhite) >= 4.5 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                White {Number(contrastWhite) >= 4.5 ? "AA ✓" : "Fail ✕"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${Number(contrastBlack) >= 4.5 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                Black {Number(contrastBlack) >= 4.5 ? "AA ✓" : "Fail ✕"}
              </span>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tailwind Palette</p>
            <div className="flex gap-0.5">
              {generateTailwind().map((c) => (
                <button key={c.step} type="button" onClick={() => { setHex(c.hex); setInputValue(c.hex); addToHistory(c.hex); }} className="group relative h-8 flex-1 transition hover:scale-y-125 hover:z-10 hover:rounded-md" style={{ backgroundColor: c.hex }} title={`${c.step}: ${c.hex}`}>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 text-slate-600">{c.step}</span>
                </button>
              ))}
            </div>
          </section>

          {history.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((c, i) => (
                  <button key={i} type="button" onClick={() => { setHex(c); setInputValue(c); }} className="h-8 w-8 rounded-lg border border-slate-200 transition hover:scale-110 hover:shadow-md" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
