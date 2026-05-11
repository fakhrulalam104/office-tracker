"use client";

import ImageTracer from "imagetracerjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type TraceMode = {
  label: string;
  maxSize: number;
  colors: number;
  lineError: number;
  curveError: number;
  pathOmit: number;
  blurRadius: number;
  blurDelta: number;
};

type VectorStats = {
  width: number;
  height: number;
  colors: number;
  paths: number;
};

type TracedData = {
  width: number;
  height: number;
  palette: Array<{ r: number; g: number; b: number; a: number }>;
  layers: Array<Array<unknown>>;
};

const traceModes: TraceMode[] = [
  { label: "Ultra", maxSize: 1600, colors: 128, lineError: 0.22, curveError: 0.22, pathOmit: 1, blurRadius: 0, blurDelta: 18 },
  { label: "High", maxSize: 1200, colors: 96, lineError: 0.35, curveError: 0.35, pathOmit: 2, blurRadius: 0, blurDelta: 20 },
  { label: "Balanced", maxSize: 900, colors: 64, lineError: 0.55, curveError: 0.55, pathOmit: 4, blurRadius: 1, blurDelta: 20 },
  { label: "Clean", maxSize: 760, colors: 32, lineError: 0.8, curveError: 0.8, pathOmit: 8, blurRadius: 1, blurDelta: 28 }
];

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "vectorized-image";
}

function fileToImage(file: File) {
  const url = URL.createObjectURL(file);

  return new Promise<{ image: HTMLImageElement; revoke: () => void }>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load that image."));
    };
    image.src = url;
  });
}

function countPaths(layers: TracedData["layers"]) {
  return layers.reduce((total, layer) => total + layer.length, 0);
}

function addSvgTitle(svg: string, title: string) {
  return svg.replace(/<svg([^>]*)>/, `<svg$1 role="img">\n<title>${title.replace(/[<>&"]/g, "")}</title>`);
}

export function ImageVectorizerPageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [svgText, setSvgText] = useState("");
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [modeIndex, setModeIndex] = useState(1);
  const [colorLayers, setColorLayers] = useState(traceModes[1].colors);
  const [traceFullSize, setTraceFullSize] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedMode = traceModes[modeIndex];
  const downloadName = useMemo(() => `${file ? getBaseName(file.name) : "vectorized-image"}.svg`, [file]);

  useEffect(() => {
    return () => {
      if (originalUrl) {
        URL.revokeObjectURL(originalUrl);
      }
      if (svgUrl) {
        URL.revokeObjectURL(svgUrl);
      }
    };
  }, [originalUrl, svgUrl]);

  function resetVector() {
    setSvgText("");
    setStats(null);
    if (svgUrl) {
      URL.revokeObjectURL(svgUrl);
      setSvgUrl(null);
    }
  }

  function updateMode(nextIndex: number) {
    const nextMode = traceModes[nextIndex] ?? traceModes[1];
    setModeIndex(nextIndex);
    setColorLayers(nextMode.colors);
    resetVector();
  }

  async function handleFile(nextFile: File | null) {
    setError(null);
    resetVector();

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
      setOriginalUrl(null);
    }

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setError("Choose an image file.");
      setFile(null);
      return;
    }

    setFile(nextFile);
    setOriginalUrl(URL.createObjectURL(nextFile));
  }

  async function vectorize() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setVectorizing(true);
    setError(null);
    resetVector();

    let revokeImage: (() => void) | null = null;

    try {
      const loaded = await fileToImage(file);
      revokeImage = loaded.revoke;
      const sourceWidth = loaded.image.naturalWidth;
      const sourceHeight = loaded.image.naturalHeight;
      const traceMax = traceFullSize ? Math.max(sourceWidth, sourceHeight) : selectedMode.maxSize;
      const scaleDown = Math.min(1, traceMax / Math.max(sourceWidth, sourceHeight));
      const traceWidth = Math.max(1, Math.round(sourceWidth * scaleDown));
      const traceHeight = Math.max(1, Math.round(sourceHeight * scaleDown));
      const outputScale = sourceWidth / traceWidth;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = traceWidth;
      canvas.height = traceHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Canvas is not available in this browser.");
      }

      context.clearRect(0, 0, traceWidth, traceHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(loaded.image, 0, 0, traceWidth, traceHeight);

      const imageData = context.getImageData(0, 0, traceWidth, traceHeight);
      const options = {
        ltres: selectedMode.lineError,
        qtres: selectedMode.curveError,
        pathomit: selectedMode.pathOmit,
        rightangleenhance: true,
        colorsampling: 2,
        numberofcolors: colorLayers,
        mincolorratio: 0.00005,
        colorquantcycles: 4,
        layering: 0,
        strokewidth: 0,
        linefilter: true,
        scale: outputScale,
        roundcoords: 2,
        viewbox: true,
        desc: false,
        blurradius: selectedMode.blurRadius,
        blurdelta: selectedMode.blurDelta
      };
      const tracedData = ImageTracer.imagedataToTracedata(imageData, options) as TracedData;
      const rawSvg = ImageTracer.getsvgstring(tracedData, options);
      const titledSvg = addSvgTitle(rawSvg, `${getBaseName(file.name)} vectorized`);
      const blob = new Blob([titledSvg], { type: "image/svg+xml" });
      const nextUrl = URL.createObjectURL(blob);

      setSvgText(titledSvg);
      setSvgUrl(nextUrl);
      setStats({
        width: Math.round(tracedData.width * outputScale),
        height: Math.round(tracedData.height * outputScale),
        colors: tracedData.layers.filter((layer) => layer.length > 0).length,
        paths: countPaths(tracedData.layers)
      });
    } catch (vectorError) {
      setError(vectorError instanceof Error ? vectorError.message : "Could not vectorize image.");
    } finally {
      revokeImage?.();
      setVectorizing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            Back to features
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">Local SVG tracing</span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Image Vectorizer</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Vectorize Images</h1>
              </div>

              <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sky-300 hover:bg-sky-50">
                <span className="text-sm font-semibold text-slate-700">Source image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                  className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>

              <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Trace quality</span>
                  <select
                    value={modeIndex}
                    onChange={(event) => updateMode(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {traceModes.map((item, index) => (
                      <option key={item.label} value={index}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                    <span>Color layers</span>
                    <span>{colorLayers}</span>
                  </span>
                  <input
                    type="range"
                    min="8"
                    max="160"
                    step="4"
                    value={colorLayers}
                    onChange={(event) => {
                      setColorLayers(Number(event.target.value));
                      resetVector();
                    }}
                    className="mt-3 w-full accent-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Trace full resolution</span>
                  <input
                    type="checkbox"
                    checked={traceFullSize}
                    onChange={(event) => {
                      setTraceFullSize(event.target.checked);
                      resetVector();
                    }}
                    className="h-5 w-5 accent-sky-600"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Original</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{file ? formatBytes(file.size) : "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">SVG</p>
                    <p className="mt-1 text-lg font-semibold text-sky-950">{svgText ? formatBytes(new Blob([svgText]).size) : "-"}</p>
                  </div>
                </div>

                {stats ? (
                  <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                    <span>
                      {stats.width} x {stats.height}px
                    </span>
                    <span>
                      {stats.colors} color layers, {stats.paths} traced paths
                    </span>
                  </div>
                ) : null}

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                <button
                  type="button"
                  onClick={() => void vectorize()}
                  disabled={!file || vectorizing}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {vectorizing ? "Vectorizing..." : "Vectorize image"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">SVG Preview</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">Smooth traced paths with only the active color layers needed for the image.</p>
                </div>
                <div className="text-xs font-semibold text-slate-500">{selectedMode.label}</div>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white shadow-inner">
                {svgUrl ? (
                  <img src={svgUrl} alt="Vectorized SVG preview" className="absolute inset-0 h-full w-full object-contain" />
                ) : originalUrl ? (
                  <img src={originalUrl} alt="Original preview" className="absolute inset-0 h-full w-full object-contain opacity-80" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">Select an image</span>
                )}
              </div>

              {svgUrl ? (
                <a
                  href={svgUrl}
                  download={downloadName}
                  className="mt-4 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Download {downloadName}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
