"use client";

import { useState, useId } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton } from "./shared";

type GeneratorMode = "qr" | "chart";
type ChartType = "bar" | "line" | "pie" | "doughnut" | "radar";

export function QuickChartGeneratorTool() {
  const [mode, setMode] = useState<GeneratorMode>("qr");

  // QR state
  const [qrText, setQrText] = useState("https://example.com");
  const [qrSize, setQrSize] = useState(250);
  const [qrMargin, setQrMargin] = useState(1);
  const [qrEcLevel, setQrEcLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrDark, setQrDark] = useState("000000");
  const [qrLight, setQrLight] = useState("ffffff");
  const [qrFormat, setQrFormat] = useState<"png" | "svg">("png");

  // Chart state
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartTitle, setChartTitle] = useState("Monthly Active Users (2026)");
  const [chartLabels, setChartLabels] = useState("Jan, Feb, Mar, Apr, May, Jun, Jul");
  const [dataset1Label, setDataset1Label] = useState("Web Visitors");
  const [dataset1Data, setDataset1Data] = useState("1200, 1900, 3000, 5000, 4200, 6100, 7500");
  const [dataset1Color, setDataset1Color] = useState("#0284c7");
  const [hasDataset2, setHasDataset2] = useState(true);
  const [dataset2Label, setDataset2Label] = useState("Mobile App");
  const [dataset2Data, setDataset2Data] = useState("800, 1200, 2100, 3800, 3900, 4800, 5900");
  const [dataset2Color, setDataset2Color] = useState("#10b981");
  const [chartWidth, setChartWidth] = useState(500);
  const [chartHeight, setChartHeight] = useState(300);
  const [chartBg, setChartBg] = useState("white");

  // Generate QR URL
  const buildQrUrl = () => {
    const params = new URLSearchParams({
      text: qrText || "https://example.com",
      size: qrSize.toString(),
      margin: qrMargin.toString(),
      ecLevel: qrEcLevel,
      format: qrFormat,
      dark: qrDark.replace(/^#/, ""),
      light: qrLight.replace(/^#/, ""),
    });
    return `https://quickchart.io/qr?${params.toString()}`;
  };

  // Generate Chart Config & URL
  const buildChartUrl = () => {
    const labels = chartLabels.split(",").map((l) => l.trim()).filter(Boolean);
    const data1 = dataset1Data.split(",").map((d) => Number(d.trim()) || 0);
    const data2 = dataset2Data.split(",").map((d) => Number(d.trim()) || 0);

    const datasets: any[] = [
      {
        label: dataset1Label,
        data: data1,
        backgroundColor: chartType === "pie" || chartType === "doughnut"
          ? ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#94a3b8"]
          : dataset1Color,
        borderColor: dataset1Color,
        fill: chartType === "line" ? false : true,
      },
    ];

    if (hasDataset2 && chartType !== "pie" && chartType !== "doughnut") {
      datasets.push({
        label: dataset2Label,
        data: data2,
        backgroundColor: dataset2Color,
        borderColor: dataset2Color,
        fill: false,
      });
    }

    const config = {
      type: chartType,
      data: {
        labels,
        datasets,
      },
      options: {
        title: {
          display: Boolean(chartTitle.trim()),
          text: chartTitle.trim(),
        },
      },
    };

    const encoded = encodeURIComponent(JSON.stringify(config));
    return `https://quickchart.io/chart?c=${encoded}&w=${chartWidth}&h=${chartHeight}&bkg=${chartBg}&devicePixelRatio=2`;
  };

  const currentQrUrl = buildQrUrl();
  const currentChartUrl = buildChartUrl();

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const chartTypeSelectId = useId();
  const qrErrorCorrectionId = useId();
  const qrFormatId = useId();

  return (
    <div className="space-y-6">
      <Card title="QuickChart: Charts & QR Code Generator">
        <p className="text-sm text-slate-600 mb-5">
          Generate server-side rendered charts and QR codes using QuickChart API without client rendering overhead. Live visual previews, customizable palettes, markdown/HTML embed snippets, and high-res image exports.
        </p>

        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setMode("qr")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "qr" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📱 QR Code Generator
          </button>
          <button
            type="button"
            onClick={() => setMode("chart")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "chart" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📊 Server-side Chart Builder
          </button>
        </div>

        {/* Mode 1: QR Code */}
        {mode === "qr" && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Form controls */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Text or URL
                </label>
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="https://example.com or any text"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Size ({qrSize}px)</label>
                  <input
                    type="range"
                    min={100}
                    max={600}
                    step={25}
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Margin ({qrMargin} modules)</label>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={qrMargin}
                    onChange={(e) => setQrMargin(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor={qrErrorCorrectionId} className="mb-1 block text-xs font-medium text-slate-500">Error Correction</label>
                  <select
                    id={qrErrorCorrectionId}
                    value={qrEcLevel}
                    onChange={(e) => setQrEcLevel(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold"
                  >
                    <option value="L">L (7%)</option>
                    <option value="M">M (15%)</option>
                    <option value="Q">Q (25%)</option>
                    <option value="H">H (30%)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={qrFormatId} className="mb-1 block text-xs font-medium text-slate-500">Format</label>
                  <select
                    id={qrFormatId}
                    value={qrFormat}
                    onChange={(e) => setQrFormat(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold"
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Dark Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={`#${qrDark}`}
                      onChange={(e) => setQrDark(e.target.value.replace(/^#/, ""))}
                      className="h-8 w-8 cursor-pointer rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={qrDark}
                      onChange={(e) => setQrDark(e.target.value.replace(/^#/, ""))}
                      className="w-20 rounded-lg border border-slate-200 p-1.5 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => downloadImage(currentQrUrl, `qrcode.${qrFormat}`)}
                  className={buttonClass + " flex items-center gap-1.5"}
                >
                  ⬇️ Download QR Code
                </button>
                <CopyButton value={currentQrUrl} label="Copy Image URL" className={softButtonClass} />
                <CopyButton value={`<img src="${currentQrUrl}" alt="QR Code" width="${qrSize}" height="${qrSize}" />`} label="Copy HTML" className={softButtonClass} />
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQrUrl}
                  alt="Generated QR Code"
                  width={qrSize}
                  height={qrSize}
                  className="max-h-[300px] w-auto object-contain"
                />
              </div>
              <span className="mt-3 font-mono text-xs text-slate-400">QuickChart Server Rendered QR</span>
            </div>
          </div>
        )}

        {/* Mode 2: Charts */}
        {mode === "chart" && (
          <div className="mt-4 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Chart form settings */}
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={chartTypeSelectId} className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Chart Type
                    </label>
                    <select
                      id={chartTypeSelectId}
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as ChartType)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold"
                    >
                      <option value="bar">📊 Bar Chart</option>
                      <option value="line">📈 Line Chart</option>
                      <option value="pie">🥧 Pie Chart</option>
                      <option value="doughnut">🍩 Doughnut Chart</option>
                      <option value="radar">🕸️ Radar Chart</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Chart Title
                    </label>
                    <input
                      type="text"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Chart Title"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Labels (comma separated)
                  </label>
                  <input
                    type="text"
                    value={chartLabels}
                    onChange={(e) => setChartLabels(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Dataset 1 */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Dataset 1</span>
                    <input
                      type="color"
                      value={dataset1Color}
                      onChange={(e) => setDataset1Color(e.target.value)}
                      className="h-6 w-6 rounded border cursor-pointer"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={dataset1Label}
                      onChange={(e) => setDataset1Label(e.target.value)}
                      placeholder="Dataset Name"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                    />
                    <input
                      type="text"
                      value={dataset1Data}
                      onChange={(e) => setDataset1Data(e.target.value)}
                      placeholder="Values: 10, 20, 30..."
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Dataset 2 */}
                {chartType !== "pie" && chartType !== "doughnut" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasDataset2}
                          onChange={(e) => setHasDataset2(e.target.checked)}
                        />
                        Enable Dataset 2
                      </label>
                      {hasDataset2 && (
                        <input
                          type="color"
                          value={dataset2Color}
                          onChange={(e) => setDataset2Color(e.target.value)}
                          className="h-6 w-6 rounded border cursor-pointer"
                        />
                      )}
                    </div>
                    {hasDataset2 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={dataset2Label}
                          onChange={(e) => setDataset2Label(e.target.value)}
                          placeholder="Dataset 2 Name"
                          className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                        />
                        <input
                          type="text"
                          value={dataset2Data}
                          onChange={(e) => setDataset2Data(e.target.value)}
                          placeholder="Values: 5, 15, 25..."
                          className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => downloadImage(currentChartUrl, "chart.png")}
                    className={buttonClass + " flex items-center gap-1.5"}
                  >
                    ⬇️ Download Chart PNG
                  </button>
                  <CopyButton value={currentChartUrl} label="Copy Image URL" className={softButtonClass} />
                  <CopyButton value={`![${chartTitle || "Chart"}](${currentChartUrl})`} label="Copy Markdown" className={softButtonClass} />
                </div>
              </div>

              {/* Chart Preview Box */}
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm w-full flex items-center justify-center min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentChartUrl}
                    alt="QuickChart Generated Chart"
                    className="max-h-[340px] w-auto object-contain"
                  />
                </div>
                <span className="mt-3 font-mono text-xs text-slate-400">QuickChart Server Rendered Image</span>
              </div>
            </div>

            {/* Embed Snippets */}
            <div className="grid gap-4 sm:grid-cols-2">
              <OutputBox value={currentChartUrl} label="Direct Chart Image URL" />
              <OutputBox value={`<img src="${currentChartUrl}" alt="${chartTitle || "Chart"}" width="500" height="300" />`} label="HTML Embed Snippet" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
