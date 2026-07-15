"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = {
  label: string;
  mimeType: string;
  extension: string;
  supportsQuality: boolean;
};

const outputFormats: OutputFormat[] = [
  { label: "WebP", mimeType: "image/webp", extension: "webp", supportsQuality: true },
  { label: "JPEG", mimeType: "image/jpeg", extension: "jpg", supportsQuality: true },
  { label: "PNG", mimeType: "image/png", extension: "png", supportsQuality: false },
  { label: "AVIF", mimeType: "image/avif", extension: "avif", supportsQuality: true }
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
  return fileName.replace(/\.[^.]+$/, "") || "converted-image";
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("This output format is not supported by your browser."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function fileToImage(file: File) {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      revoke: () => URL.revokeObjectURL(url)
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function ImageConverterPageClient() {
  const [backLoading, setBackLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [format, setFormat] = useState<OutputFormat>(outputFormats[0]);
  const [quality, setQuality] = useState(82);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [comparePosition, setComparePosition] = useState(50);
  const [estimating, setEstimating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const convertedFileName = useMemo(() => {
    if (!file) {
      return `converted.${format.extension}`;
    }

    return `${getBaseName(file.name)}.${format.extension}`;
  }, [file, format.extension]);

  useEffect(() => {
    return () => {
      if (originalUrl) {
        URL.revokeObjectURL(originalUrl);
      }
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [originalUrl, convertedUrl]);

  async function drawFileToCanvas(nextFile: File) {
    const loaded = await fileToImage(nextFile);
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = loaded.width;
    canvas.height = loaded.height;

    const context = canvas.getContext("2d");
    if (!context) {
      loaded.revoke();
      throw new Error("Canvas is not available in this browser.");
    }

    context.clearRect(0, 0, loaded.width, loaded.height);
    context.drawImage(loaded.image, 0, 0);
    setDimensions({ width: loaded.width, height: loaded.height });
    loaded.revoke();
    return canvas;
  }

  async function estimate(nextFile = file, nextFormat = format, nextQuality = quality) {
    if (!nextFile) {
      setEstimatedSize(null);
      return;
    }

    setEstimating(true);
    setError(null);

    try {
      const canvas = await drawFileToCanvas(nextFile);
      const blob = await canvasToBlob(canvas, nextFormat.mimeType, nextQuality / 100);
      setEstimatedSize(blob.size);
    } catch (estimateError) {
      setEstimatedSize(null);
      setError(estimateError instanceof Error ? estimateError.message : "Could not estimate output size.");
    } finally {
      setEstimating(false);
    }
  }

  async function handleFile(nextFile: File | null) {
    setError(null);
    setConvertedBlob(null);
    setEstimatedSize(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
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
      return;
    }

    const nextOriginalUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setOriginalUrl(nextOriginalUrl);
    await estimate(nextFile, format, quality);
  }

  async function convert() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setConverting(true);
    setError(null);

    try {
      const canvas = await drawFileToCanvas(file);
      const blob = await canvasToBlob(canvas, format.mimeType, quality / 100);
      const nextUrl = URL.createObjectURL(blob);

      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }

      setConvertedBlob(blob);
      setConvertedUrl(nextUrl);
      setEstimatedSize(blob.size);
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "Could not convert image.");
    } finally {
      setConverting(false);
    }
  }

  async function updateFormat(mimeType: string) {
    const nextFormat = outputFormats.find((item) => item.mimeType === mimeType) ?? outputFormats[0];
    setFormat(nextFormat);
    setConvertedBlob(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
    await estimate(file, nextFormat, quality);
  }

  async function updateQuality(nextQuality: number) {
    setQuality(nextQuality);
    setConvertedBlob(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
    await estimate(file, format, nextQuality);
  }

  function updateComparePosition(clientX: number) {
    const bounds = compareRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) {
      return;
    }

    const nextPosition = ((clientX - bounds.left) / bounds.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, nextPosition)));
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" onClick={() => setBackLoading(true)} className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            {backLoading ? (<span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> Loading...</span>) : ("Back to features")}
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">Local conversion</span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Image Converter</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Convert Images</h1>
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
                  <span className="text-sm font-semibold text-slate-700">Output type</span>
                  <select
                    value={format.mimeType}
                    onChange={(event) => void updateFormat(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {outputFormats.map((item) => (
                      <option key={item.mimeType} value={item.mimeType}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                    <span>Quality</span>
                    <span>{format.supportsQuality ? `${quality}%` : "Lossless"}</span>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    disabled={!format.supportsQuality}
                    onChange={(event) => void updateQuality(Number(event.target.value))}
                    className="mt-3 w-full accent-sky-600 disabled:opacity-40"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Original</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{file ? formatBytes(file.size) : "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Estimate</p>
                    <p className="mt-1 text-lg font-semibold text-sky-950">{estimating ? "..." : estimatedSize ? formatBytes(estimatedSize) : "-"}</p>
                  </div>
                </div>

                {dimensions ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                    {dimensions.width} x {dimensions.height}px
                  </div>
                ) : null}

                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                <button
                  type="button"
                  onClick={() => void convert()}
                  disabled={!file || converting}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {converting ? "Converting..." : "Convert image"}
                </button>

              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Compare Quality</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">Original on the left, converted on the right.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{file?.type || "Original"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{format.label}</span>
                </div>
              </div>

              <div
                ref={compareRef}
                className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-white shadow-inner ${
                  originalUrl && convertedUrl ? "cursor-ew-resize touch-none" : ""
                }`}
                onPointerDown={(event) => {
                  if (!originalUrl || !convertedUrl) {
                    return;
                  }

                  event.currentTarget.setPointerCapture(event.pointerId);
                  updateComparePosition(event.clientX);
                }}
                onPointerMove={(event) => {
                  if (!originalUrl || !convertedUrl || !event.currentTarget.hasPointerCapture(event.pointerId)) {
                    return;
                  }

                  updateComparePosition(event.clientX);
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
              >
                {originalUrl ? (
                  <img src={originalUrl} alt="Original preview" className="absolute inset-0 h-full w-full object-contain" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">Select an image</span>
                )}

                {convertedUrl ? (
                  <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}>
                    <img src={convertedUrl} alt="Converted preview" className="h-full w-full object-contain" />
                  </div>
                ) : null}

                {originalUrl && convertedUrl ? (
                  <>
                    <div className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.2)]" style={{ left: `${comparePosition}%` }} />
                    <div
                      className="absolute top-1/2 z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white bg-slate-950 text-xs font-bold text-white shadow-lg"
                      style={{ left: `${comparePosition}%` }}
                      aria-hidden="true"
                    >
                      ||
                    </div>
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">Original</span>
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">Converted</span>
                  </>
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">{originalUrl ? "Convert to compare" : "Select an image"}</span>
                )}
              </div>

              {convertedUrl && convertedBlob ? (
                <a
                  href={convertedUrl}
                  download={convertedFileName}
                  className="mt-4 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Download {convertedFileName} ({formatBytes(convertedBlob.size)})
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
