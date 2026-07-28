"use client";

import { useEffect, useRef, useState } from "react";
import { Card, buttonClass, softButtonClass, inputClass, createZipBlob } from "./shared";

interface FaviconSize {
  name: string;
  size: number;
  filename: string;
}

const FAVICON_SIZES: FaviconSize[] = [
  { name: "favicon-16x16.png", size: 16, filename: "favicon-16x16.png" },
  { name: "favicon-32x32.png", size: 32, filename: "favicon-32x32.png" },
  { name: "favicon.ico", size: 32, filename: "favicon.ico" },
  { name: "apple-touch-icon.png", size: 180, filename: "apple-touch-icon.png" },
  { name: "android-chrome-192x192.png", size: 192, filename: "android-chrome-192x192.png" },
  { name: "android-chrome-512x512.png", size: 512, filename: "android-chrome-512x512.png" },
];

function generateWebManifest(siteName: string, themeColor: string, bgColor: string, displayMode: string): string {
  return JSON.stringify(
    {
      name: siteName || "My App",
      short_name: siteName || "App",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
      ],
      theme_color: themeColor || "#0f172a",
      background_color: bgColor || "#ffffff",
      display: displayMode || "standalone"
    },
    null,
    2
  );
}

function resizeImage(img: HTMLImageElement, size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function FaviconGeneratorTool() {
  const [siteName, setSiteName] = useState("My Website");
  const [themeColor, setThemeColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [displayMode, setDisplayMode] = useState("standalone");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ name: string; url: string; blob: Blob }[]>([]);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatedRef = useRef<{ name: string; url: string; blob: Blob }[]>([]);
  useEffect(() => {
    generatedRef.current = generated;
  }, [generated]);

  useEffect(() => {
    return () => {
      for (const item of generatedRef.current) {
        if (item.url) URL.revokeObjectURL(item.url);
      }
    };
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      for (const item of generatedRef.current) {
        if (item.url) URL.revokeObjectURL(item.url);
      }
      setGenerated([]);
    };
    reader.readAsDataURL(file);
  }

  async function generateFavicons() {
    if (!sourceImage) return;

    setLoading(true);
    for (const item of generatedRef.current) {
      if (item.url) URL.revokeObjectURL(item.url);
    }
    setGenerated([]);

    const results: { name: string; url: string; blob: Blob }[] = [];

    try {
      const img = new Image();
      img.src = sourceImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      for (const favicon of FAVICON_SIZES) {
        const blob = await resizeImage(img, favicon.size);
        const url = URL.createObjectURL(blob);
        results.push({ name: favicon.filename, url, blob });
      }

      setGenerated(results);
    } catch (err) {
      console.error("Failed to generate favicons:", err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadZip() {
    if (generated.length === 0) return;
    setZipping(true);

    try {
      const zipFiles = generated.map((g) => ({ name: g.name, blob: g.blob }));
      const manifestStr = generateWebManifest(siteName, themeColor, bgColor, displayMode);
      zipFiles.push({
        name: "site.webmanifest",
        blob: new Blob([manifestStr], { type: "application/json" })
      });

      const zipBlob = await createZipBlob(zipFiles);
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "favicon-pack.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);
    } catch (err) {
      console.error(err);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card title="Favicon Generator">
        <p className="mb-4 text-sm text-slate-600">
          Upload a high-resolution logo or image to generate a complete set of web, Apple iOS, and Android favicons along with a custom <code className="font-mono text-xs">site.webmanifest</code>.
        </p>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Display Mode</label>
              <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} className={inputClass}>
                <option value="standalone">Standalone (PWA)</option>
                <option value="minimal-ui">Minimal UI</option>
                <option value="browser">Browser</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Theme Color</label>
              <div className="flex gap-2">
                <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-11 w-14 rounded-xl cursor-pointer border border-slate-200 p-1" />
                <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-11 w-14 rounded-xl cursor-pointer border border-slate-200 p-1" />
                <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Source Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-sky-400"
            >
              {sourceImage ? (
                <img src={sourceImage} alt="Source" className="mx-auto max-h-32 rounded-xl object-contain" />
              ) : (
                <div className="text-slate-500">
                  <div className="mb-2 text-4xl">📁</div>
                  <div className="text-sm font-semibold">Click to upload or drag & drop</div>
                  <div className="mt-1 text-xs text-slate-400">Recommended: 512x512px or larger transparent PNG</div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={generateFavicons} disabled={!sourceImage || loading} className={buttonClass}>
              {loading ? "Generating..." : "Generate Favicons"}
            </button>
            {generated.length > 0 && (
              <button type="button" onClick={() => void downloadDownloadZip()} disabled={zipping} className={softButtonClass}>
                {zipping ? "Packaging ZIP..." : "Download Package (.zip)"}
              </button>
            )}
          </div>
        </div>

        {generated.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Generated Assets</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {generated.map((fav) => (
                <div key={fav.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <img src={fav.url} alt={fav.name} className="h-8 w-8 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-sm font-semibold text-slate-800">{fav.name}</div>
                  </div>
                  <a href={fav.url} download={fav.name} className="shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-900">
                    Download
                  </a>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-xs">📋</div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold text-slate-800">site.webmanifest</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const manifestStr = generateWebManifest(siteName, themeColor, bgColor, displayMode);
                    const blob = new Blob([manifestStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "site.webmanifest";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                  }}
                  className="shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-900"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {generated.length > 0 && (
        <Card title="HTML Header Tags">
          <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 font-mono text-xs text-sky-300">
{`<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">`}
          </pre>
        </Card>
      )}
    </div>
  );

  function downloadDownloadZip() {
    void downloadZip();
  }
}