"use client";

import { useState, useRef } from "react";
import { Card, buttonClass, softButtonClass } from "./shared";

interface FaviconSize {
  name: string;
  size: number;
  filename: string;
}

const FAVICON_SIZES: FaviconSize[] = [
  { name: "favicon.ico", size: 32, filename: "favicon.ico" },
  { name: "favicon-16x16.png", size: 16, filename: "favicon-16x16.png" },
  { name: "favicon-32x32.png", size: 32, filename: "favicon-32x32.png" },
  { name: "apple-touch-icon.png", size: 180, filename: "apple-touch-icon.png" },
  { name: "android-chrome-192x192.png", size: 192, filename: "android-chrome-192x192.png" },
  { name: "android-chrome-512x512.png", size: 512, filename: "android-chrome-512x512.png" },
];

function generateWebManifest(siteName: string): string {
  return JSON.stringify({
    name: siteName,
    short_name: siteName,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  }, null, 2);
}

function resizeImage(
  img: HTMLImageElement,
  size: number
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function FaviconGeneratorTool() {
  const [siteName, setSiteName] = useState("My Website");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      setGenerated([]);
    };
    reader.readAsDataURL(file);
  }

  async function generateFavicons() {
    if (!sourceImage) return;
    
    setLoading(true);
    const results: { name: string; url: string }[] = [];
    
    try {
      const img = new Image();
      img.src = sourceImage;
      await new Promise((resolve) => { img.onload = resolve; });
      
      for (const favicon of FAVICON_SIZES) {
        const blob = await resizeImage(img, favicon.size);
        const url = URL.createObjectURL(blob);
        results.push({ name: favicon.filename, url });
      }
      
      setGenerated(results);
    } catch (err) {
      console.error("Failed to generate favicons:", err);
    } finally {
      setLoading(false);
    }
  }

  function downloadAll() {
    generated.forEach((fav) => {
      const a = document.createElement("a");
      a.href = fav.url;
      a.download = fav.name;
      a.click();
    });
  }

  return (
    <div className="space-y-5">
      <Card title="Favicon Generator">
        <p className="text-sm text-slate-600 mb-4">
          Upload one image and get the full modern favicon set with all required sizes and a site.webmanifest file.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Source Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-400 transition"
            >
              {sourceImage ? (
                <img src={sourceImage} alt="Source" className="max-h-32 mx-auto" />
              ) : (
                <div className="text-slate-500">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-sm font-semibold">Click to upload or drag and drop</div>
                  <div className="text-xs text-slate-400 mt-1">Recommended: 512x512px or larger</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={generateFavicons}
              disabled={!sourceImage || loading}
              className={buttonClass}
            >
              {loading ? "Generating..." : "Generate Favicons"}
            </button>
            {generated.length > 0 && (
              <button type="button" onClick={downloadAll} className={softButtonClass}>
                Download All
              </button>
            )}
          </div>
        </div>

        {generated.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Generated Files</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {generated.map((fav) => (
                <div key={fav.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <img src={fav.url} alt={fav.name} className="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-slate-800 truncate">{fav.name}</div>
                  </div>
                  <a href={fav.url} download={fav.name} className="text-xs text-sky-700 hover:text-sky-900">
                    Download
                  </a>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded text-xs">📋</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-slate-800">site.webmanifest</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([generateWebManifest(siteName)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "site.webmanifest";
                    a.click();
                  }}
                  className="text-xs text-sky-700 hover:text-sky-900"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {generated.length > 0 && (
        <Card title="HTML Tags">
          <pre className="p-4 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto">
{`<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
          </pre>
        </Card>
      )}
    </div>
  );
}