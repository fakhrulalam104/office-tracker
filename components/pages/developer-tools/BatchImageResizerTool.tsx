"use client";

import { useEffect, useRef, useState } from "react";
import { Card, buttonClass, softButtonClass, inputClass, createZipBlob } from "./shared";

type ImageFile = { file: File; url: string; width: number; height: number };
type ResizeMode = "dimensions" | "percentage" | "fit";

function loadImage(file: File): Promise<{ image: HTMLImageElement; width: number; height: number; revoke: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ image: img, width: img.naturalWidth, height: img.naturalHeight, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not load image: ${file.name}`));
    };
    img.src = url;
  });
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "resized-image";
}

export function BatchImageResizerTool() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("dimensions");
  const [percentage, setPercentage] = useState(50);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maxFit, setMaxFit] = useState(1200);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filesRef = useRef<ImageFile[]>([]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      for (const f of filesRef.current) {
        if (f.url) URL.revokeObjectURL(f.url);
      }
    };
  }, []);

  async function handleFiles(input: FileList | null) {
    if (!input || input.length === 0) return;
    setError(null);

    // Revoke previous URLs
    for (const f of filesRef.current) {
      if (f.url) URL.revokeObjectURL(f.url);
    }

    const loaded: ImageFile[] = [];
    for (const file of Array.from(input)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const { width: w, height: h, revoke } = await loadImage(file);
        revoke();
        loaded.push({ file, url: URL.createObjectURL(file), width: w, height: h });
      } catch (err) {
        console.error(err);
      }
    }

    if (loaded.length === 0) {
      setError("No valid image files loaded.");
      setFiles([]);
      return;
    }

    setFiles(loaded);
    if (loaded.length > 0 && maintainAspect) {
      setWidth(loaded[0].width);
      setHeight(loaded[0].height);
    }
  }

  function handleWidthChange(v: number) {
    setWidth(v);
    if (maintainAspect && files.length > 0 && files[0].width > 0) {
      const ratio = files[0].height / files[0].width;
      setHeight(Math.round(v * ratio));
    }
  }

  async function processResizedFiles() {
    const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
    const resizedBlobs: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const { image, revoke } = await loadImage(f.file);

      let targetWidth = width;
      let targetHeight = height;

      if (resizeMode === "percentage") {
        targetWidth = Math.max(1, Math.round((f.width * percentage) / 100));
        targetHeight = Math.max(1, Math.round((f.height * percentage) / 100));
      } else if (resizeMode === "fit") {
        const maxDim = Math.max(f.width, f.height);
        if (maxDim > maxFit) {
          const scale = maxFit / maxDim;
          targetWidth = Math.max(1, Math.round(f.width * scale));
          targetHeight = Math.max(1, Math.round(f.height * scale));
        } else {
          targetWidth = f.width;
          targetHeight = f.height;
        }
      } else if (maintainAspect && files.length > 1) {
        // Individual aspect ratio preservation per file
        const scale = width / f.width;
        targetWidth = width;
        targetHeight = Math.max(1, Math.round(f.height * scale));
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else {
          ctx.clearRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      }

      revoke();

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), format, quality / 100));
      const baseName = getBaseName(f.file.name);
      resizedBlobs.push({
        name: `${baseName}-${targetWidth}x${targetHeight}.${ext}`,
        blob
      });
    }

    return resizedBlobs;
  }

  async function downloadZip() {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const blobs = await processResizedFiles();
      const zipBlob = await createZipBlob(blobs);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized-images-${format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError("Failed to create ZIP package.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Batch Image Resizer">
        <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sky-300 hover:bg-sky-50">
          <span className="text-sm font-semibold text-slate-700">Select multiple images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => void handleFiles(e.target.files)}
            className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </label>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500">{files.length} image(s) loaded</span>
            {files.map((f, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {f.file.name.slice(0, 25)} ({f.width}x{f.height}px)
              </span>
            ))}
          </div>
        )}

        {error ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Resize Mode</span>
            <select
              value={resizeMode}
              onChange={(e) => setResizeMode(e.target.value as ResizeMode)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="dimensions">Custom Width / Height</option>
              <option value="percentage">Scale by Percentage (%)</option>
              <option value="fit">Fit within Bounding Box (Max Dimension)</option>
            </select>
          </label>

          {resizeMode === "dimensions" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Width (px)</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Height (px)</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(Number(e.target.value));
                    if (maintainAspect && files.length > 0 && files[0].height > 0) {
                      setWidth(Math.round(Number(e.target.value) / (files[0].height / files[0].width)));
                    }
                  }}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            </div>
          )}

          {resizeMode === "percentage" && (
            <label className="block">
              <span className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Scale Factor</span>
                <span>{percentage}%</span>
              </span>
              <input
                type="range"
                min={10}
                max={200}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="mt-2 w-full accent-sky-600"
              />
            </label>
          )}

          {resizeMode === "fit" && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Max Dimension Limit (px)</span>
              <input
                type="number"
                value={maxFit}
                onChange={(e) => setMaxFit(Number(e.target.value))}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          )}
        </div>

        {resizeMode === "dimensions" && (
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={maintainAspect}
              onChange={(e) => setMaintainAspect(e.target.checked)}
              className="accent-sky-600"
            />
            Maintain aspect ratio per image
          </label>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          <label className="block">
            <span className="flex justify-between text-sm font-semibold text-slate-700">
              <span>Quality</span>
              <span>{quality}%</span>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-1 w-full accent-sky-600"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void downloadZip()}
          disabled={files.length === 0 || processing}
          className={`mt-4 w-full ${buttonClass} disabled:opacity-50`}
        >
          {processing ? "Processing ZIP..." : `Download ${files.length} resized image(s) (.zip)`}
        </button>
      </Card>
    </div>
  );
}

