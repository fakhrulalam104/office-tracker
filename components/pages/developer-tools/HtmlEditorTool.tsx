"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClass, softButtonClass } from "./shared";

type DevicePreset = { label: string; width: number; height: number; icon: string };

const presets: DevicePreset[] = [
  { label: "Desktop", width: 100, height: 100, icon: "M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm5 12h6" },
  { label: "Laptop", width: 1024, height: 768, icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm-2 9h16" },
  { label: "Tablet", width: 768, height: 1024, icon: "M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H7zm5 17a1 1 0 100-2 1 1 0 000 2z" },
  { label: "Phone", width: 375, height: 812, icon: "M10 2a2 2 0 00-2 2v16a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2h-4zm2 17a1 1 0 100-2 1 1 0 000 2z" },
  { label: "Custom", width: 0, height: 0, icon: "" },
];

const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 2rem;
      color: #1e293b;
      background: #f8fafc;
    }
    h1 { color: #0f172a; }
    button {
      background: #0ea5e9;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #0284c7; }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>Edit this code and see the live preview.</p>
  <button onclick="alert('It works!')">Click Me</button>
</body>
</html>`;

export function HtmlEditorTool() {
  const [code, setCode] = useState(defaultHtml);
  const [activePreset, setActivePreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(50);
  const dragging = useRef(false);

  const currentPreset = presets[activePreset];
  const isCustom = activePreset === presets.length - 1;
  const previewWidth = isCustom ? customWidth : currentPreset.width;
  const previewHeight = isCustom ? customHeight : currentPreset.height;

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [code, updatePreview]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setFullscreen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function handleDragStart(e: React.MouseEvent) {
    dragging.current = true;
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(20, Math.min(80, pct)));
    };
    const onUp = () => { dragging.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function formatSize(w: number, h: number) {
    if (isCustom) return w + " x " + h + "px";
    return w + " x " + h;
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-950">Full Screen Preview</span>
            <span className="text-xs text-slate-500">{formatSize(previewWidth, previewHeight)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={updatePreview} className={softButtonClass}>Refresh</button>
            <button type="button" onClick={() => setFullscreen(false)} className={buttonClass}>Exit full screen</button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-4 overflow-auto">
          <iframe ref={iframeRef} title="Preview" className="bg-white shadow-lg border border-slate-200" style={{ width: previewWidth, height: previewHeight, maxWidth: "100%", maxHeight: "100%" }} sandbox="allow-scripts allow-same-origin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setActivePreset(i)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activePreset === i ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {p.label}
              </button>
            ))}
            {isCustom && (
              <div className="flex items-center gap-1 ml-2">
                <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-sky-300" />
                <span className="text-xs text-slate-400">x</span>
                <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-sky-300" />
                <span className="text-xs text-slate-400">px</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{formatSize(previewWidth, previewHeight)}</span>
            <button type="button" onClick={updatePreview} className={softButtonClass}>Refresh</button>
            <button type="button" onClick={() => setFullscreen(true)} className={buttonClass}>Full screen</button>
          </div>
        </div>

        <div ref={containerRef} className="flex" style={{ height: "600px" }}>
          <div className="flex flex-col border-r border-slate-200" style={{ width: splitPos + "%", minWidth: 0 }}>
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">HTML</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full resize-none bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
              spellCheck={false}
            />
          </div>

          <div
            className="w-1.5 cursor-col-resize bg-slate-200 hover:bg-sky-400 transition-colors shrink-0"
            onMouseDown={handleDragStart}
          />

          <div className="flex flex-col" style={{ width: (100 - splitPos) + "%", minWidth: 0 }}>
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Preview</span>
            </div>
            <div className="flex-1 flex items-start justify-center bg-slate-100 p-4 overflow-auto">
              <iframe
                ref={iframeRef}
                title="Preview"
                className="bg-white shadow-lg border border-slate-200 transition-all duration-300"
                style={{ width: previewWidth, height: previewHeight, maxWidth: "100%" }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
