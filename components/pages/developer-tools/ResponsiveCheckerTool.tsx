"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClass, softButtonClass, copyText } from "./shared";

type DeviceCategory = "phones" | "tablets" | "laptops" | "desktops" | "custom";

type Device = {
  name: string;
  width: number;
  height: number;
  category: DeviceCategory;
  brand?: string;
  dpr?: number;
};

const devices: Device[] = [
  // iPhones
  { name: "iPhone 16 Pro Max", width: 440, height: 956, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 16 Pro", width: 402, height: 874, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 16 Plus", width: 440, height: 956, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 16", width: 393, height: 852, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 15 Pro Max", width: 430, height: 932, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 15 Pro", width: 393, height: 852, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 15", width: 390, height: 844, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone 14", width: 390, height: 844, category: "phones", brand: "Apple", dpr: 3 },
  { name: "iPhone SE", width: 375, height: 667, category: "phones", brand: "Apple", dpr: 2 },
  { name: "iPhone 13 mini", width: 375, height: 812, category: "phones", brand: "Apple", dpr: 3 },
  // Samsung
  { name: "Galaxy S25 Ultra", width: 412, height: 915, category: "phones", brand: "Samsung", dpr: 3.5 },
  { name: "Galaxy S25+", width: 384, height: 854, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy S25", width: 360, height: 780, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy S24 Ultra", width: 412, height: 915, category: "phones", brand: "Samsung", dpr: 3.5 },
  { name: "Galaxy S24", width: 360, height: 780, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy S23", width: 360, height: 780, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy A55", width: 360, height: 800, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy A35", width: 360, height: 800, category: "phones", brand: "Samsung", dpr: 3 },
  { name: "Galaxy A15", width: 360, height: 800, category: "phones", brand: "Samsung", dpr: 3 },
  // Google Pixel
  { name: "Pixel 9 Pro XL", width: 412, height: 915, category: "phones", brand: "Google", dpr: 3.5 },
  { name: "Pixel 9 Pro", width: 384, height: 854, category: "phones", brand: "Google", dpr: 3 },
  { name: "Pixel 9", width: 412, height: 892, category: "phones", brand: "Google", dpr: 2.75 },
  { name: "Pixel 8a", width: 412, height: 892, category: "phones", brand: "Google", dpr: 2.75 },
  // OnePlus
  { name: "OnePlus 12", width: 412, height: 915, category: "phones", brand: "OnePlus", dpr: 3 },
  { name: "OnePlus Nord 4", width: 412, height: 915, category: "phones", brand: "OnePlus", dpr: 3 },
  // Tablets
  { name: "iPad Pro 13\"", width: 1032, height: 1376, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad Pro 12.9\"", width: 1024, height: 1366, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad Pro 11\"", width: 834, height: 1194, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad Air 13\"", width: 1024, height: 1366, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad Air 11\"", width: 820, height: 1180, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad 10th gen", width: 810, height: 1080, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "iPad mini", width: 768, height: 1024, category: "tablets", brand: "Apple", dpr: 2 },
  { name: "Galaxy Tab S9 Ultra", width: 852, height: 1298, category: "tablets", brand: "Samsung", dpr: 2.5 },
  { name: "Galaxy Tab S9+", width: 752, height: 1170, category: "tablets", brand: "Samsung", dpr: 2.5 },
  { name: "Galaxy Tab S9", width: 704, height: 1122, category: "tablets", brand: "Samsung", dpr: 2.5 },
  { name: "Galaxy Tab A9", width: 800, height: 1280, category: "tablets", brand: "Samsung", dpr: 2 },
  { name: "Pixel Tablet", width: 800, height: 1280, category: "tablets", brand: "Google", dpr: 2 },
  { name: "Surface Pro", width: 912, height: 1368, category: "tablets", brand: "Microsoft", dpr: 2 },
  // Laptops
  { name: 'MacBook Air 13"', width: 1280, height: 800, category: "laptops", brand: "Apple" },
  { name: 'MacBook Air 15"', width: 1440, height: 900, category: "laptops", brand: "Apple" },
  { name: 'MacBook Pro 14"', width: 1512, height: 982, category: "laptops", brand: "Apple" },
  { name: 'MacBook Pro 16"', width: 1728, height: 1118, category: "laptops", brand: "Apple" },
  { name: 'Dell XPS 13"', width: 1920, height: 1080, category: "laptops", brand: "Dell" },
  { name: 'Dell XPS 15"', width: 1920, height: 1200, category: "laptops", brand: "Dell" },
  { name: "ThinkPad X1 Carbon", width: 1920, height: 1200, category: "laptops", brand: "Lenovo" },
  { name: "ThinkPad T14s", width: 1920, height: 1080, category: "laptops", brand: "Lenovo" },
  { name: "Surface Laptop 5", width: 2256, height: 1504, category: "laptops", brand: "Microsoft" },
  { name: "HP Spectre x360", width: 1920, height: 1080, category: "laptops", brand: "HP" },
  // Desktops
  { name: 'iMac 24"', width: 1920, height: 1080, category: "desktops", brand: "Apple" },
  { name: 'iMac 27"', width: 2560, height: 1440, category: "desktops", brand: "Apple" },
  { name: "Studio Display", width: 2560, height: 1440, category: "desktops", brand: "Apple" },
  { name: "Pro Display XDR", width: 3840, height: 2160, category: "desktops", brand: "Apple" },
  { name: 'Dell U2723QE 27"', width: 2560, height: 1440, category: "desktops", brand: "Dell" },
  { name: 'LG UltraFine 27"', width: 2560, height: 1440, category: "desktops", brand: "LG" },
  { name: 'Samsung ViewFinity S9', width: 2560, height: 1440, category: "desktops", brand: "Samsung" },
];

const categories: { key: DeviceCategory; label: string; icon: string }[] = [
  { key: "phones", label: "Phones", icon: "📱" },
  { key: "tablets", label: "Tablets", icon: "📱" },
  { key: "laptops", label: "Laptops", icon: "💻" },
  { key: "desktops", label: "Desktops", icon: "🖥" },
  { key: "custom", label: "Custom", icon: "⚙" },
];

function DeviceFrame({ children, width, height, scale, label }: { children: React.ReactNode; width: number; height: number; scale: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-semibold text-slate-400 mb-2">{label}</div>
      <div className="relative rounded-2xl border-2 border-slate-800 bg-slate-900 shadow-2xl overflow-hidden" style={{ width: width * scale, height: height * scale }}>
        <div className="absolute inset-0 overflow-auto" style={{ width: width, height: height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
      <div className="mt-2 text-[10px] font-mono text-slate-500">{width} x {height}</div>
    </div>
  );
}

export function ResponsiveCheckerTool() {
  const [url, setUrl] = useState("https://example.com");
  const [inputUrl, setInputUrl] = useState("https://example.com");
  const [category, setCategory] = useState<DeviceCategory>("phones");
  const [selectedDevice, setSelectedDevice] = useState<Device>(devices[0]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [customWidth, setCustomWidth] = useState(375);
  const [customHeight, setCustomHeight] = useState(812);
  const [showAll, setShowAll] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredDevices = devices.filter((d) => d.category === category);
  const isLandscapeDevice = category === "laptops" || category === "desktops";

  const activeWidth = category === "custom"
    ? customWidth
    : isLandscapeDevice
      ? Math.max(selectedDevice.width, selectedDevice.height)
      : orientation === "landscape"
        ? Math.max(selectedDevice.width, selectedDevice.height)
        : Math.min(selectedDevice.width, selectedDevice.height);

  const activeHeight = category === "custom"
    ? customHeight
    : isLandscapeDevice
      ? Math.min(selectedDevice.width, selectedDevice.height)
      : orientation === "landscape"
        ? Math.min(selectedDevice.width, selectedDevice.height)
        : Math.max(selectedDevice.width, selectedDevice.height);

  function loadUrl() {
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setHistory((prev) => [finalUrl, ...prev.filter((h) => h !== finalUrl)].slice(0, 10));
    setLoading(true);
    setIframeError(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function doCopy(text: string, key: string) {
    copyText(text);
    setCopiedKey(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedKey(null), 1500);
  }

  function openInNewWindow() {
    const w = window.open(url, "_blank");
    if (!w || w.closed || typeof w.closed === "undefined") {
      doCopy(url, "blocked");
    }
  }

  function handleIframeLoad() {
    setLoading(false);
    setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!doc || doc.body?.innerHTML === "" || doc.body?.innerHTML?.includes("Refused to connect")) {
          setIframeError(true);
        }
      } catch {
        setIframeError(true);
      }
    }, 500);
  }

  function calculateScale() {
    const maxWidth = 800;
    const maxHeight = 600;
    const scaleX = maxWidth / activeWidth;
    const scaleY = maxHeight / activeHeight;
    return Math.min(1, scaleX, scaleY);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") loadUrl();
  }

  const filteredDevicesList = showAll ? filteredDevices : filteredDevices.slice(0, 8);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
            <input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter website URL..." className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none" />
          </div>
          <button type="button" onClick={loadUrl} className={buttonClass + " px-6"}>Go</button>
        </div>
        {history.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {history.map((h, i) => (
              <button key={i} type="button" onClick={() => { setInputUrl(h); setUrl(h); }} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 truncate max-w-[200px]">
                {h.replace("https://", "").replace("http://", "")}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.map((c) => (
              <button key={c.key} type="button" onClick={() => { setCategory(c.key); if (c.key !== "custom" && devices.filter((d) => d.category === c.key).length > 0) { setSelectedDevice(devices.filter((d) => d.category === c.key)[0]); } }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${category === c.key ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {c.label}
              </button>
            ))}
          </div>

          {category !== "custom" && (
            <>
              {!isLandscapeDevice && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{orientation === "portrait" ? "Portrait" : "Landscape"}</span>
                  <button type="button" onClick={() => setOrientation((o) => o === "portrait" ? "landscape" : "portrait")} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    {orientation === "portrait" ? "→" : "↑"}
                  </button>
                </div>
              )}
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredDevicesList.map((d) => {
                  const dw = isLandscapeDevice ? Math.max(d.width, d.height) : (orientation === "landscape" ? Math.max(d.width, d.height) : Math.min(d.width, d.height));
                  const dh = isLandscapeDevice ? Math.min(d.width, d.height) : (orientation === "landscape" ? Math.min(d.width, d.height) : Math.max(d.width, d.height));
                  return (
                    <button key={d.name} type="button" onClick={() => setSelectedDevice(d)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition ${selectedDevice.name === d.name ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
                      <span className="text-xs font-semibold">{d.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{dw}x{dh}</span>
                    </button>
                  );
                })}
              </div>
              {filteredDevices.length > 8 && (
                <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  {showAll ? "Show less" : `Show all ${filteredDevices.length}`}
                </button>
              )}
            </>
          )}

          {category === "custom" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Width</label>
                  <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold text-slate-800 outline-none focus:border-sky-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Height</label>
                  <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold text-slate-800 outline-none focus:border-sky-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ w: 375, h: 812, l: "Phone" }, { w: 768, h: 1024, l: "Tablet" }, { w: 1280, h: 800, l: "Laptop" }, { w: 1920, h: 1080, l: "Desktop" }].map((p) => (
                  <button key={p.l} type="button" onClick={() => { setCustomWidth(p.w); setCustomHeight(p.h); }} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50">
                    {p.l} ({p.w}x{p.h})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current</p>
            <p className="mt-1 text-sm font-mono font-bold text-slate-800">{activeWidth} x {activeHeight}</p>
            <p className="text-[10px] text-slate-500">{(activeWidth / 16).toFixed(1)}rem x {(activeHeight / 16).toFixed(1)}rem</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-950">
                {category === "custom" ? "Custom" : selectedDevice.name}
              </span>
              <span className="text-xs text-slate-500">{activeWidth} x {activeHeight}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={openInNewWindow} className={buttonClass}>Open in new window</button>
              <button type="button" onClick={() => doCopy(url, "url")} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${copiedKey === "url" ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {copiedKey === "url" ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center bg-slate-100 p-6 overflow-auto" style={{ minHeight: 600 }}>
            {url ? (
              iframeError ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center max-w-md">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">This site blocks iframe embedding</p>
                    <p className="mt-1 text-xs text-amber-700">The website sets security headers (X-Frame-Options) that prevent it from loading inside an iframe. This is a browser security restriction.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={openInNewWindow} className={buttonClass}>
                      Open in new tab
                    </button>
                    <button type="button" onClick={() => doCopy(url, "error-url")} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${copiedKey === "error-url" ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                      {copiedKey === "error-url" ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600">Tip: Use Chrome DevTools &gt; Device Toolbar (Ctrl+Shift+M) and enter {activeWidth} x {activeHeight} for full responsive testing.</p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-300 bg-white shadow-lg overflow-hidden" style={{ width: activeWidth * calculateScale(), height: activeHeight * calculateScale() }}>
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src={url}
                    title="Responsive preview"
                    className="border-0"
                    style={{ width: activeWidth, height: activeHeight, transform: `scale(${calculateScale()})`, transformOrigin: "top left" }}
                    onLoad={handleIframeLoad}
                    onError={() => { setLoading(false); setIframeError(true); }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              )
            ) : (
              <p className="text-sm text-slate-500">Enter a URL to preview</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
