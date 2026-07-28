"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = {
  label: string;
  mimeType: string;
  extension: string;
  supportsQuality: boolean;
};

type ConvertedResult = {
  blob: Blob;
  url: string;
  fileName: string;
  size: number;
};

const outputFormats: OutputFormat[] = [
  { label: "WebP", mimeType: "image/webp", extension: "webp", supportsQuality: true },
  { label: "JPEG", mimeType: "image/jpeg", extension: "jpg", supportsQuality: true },
  { label: "PNG", mimeType: "image/png", extension: "png", supportsQuality: false },
  { label: "AVIF", mimeType: "image/avif", extension: "avif", supportsQuality: true }
];

const MAX_CANVAS_DIMENSION = 4096;

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

function checkFormatSupport(mimeType: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error(`The output format (${mimeType}) is not supported by your browser.`));
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

    let width = image.naturalWidth || image.width || 800;
    let height = image.naturalHeight || image.height || 600;

    return {
      image,
      width,
      height,
      revoke: () => URL.revokeObjectURL(url)
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw new Error(`Failed to decode image file: "${file.name}". Format may be unsupported by your browser.`);
  }
}

function revokeResults(results: ConvertedResult[]) {
  for (const item of results) {
    if (item.url) {
      URL.revokeObjectURL(item.url);
    }
  }
}

// Pure JS Store-compression ZIP creation (0 dependencies)
async function createZipBlob(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    return table;
  })();

  const getCrc32 = (buf: Uint8Array) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const textEncoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const fileEntries: { nameBytes: Uint8Array; dataBytes: Uint8Array; crc32: number; offset: number }[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const arrayBuf = await file.blob.arrayBuffer();
    const dataBytes = new Uint8Array(arrayBuf);
    const crc32 = getCrc32(dataBytes);

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc32, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);

    fileEntries.push({ nameBytes, dataBytes, crc32, offset: currentOffset });

    parts.push(header);
    parts.push(dataBytes);
    currentOffset += header.length + dataBytes.length;
  }

  const cdStart = currentOffset;
  let cdSize = 0;

  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, entry.crc32, true);
    view.setUint32(20, entry.dataBytes.length, true);
    view.setUint32(24, entry.dataBytes.length, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, entry.offset, true);
    cdHeader.set(entry.nameBytes, 46);

    parts.push(cdHeader);
    cdSize += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileEntries.length, true);
  view.setUint16(10, fileEntries.length, true);
  view.setUint32(12, cdSize, true);
  view.setUint32(16, cdStart, true);
  view.setUint16(20, 0, true);

  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: "application/zip" });
}

export function ImageConverterPageClient() {
  const [backLoading, setBackLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
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
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [convertedResults, setConvertedResults] = useState<ConvertedResult[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const estimateReqIdRef = useRef<number>(0);
  const convertedResultsRef = useRef<ConvertedResult[]>([]);

  // Keep ref synchronized with state to cleanly revoke Object URLs
  useEffect(() => {
    convertedResultsRef.current = convertedResults;
  }, [convertedResults]);

  const isBulk = files.length > 1;
  const currentFile = files.length === 1 ? files[0] : null;

  const convertedFileName = useMemo(() => {
    if (!currentFile) {
      return `converted.${format.extension}`;
    }
    return `${getBaseName(currentFile.name)}.${format.extension}`;
  }, [currentFile, format.extension]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      revokeResults(convertedResultsRef.current);
    };
  }, [originalUrl, convertedUrl]);

  const drawFileToCanvas = useCallback(async (nextFile: File, targetMime: string) => {
    const loaded = await fileToImage(nextFile);

    // Calculate dimensions, capping max width/height to avoid canvas OOM crashes
    let drawWidth = loaded.width;
    let drawHeight = loaded.height;

    if (drawWidth > MAX_CANVAS_DIMENSION || drawHeight > MAX_CANVAS_DIMENSION) {
      if (drawWidth >= drawHeight) {
        drawHeight = Math.round((drawHeight * MAX_CANVAS_DIMENSION) / drawWidth);
        drawWidth = MAX_CANVAS_DIMENSION;
      } else {
        drawWidth = Math.round((drawWidth * MAX_CANVAS_DIMENSION) / drawHeight);
        drawHeight = MAX_CANVAS_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = drawWidth;
    canvas.height = drawHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      loaded.revoke();
      throw new Error("Canvas 2D context is not available in your browser.");
    }

    // Fill background with solid white for non-alpha formats (JPEG) to prevent black background
    if (targetMime === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, drawWidth, drawHeight);
    } else {
      context.clearRect(0, 0, drawWidth, drawHeight);
    }

    context.drawImage(loaded.image, 0, 0, drawWidth, drawHeight);
    loaded.revoke();

    return { canvas, width: drawWidth, height: drawHeight };
  }, []);

  const processSingleConversion = useCallback(
    async (file: File, targetFormat = format, targetQuality = quality, isEstimateOnly = false) => {
      const reqId = ++estimateReqIdRef.current;
      if (isEstimateOnly) setEstimating(true);
      else setConverting(true);

      try {
        const { canvas, width, height } = await drawFileToCanvas(file, targetFormat.mimeType);
        if (reqId !== estimateReqIdRef.current) return;

        setDimensions({ width, height });

        const blob = await canvasToBlob(canvas, targetFormat.mimeType, targetQuality / 100);
        if (reqId !== estimateReqIdRef.current) return;

        setEstimatedSize(blob.size);

        // Always update preview and blob so compare slider & download work live
        const nextUrl = URL.createObjectURL(blob);
        setConvertedUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
        setConvertedBlob(blob);
        setError(null);
      } catch (err) {
        if (reqId === estimateReqIdRef.current) {
          setEstimatedSize(null);
          if (!isEstimateOnly) {
            setError(err instanceof Error ? err.message : "Could not convert image.");
          }
        }
      } finally {
        if (reqId === estimateReqIdRef.current) {
          setEstimating(false);
          setConverting(false);
        }
      }
    },
    [drawFileToCanvas, format, quality]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const rawList = Array.from(newFiles);
      const imageFiles = rawList.filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(f.name));
      const skipped = rawList.length - imageFiles.length;

      if (imageFiles.length === 0) {
        setError("No valid image files found. Please select standard image files.");
        setWarning(null);
        return;
      }

      setError(null);
      setWarning(skipped > 0 ? `Notice: ${skipped} non-image file${skipped > 1 ? "s were" : " was"} skipped.` : null);

      revokeResults(convertedResultsRef.current);
      setConvertedResults([]);

      setConvertedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      setFiles(imageFiles);

      if (imageFiles.length === 1) {
        const singleFile = imageFiles[0];
        const origUrl = URL.createObjectURL(singleFile);
        setOriginalUrl(origUrl);
        void processSingleConversion(singleFile, format, quality, false);
      }
    },
    [format, quality, processSingleConversion]
  );

  const handleFormatChange = (nextFormat: OutputFormat) => {
    if (!checkFormatSupport(nextFormat.mimeType)) {
      setError(`Your browser does not support exporting to ${nextFormat.label}.`);
      return;
    }

    setFormat(nextFormat);
    setError(null);

    revokeResults(convertedResultsRef.current);
    setConvertedResults([]);

    if (currentFile) {
      void processSingleConversion(currentFile, nextFormat, quality, false);
    }
  };

  const handleQualityChange = (nextQuality: number) => {
    setQuality(nextQuality);

    revokeResults(convertedResultsRef.current);
    setConvertedResults([]);

    if (currentFile) {
      void processSingleConversion(currentFile, format, nextQuality, false);
    }
  };

  const handleBulkConvert = async () => {
    if (files.length === 0) return;

    setConverting(true);
    setError(null);

    revokeResults(convertedResultsRef.current);
    setConvertedResults([]);

    const results: ConvertedResult[] = [];
    const usedNames = new Set<string>();

    for (const file of files) {
      let baseName = getBaseName(file.name);
      let targetName = `${baseName}.${format.extension}`;
      let counter = 1;

      while (usedNames.has(targetName)) {
        targetName = `${baseName} (${counter}).${format.extension}`;
        counter++;
      }
      usedNames.add(targetName);

      try {
        const { canvas } = await drawFileToCanvas(file, format.mimeType);
        const blob = await canvasToBlob(canvas, format.mimeType, quality / 100);
        const url = URL.createObjectURL(blob);

        results.push({
          blob,
          url,
          fileName: targetName,
          size: blob.size
        });
      } catch {
        results.push({
          blob: new Blob(),
          url: "",
          fileName: targetName,
          size: 0
        });
      }
    }

    setConvertedResults(results);
    setConverting(false);
  };

  const handleDownloadAllZip = async () => {
    const validFiles = convertedResults.filter((r) => r.url && r.blob.size > 0);
    if (validFiles.length === 0) return;

    setZipping(true);
    try {
      const zipBlob = await createZipBlob(validFiles.map((f) => ({ name: f.fileName, blob: f.blob })));
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `converted-images-${format.extension}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);
    } catch {
      setError("Failed to package ZIP file.");
    } finally {
      setZipping(false);
    }
  };

  const updateComparePosition = (clientX: number) => {
    const bounds = compareRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) return;
    const nextPosition = ((clientX - bounds.left) / bounds.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, nextPosition)));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/features"
            onClick={() => setBackLoading(true)}
            className="text-sm font-semibold text-slate-600 transition hover:text-sky-700"
          >
            {backLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> Loading...
              </span>
            ) : (
              "Back to features"
            )}
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
            Local conversion
          </span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Image Converter</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Convert Images</h1>
              </div>

              <label
                className={`relative block rounded-3xl border-2 border-dashed p-5 text-center transition ${
                  dragOver
                    ? "border-sky-400 bg-sky-50"
                    : "border-slate-300 bg-slate-50 hover:border-sky-300 hover:bg-sky-50"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {files.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {files.length} image{files.length > 1 ? "s" : ""} loaded
                    </span>
                    <span className="block text-xs text-slate-500">Drag & drop more or click to replace</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Drop images here</span>
                    <span className="block text-xs text-slate-500">or click to browse</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    if (event.target.files && event.target.files.length > 0) {
                      handleFiles(event.target.files);
                    }
                    event.target.value = "";
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>

              <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Output type</span>
                  <select
                    value={format.mimeType}
                    onChange={(event) => {
                      const nextFormat = outputFormats.find((item) => item.mimeType === event.target.value) ?? outputFormats[0];
                      handleFormatChange(nextFormat);
                    }}
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
                    onChange={(event) => {
                      handleQualityChange(Number(event.target.value));
                    }}
                    className="mt-3 w-full accent-sky-600 disabled:opacity-40"
                  />
                </label>

                {!isBulk ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Original</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{currentFile ? formatBytes(currentFile.size) : "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Converted Size</p>
                      <p className="mt-1 text-lg font-semibold text-sky-950">
                        {estimating || converting ? "..." : estimatedSize ? formatBytes(estimatedSize) : "-"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!isBulk && dimensions ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                    {dimensions.width} x {dimensions.height}px
                  </div>
                ) : null}

                {warning ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</div> : null}
                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                {isBulk ? (
                  <button
                    type="button"
                    onClick={() => void handleBulkConvert()}
                    disabled={files.length === 0 || converting}
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {converting ? `Converting ${files.length} images...` : `Bulk convert ${files.length} images to ${format.label}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentFile) void processSingleConversion(currentFile, format, quality, false);
                    }}
                    disabled={!currentFile || converting}
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {converting ? "Converting..." : `Re-convert to ${format.label}`}
                  </button>
                )}
              </div>
            </div>

            {!isBulk && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Compare Quality</h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">Original on the left, converted on the right.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{currentFile?.type || "Original"}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{format.label}</span>
                  </div>
                </div>

                <div
                  ref={compareRef}
                  className="relative aspect-[4/3] max-h-[500px] overflow-hidden rounded-2xl bg-white shadow-inner"
                  style={{ touchAction: "pan-y" }}
                  onPointerDown={(event) => {
                    if (!originalUrl || !convertedUrl) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateComparePosition(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    if (!originalUrl || !convertedUrl || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
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
                    <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">Drop or select an image</span>
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
                        role="slider"
                        tabIndex={0}
                        aria-label="Image quality comparison slider"
                        aria-valuenow={Math.round(comparePosition)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowLeft") setComparePosition((prev) => Math.max(0, prev - 5));
                          else if (e.key === "ArrowRight") setComparePosition((prev) => Math.min(100, prev + 5));
                          else if (e.key === "Home") setComparePosition(0);
                          else if (e.key === "End") setComparePosition(100);
                        }}
                        className="absolute top-1/2 z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white bg-slate-950 text-xs font-bold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                        style={{ left: `${comparePosition}%` }}
                      >
                        ||
                      </div>
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        Original
                      </span>
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        Converted
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">
                      {originalUrl ? "Processing preview..." : "Drop or select an image"}
                    </span>
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
            )}

            {isBulk && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {convertedResults.length > 0 ? "Converted Files" : "Images to Convert"}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {convertedResults.length > 0
                        ? `All ${convertedResults.length} images converted to ${format.label}.`
                        : `${files.length} images will be converted to ${format.label}.`}
                    </p>
                  </div>

                  {convertedResults.some((r) => r.url) ? (
                    <button
                      type="button"
                      onClick={() => void handleDownloadAllZip()}
                      disabled={zipping}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {zipping ? "Creating ZIP..." : "Download All (.zip)"}
                    </button>
                  ) : null}
                </div>

                {convertedResults.length > 0 ? (
                  <div className="max-h-[520px] space-y-2 overflow-y-auto">
                    {convertedResults.map((result, i) => (
                      <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{result.fileName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {files[i]?.name} &middot; {result.size > 0 ? formatBytes(result.size) : "Error"}
                          </p>
                        </div>
                        {result.url ? (
                          <a
                            href={result.url}
                            download={result.fileName}
                            className="ml-3 shrink-0 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="ml-3 shrink-0 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-600">Failed</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white shadow-inner">
                    <span className="text-sm font-medium text-slate-400">
                      {converting ? "Converting..." : "Click bulk convert to start"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}