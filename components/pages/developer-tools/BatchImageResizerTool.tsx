"use client";

import { useMemo, useState } from "react";
import { Card, buttonClass, softButtonClass, inputClass, formatBytes } from "./shared";

type ImageFile = { file: File; url: string; width: number; height: number };

function loadImage(file: File): Promise<{ image: HTMLImageElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ image: img, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
    img.src = url;
  });
}

export function BatchImageResizerTool() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);

  async function handleFiles(input: FileList | null) {
    if (!input) return;
    const loaded: ImageFile[] = [];
    for (const file of Array.from(input)) {
      if (!file.type.startsWith("image/")) continue;
      const { width: w, height: h } = await loadImage(file);
      loaded.push({ file, url: URL.createObjectURL(file), width: w, height: h });
    }
    setFiles(loaded);
    if (loaded.length > 0 && maintainAspect) {
      setWidth(loaded[0].width);
      setHeight(loaded[0].height);
    }
  }

  function handleWidthChange(v: number) {
    setWidth(v);
    if (maintainAspect && files.length > 0) {
      const ratio = files[0].height / files[0].width;
      setHeight(Math.round(v * ratio));
    }
  }

  async function downloadAll() {
    setProcessing(true);
    const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const { image } = await loadImage(f.file);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(image, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), format, quality / 100));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName = f.file.name.replace(/\.[^.]+$/, "");
      a.download = `${baseName}-${width}x${height}.${ext}`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-4">
      <Card title="Batch Image Resizer">
        <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sky-300 hover:bg-sky-50">
          <span className="text-sm font-semibold text-slate-700">Select multiple images</span>
          <input type="file" accept="image/*" multiple onChange={(e) => void handleFiles(e.target.files)} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
        </label>
        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500">{files.length} image(s) loaded</span>
            {files.map((f, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{f.file.name.slice(0, 20)}</span>
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Width (px)</span>
            <input type="number" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Height (px)</span>
            <input type="number" value={height} onChange={(e) => { setHeight(Number(e.target.value)); if (maintainAspect && files.length > 0) { setWidth(Math.round(Number(e.target.value) / (files[0].height / files[0].width))); } }} className={`mt-1 ${inputClass}`} />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} className="accent-sky-600" />
          Maintain aspect ratio
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className={`mt-1 ${inputClass}`}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          <label className="block">
            <span className="flex justify-between text-sm font-semibold text-slate-700"><span>Quality</span><span>{quality}%</span></span>
            <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-1 w-full accent-sky-600" />
          </label>
        </div>
        <button type="button" onClick={() => void downloadAll()} disabled={files.length === 0 || processing} className={`mt-4 w-full ${buttonClass} disabled:opacity-50`}>
          {processing ? "Processing..." : `Download ${files.length} resized image(s)`}
        </button>
      </Card>
    </div>
  );
}
