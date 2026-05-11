"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type RemovalConfig = {
  model: "isnet" | "isnet_fp16" | "isnet_quint8";
  output: {
    format: "image/png";
    quality: number;
  };
  progress?: (key: string, current: number, total: number) => void;
};

type RemovalMode = {
  label: string;
  helper: string;
  model: RemovalConfig["model"];
  cleanup: number;
};

const removalModes: RemovalMode[] = [
  {
    label: "Ultra clean",
    helper: "Best edges for people, products, and complex foregrounds.",
    model: "isnet",
    cleanup: 8
  },
  {
    label: "Balanced",
    helper: "Strong quality with faster processing.",
    model: "isnet_fp16",
    cleanup: 6
  },
  {
    label: "Fast draft",
    helper: "Quick cutouts for previews and simple images.",
    model: "isnet_quint8",
    cleanup: 4
  }
];

const previewBackgrounds = [
  { label: "Grid", value: "grid" },
  { label: "White", value: "white" },
  { label: "Dark", value: "dark" },
  { label: "Sky", value: "sky" }
] as const;

type PreviewBackground = (typeof previewBackgrounds)[number]["value"];
type BackgroundRemovalModule = {
  removeBackground: (image: File | Blob, configuration?: RemovalConfig) => Promise<Blob>;
};

const backgroundRemovalModuleUrl = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

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
  return fileName.replace(/\.[^.]+$/, "") || "background-removed";
}

function fileToImage(file: Blob) {
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

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export the transparent PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

async function cleanTransparentEdges(sourceBlob: Blob, strength: number) {
  if (strength <= 0) {
    return sourceBlob;
  }

  const loaded = await fileToImage(sourceBlob);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = loaded.image.naturalWidth;
    canvas.height = loaded.image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas is not available in this browser.");
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(loaded.image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const hardTransparent = Math.max(1, Math.min(24, strength * 2));
    const hardOpaque = Math.max(224, 256 - strength * 3);

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3];

      if (alpha <= hardTransparent) {
        pixels[index + 3] = 0;
      } else if (alpha >= hardOpaque) {
        pixels[index + 3] = 255;
      }
    }

    const width = canvas.width;
    const height = canvas.height;
    const copy = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = copy[offset + 3];

        if (alpha <= 0 || alpha >= 255) {
          continue;
        }

        let red = 0;
        let green = 0;
        let blue = 0;
        let samples = 0;

        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) {
              continue;
            }

            const nx = x + ox;
            const ny = y + oy;

            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              continue;
            }

            const neighborOffset = (ny * width + nx) * 4;
            const neighborAlpha = copy[neighborOffset + 3];

            if (neighborAlpha < 220) {
              continue;
            }

            red += copy[neighborOffset];
            green += copy[neighborOffset + 1];
            blue += copy[neighborOffset + 2];
            samples += 1;
          }
        }

        if (samples > 0) {
          pixels[offset] = Math.round(red / samples);
          pixels[offset + 1] = Math.round(green / samples);
          pixels[offset + 2] = Math.round(blue / samples);
        }
      }
    }

    context.putImageData(imageData, 0, 0);
    return await canvasToPngBlob(canvas);
  } finally {
    loaded.revoke();
  }
}

export function ImageBackgroundRemoverPageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [modeIndex, setModeIndex] = useState(0);
  const [edgeCleanup, setEdgeCleanup] = useState(removalModes[0].cleanup);
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>("grid");
  const [progressLabel, setProgressLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const selectedMode = removalModes[modeIndex] ?? removalModes[0];
  const downloadName = useMemo(() => `${file ? getBaseName(file.name) : "background-removed"}-transparent.png`, [file]);

  useEffect(() => {
    return () => {
      if (originalUrl) {
        URL.revokeObjectURL(originalUrl);
      }
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [originalUrl, resultUrl]);

  function resetResult() {
    setResultBlob(null);
    setProgress(0);
    setProgressLabel("");

    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  }

  async function handleFile(nextFile: File | null) {
    setError(null);
    resetResult();

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
      setOriginalUrl(null);
    }

    if (!nextFile) {
      setFile(null);
      setDimensions(null);
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setError("Choose an image file.");
      setFile(null);
      setDimensions(null);
      return;
    }

    setFile(nextFile);
    const nextUrl = URL.createObjectURL(nextFile);
    setOriginalUrl(nextUrl);

    try {
      const loaded = await fileToImage(nextFile);
      setDimensions({ width: loaded.image.naturalWidth, height: loaded.image.naturalHeight });
      loaded.revoke();
    } catch {
      setDimensions(null);
    }
  }

  async function removeBackground() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    abortRef.current = false;
    setProcessing(true);
    setError(null);
    resetResult();
    setProgressLabel("Loading AI model");
    setProgress(4);

    try {
      const mod = (await import(/* webpackIgnore: true */ backgroundRemovalModuleUrl)) as BackgroundRemovalModule;
      const config: RemovalConfig = {
        model: selectedMode.model,
        output: {
          format: "image/png",
          quality: 1
        },
        progress: (key, current, total) => {
          if (abortRef.current) {
            return;
          }

          const ratio = total > 0 ? current / total : 0;
          setProgress(Math.max(4, Math.min(82, Math.round(ratio * 82))));
          setProgressLabel(key.includes("model") || key.includes("onnx") ? "Downloading segmentation model" : "Preparing removal engine");
        }
      };
      const cutoutBlob = await mod.removeBackground(file, config);

      if (abortRef.current) {
        return;
      }

      setProgressLabel("Cleaning transparent edges");
      setProgress(90);
      const cleanedBlob = await cleanTransparentEdges(cutoutBlob, edgeCleanup);

      if (abortRef.current) {
        return;
      }

      const nextUrl = URL.createObjectURL(cleanedBlob);
      setResultBlob(cleanedBlob);
      setResultUrl(nextUrl);
      setProgress(100);
      setProgressLabel("Transparent PNG ready");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove the background.");
      setProgress(0);
      setProgressLabel("");
    } finally {
      setProcessing(false);
    }
  }

  function cancelProcessing() {
    abortRef.current = true;
    setProcessing(false);
    setProgressLabel("Canceled");
  }

  const previewClass =
    previewBackground === "grid"
      ? "bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] bg-white"
      : previewBackground === "dark"
        ? "bg-slate-950"
        : previewBackground === "sky"
          ? "bg-sky-100"
          : "bg-white";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            Back to features
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">Local transparent PNG</span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Image Background Remover</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Remove Backgrounds</h1>
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
                  <span className="text-sm font-semibold text-slate-700">Removal quality</span>
                  <select
                    value={modeIndex}
                    onChange={(event) => {
                      const nextIndex = Number(event.target.value);
                      setModeIndex(nextIndex);
                      setEdgeCleanup((removalModes[nextIndex] ?? removalModes[0]).cleanup);
                      resetResult();
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {removalModes.map((mode, index) => (
                      <option key={mode.label} value={index}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs leading-5 text-slate-500">{selectedMode.helper}</span>
                </label>

                <label className="block">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                    <span>Edge cleanup</span>
                    <span>{edgeCleanup}</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={edgeCleanup}
                    onChange={(event) => {
                      setEdgeCleanup(Number(event.target.value));
                      resetResult();
                    }}
                    className="mt-3 w-full accent-sky-600"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Original</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{file ? formatBytes(file.size) : "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-500">PNG</p>
                    <p className="mt-1 text-lg font-semibold text-sky-950">{resultBlob ? formatBytes(resultBlob.size) : "-"}</p>
                  </div>
                </div>

                {dimensions ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                    {dimensions.width} x {dimensions.height}px
                  </div>
                ) : null}

                {processing || progressLabel ? (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-sky-800">
                      <span>{progressLabel || "Preparing"}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div className="h-2 rounded-full bg-sky-600 transition-[width] duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : null}

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void removeBackground()}
                    disabled={!file || processing}
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processing ? "Removing..." : "Remove background"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelProcessing}
                    disabled={!processing}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Transparent Preview</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">Switch the preview background to inspect edges before downloading.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewBackgrounds.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPreviewBackground(item.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        previewBackground === item.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl shadow-inner ${previewClass}`}>
                {resultUrl ? (
                  <img src={resultUrl} alt="Transparent background removed preview" className="absolute inset-0 h-full w-full object-contain" />
                ) : originalUrl ? (
                  <img src={originalUrl} alt="Original preview" className="absolute inset-0 h-full w-full object-contain" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">Select an image</span>
                )}

                {originalUrl && !resultUrl ? (
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">Original</span>
                ) : null}
                {resultUrl ? (
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">Transparent PNG</span>
                ) : null}
              </div>

              {resultUrl && resultBlob ? (
                <a
                  href={resultUrl}
                  download={downloadName}
                  className="mt-4 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Download {downloadName} ({formatBytes(resultBlob.size)})
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
