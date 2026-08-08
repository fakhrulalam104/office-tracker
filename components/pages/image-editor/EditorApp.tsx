"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  EditorEngine,
  rgbaToHex
} from "./engine";
import {
  beginStroke,
  floodFill,
  importImageAsLayerCanvas,
  loadImageFromFile,
  paintSegment,
  rasterizeText,
  sampleColorAtDisplay
} from "./tools";
import { LayersPanel } from "./LayersPanel";
import { SelectionOverlay } from "./SelectionOverlay";
import { ToolsRail } from "./Toolbar";
import { NewDocumentModal } from "./NewDocumentModal";
import { FilterModal } from "./FilterModal";
import {
  FONT_OPTIONS,
  type TextDraft,
  type TextStyle,
  type ToolId
} from "./types";

type DragState =
  | { kind: "brush" | "eraser"; lastX: number; lastY: number }
  | { kind: "move"; lastX: number; lastY: number }
  | { kind: "rect"; x0: number; y0: number }
  | { kind: "lasso"; points: { x: number; y: number }[] };

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

function ArrowIcon({ redo = false }: { redo?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 ${redo ? "-scale-x-100" : ""}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}>
      <path d="M4 9a5 5 0 1 1 8 4.2L4 16" />
      <path d="M4 12v4h4" />
    </svg>
  );
}

function ZoomIcon({ type }: { type: "in" | "out" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
      <path d={type === "in" ? "M8.5 11h5M11 8.5v5" : "M8.5 11h5"} />
    </svg>
  );
}

const CHECKER_CLASS =
  "bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] bg-white";

export default function ImageEditorApp() {
  const [backLoading, setBackLoading] = useState(false);

  const [engine] = useState(
    () => new EditorEngine(1200, 800, "white", "Background")
  );

  const version = useSyncExternalStore(
    (listener) => engine.subscribe(listener),
    () => engine.getVersion(),
    () => engine.getVersion()
  );

  const [tool, setTool] = useState<ToolId>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(18);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [tolerance, setTolerance] = useState(30);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    family: "Arial, Helvetica, sans-serif",
    size: 48,
    bold: false,
    italic: false
  });
  const [zoom, setZoom] = useState(1);
  const [showNewDoc, setShowNewDoc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const textStyleRef = useRef(textStyle);
  textStyleRef.current = textStyle;

  const activeLayer = engine.activeLayer;
  const selection = engine.selection;
  const docWidth = engine.width;
  const docHeight = engine.height;

  const fitZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const availableWidth = stage.clientWidth - 40;
    const availableHeight = stage.clientHeight - 40;
    const fit = Math.min(availableWidth / docWidth, availableHeight / docHeight);
    setZoom(Math.max(0.05, Math.min(8, Math.round(fit * 100) / 100)));
  }, [docWidth, docHeight]);

  const composite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    engine.composite(context);
  }, [engine]);

  useEffect(() => {
    composite();
  }, [version, composite, engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== docWidth || canvas.height !== docHeight) {
      canvas.width = docWidth;
      canvas.height = docHeight;
      composite();
    }
  }, [docWidth, docHeight, composite]);

  useEffect(() => {
    fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.width, engine.height, fitZoom]);

  function toDocPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) };
  }

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = toDocPoint(event.clientX, event.clientY);
      if (!point) return;
      event.currentTarget.setPointerCapture(event.pointerId);

      const layer = engine.activeLayer;
      const ctx = canvasRef.current?.getContext("2d");

      switch (tool) {
        case "brush":
        case "eraser": {
          if (!layer || !beginStroke(engine, layer)) return;
          paintSegment(engine, layer, point.x, point.y, point.x, point.y, color, brushSize, brushOpacity, tool);
          dragRef.current = { kind: tool, lastX: point.x, lastY: point.y };
          engine.emit();
          break;
        }
        case "bucket":
          floodFill(engine, point.x, point.y, color, tolerance);
          break;
        case "eyedropper": {
          if (ctx) {
            const sampled = sampleColorAtDisplay(canvasRef.current!, point.x, point.y);
            if (sampled) setColor(rgbaToHex(sampled.r, sampled.g, sampled.b));
          }
          break;
        }
        case "move": {
          if (!layer) break;
          engine.pushHistory();
          dragRef.current = { kind: "move", lastX: point.x, lastY: point.y };
          break;
        }
        case "rectangle-select":
          engine.setSelection({ kind: "rect", rect: { x0: point.x, y0: point.y, x1: point.x, y1: point.y } });
          dragRef.current = { kind: "rect", x0: point.x, y0: point.y };
          break;
        case "lasso":
          engine.setSelection({ kind: "lasso", points: [point] });
          dragRef.current = { kind: "lasso", points: [point] };
          break;
        case "text":
          setTextDraft({ x: point.x, y: point.y, text: "" });
          break;
      }
    },
    [tool, color, brushSize, brushOpacity, tolerance, engine]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = toDocPoint(event.clientX, event.clientY);
      const drag = dragRef.current;
      const layer = engine.activeLayer;
      if (!point || !drag) return;

      switch (drag.kind) {
        case "brush":
        case "eraser": {
          if (!layer) return;
          paintSegment(engine, layer, drag.lastX, drag.lastY, point.x, point.y, color, brushSize, brushOpacity, drag.kind);
          drag.lastX = point.x;
          drag.lastY = point.y;
          engine.emit();
          break;
        }
        case "move": {
          if (!layer) return;
          const dx = point.x - drag.lastX;
          const dy = point.y - drag.lastY;
          if (dx !== 0 || dy !== 0) {
            engine.translateLayerPixels(layer.id, dx, dy);
            drag.lastX = point.x;
            drag.lastY = point.y;
          }
          break;
        }
        case "rect": {
          engine.setSelection({
            kind: "rect",
            rect: { x0: drag.x0, y0: drag.y0, x1: point.x, y1: point.y }
          });
          break;
        }
        case "lasso": {
          drag.points.push(point);
          engine.setSelection({ kind: "lasso", points: drag.points });
          break;
        }
      }
    },
    [color, brushSize, brushOpacity, engine]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleImportFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        const loaded = await loadImageFromFile(file);
        const canvas = importImageAsLayerCanvas(
          loaded.image,
          loaded.width,
          loaded.height,
          engine.width,
          engine.height
        );
        engine.addRasterizedLayer(file.name.split(".")[0] || "Imported image", canvas);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not import that image.");
      }
    },
    [engine]
  );

  const exportDocument = useCallback(
    (format: "png" | "jpeg") => {
      try {
        const canvas = engine.exportCanvas(format === "jpeg" ? "white" : "transparent");
        canvas.toBlob((blob) => {
          if (!blob) {
            setError("Could not export the image.");
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `office-tracker-editor-${Date.now()}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          setError(null);
        }, format === "png" ? "image/png" : "image/jpeg");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not export the image.");
      }
    },
    [engine]
  );

  const commitText = useCallback(() => {
    if (!textDraft || textDraft.text.trim() === "") {
      setTextDraft(null);
      return;
    }
    const style = textStyleRef.current;
    const canvas = rasterizeText(
      engine.width,
      engine.height,
      textDraft.text,
      textDraft.x,
      textDraft.y,
      style,
      color,
      1.4
    );
    engine.addRasterizedLayer("Text", canvas);
    setTextDraft(null);
  }, [textDraft, engine, color]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isEditing) return;

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) engine.redo();
        else engine.undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "y") {
        event.preventDefault();
        engine.redo();
        return;
      }
      if (key === "delete" || key === "backspace") {
        if (engine.selection) {
          event.preventDefault();
          engine.clearSelectionPixels();
        }
        return;
      }
      if (key === "escape") {
        setTextDraft(null);
        engine.clearSelection();
        return;
      }

      const toolMap: Record<string, ToolId> = {
        v: "move",
        b: "brush",
        e: "eraser",
        g: "bucket",
        i: "eyedropper",
        m: "rectangle-select",
        l: "lasso",
        t: "text"
      };
      if (toolMap[key]) {
        setTool(toolMap[key]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engine]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
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
            Local editor &middot; in-memory session
          </span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Image Editor</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Edit Images</h1>
              <p className="mt-2 text-sm text-slate-500">
                {docWidth} &times; {docHeight}px &middot; {Math.round(zoom * 100)}% zoom
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewDoc(true)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                New / Open
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Import layer
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Filters
              </button>

              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                title="Undo (Ctrl+Z)"
                onClick={() => engine.undo()}
                disabled={!engine.canUndo()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowIcon />
              </button>
              <button
                type="button"
                title="Redo (Ctrl+Shift+Z)"
                onClick={() => engine.redo()}
                disabled={!engine.canRedo()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowIcon redo />
              </button>

              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                title="Zoom out"
                onClick={() => setZoom((value) => Math.max(0.05, Math.round((value / 1.25) * 100) / 100))}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-700 transition hover:bg-slate-50"
              >
                <ZoomIcon type="out" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Reset to 100%"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold tabular-nums text-slate-700 transition hover:bg-slate-50"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                title="Zoom in"
                onClick={() => setZoom((value) => Math.min(8, Math.round(value * 1.25 * 100) / 100))}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-700 transition hover:bg-slate-50"
              >
                <ZoomIcon type="in" />
              </button>
              <button
                type="button"
                onClick={fitZoom}
                title="Fit to view"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Fit
              </button>

              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                onClick={() => exportDocument("png")}
                className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                <span className="flex items-center gap-1.5">
                  <DownloadIcon className="h-3.5 w-3.5" /> PNG
                </span>
              </button>
              <button
                type="button"
                onClick={() => exportDocument("jpeg")}
                className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <span className="flex items-center gap-1.5">
                  <DownloadIcon className="h-3.5 w-3.5" /> JPEG
                </span>
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[64px_minmax(0,1fr)_300px]">
            <ToolsRail tool={tool} onChange={setTool} />

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {tool === "brush" || tool === "eraser" ? (
                  <>
                    {tool === "brush" ? (
                      <label className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Color</span>
                        <input
                          type="color"
                          value={color}
                          onChange={(event) => setColor(event.target.value)}
                          className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                          aria-label="Brush color"
                        />
                      </label>
                    ) : null}
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Size</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={brushSize}
                        onChange={(event) => setBrushSize(Number(event.target.value))}
                        className="w-28 accent-sky-600"
                      />
                      <span className="w-8 text-xs font-semibold tabular-nums text-slate-500">{brushSize}</span>
                    </label>
                    {tool === "brush" ? (
                      <label className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Opacity</span>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={brushOpacity}
                          onChange={(event) => setBrushOpacity(Number(event.target.value))}
                          className="w-28 accent-sky-600"
                        />
                        <span className="w-8 text-xs font-semibold tabular-nums text-slate-500">{brushOpacity}%</span>
                      </label>
                    ) : null}
                  </>
                ) : tool === "bucket" ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Fill color</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                        aria-label="Fill color"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Tolerance</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={tolerance}
                        onChange={(event) => setTolerance(Number(event.target.value))}
                        className="w-28 accent-sky-600"
                      />
                      <span className="w-8 text-xs font-semibold tabular-nums text-slate-500">{tolerance}</span>
                    </label>
                  </div>
                ) : tool === "eyedropper" ? (
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                    <p className="text-xs font-semibold text-slate-700">Sampled color: {color}</p>
                  </div>
                ) : tool === "text" ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={textStyle.family}
                      onChange={(event) => setTextStyle((value) => ({ ...value, family: event.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      {FONT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Size</span>
                      <input
                        type="number"
                        min="8"
                        max="400"
                        value={textStyle.size}
                        onChange={(event) =>
                          setTextStyle((value) => ({ ...value, size: Math.max(1, Number(event.target.value)) }))
                        }
                        className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Color</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                        aria-label="Text color"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setTextStyle((value) => ({ ...value, bold: !value.bold }))}
                      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                        textStyle.bold ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextStyle((value) => ({ ...value, italic: !value.italic }))}
                      className={`rounded-xl px-3 py-2 text-xs font-bold italic transition ${
                        textStyle.italic ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      I
                    </button>
                    <p className="text-xs font-medium text-slate-500">Click the canvas to place text.</p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-500">
                    {tool === "move"
                      ? "Drag to move the active layer. Its pixels shift with the cursor."
                      : "Drag to draw a selection. Brush, eraser, and fill respect it. Press Delete to clear, Escape to deselect."}
                  </p>
                )}
              </div>

              <div
                ref={stageRef}
                className={`relative flex h-[62vh] min-h-[360px] items-center justify-center overflow-auto rounded-2xl border border-slate-200 ${CHECKER_CLASS} p-4`}
              >
                <div
                  className="relative shrink-0"
                  style={{ width: docWidth * zoom, height: docHeight * zoom }}
                >
                  <canvas
                    ref={canvasRef}
                    width={docWidth}
                    height={docHeight}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="absolute left-0 top-0 h-full w-full cursor-crosshair shadow-[0_4px_20px_rgba(15,23,42,0.12)]"
                    style={{ imageRendering: "auto", touchAction: "none" }}
                  />
                  <SelectionOverlay selection={selection} width={docWidth} height={docHeight} zoom={zoom} />
                  {textDraft ? (
                    <div
                      className="absolute z-10"
                      style={{
                        left: Math.min(textDraft.x * zoom, docWidth * zoom - 260),
                        top: Math.max(textDraft.y * zoom, 0)
                      }}
                    >
                      <div className="w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <textarea
                          autoFocus
                          value={textDraft.text}
                          onChange={(event) => setTextDraft((value) => (value ? { ...value, text: event.target.value } : value))}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setTextDraft(null);
                          }}
                          placeholder="Type text..."
                          rows={4}
                          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={commitText}
                            disabled={textDraft.text.trim() === ""}
                            className="flex-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                          >
                            Add text
                          </button>
                          <button
                            type="button"
                            onClick={() => setTextDraft(null)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <LayersPanel engine={engine} version={version} />
            </div>
          </div>
        </section>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => void handleImportFile(event.target.files?.[0] ?? null)}
        className="hidden"
      />

      {showNewDoc ? (
        <NewDocumentModal
          onSubmit={(result) => {
            engine.createDocument(result.width, result.height, result.background);
            if (result.image) {
              const layer = engine.activeLayer;
              if (layer) {
                const context = layer.canvas.getContext("2d");
                context?.drawImage(result.image, 0, 0, result.width, result.height);
                engine.emit();
              }
            }
            setZoom(1);
            setShowNewDoc(false);
          }}
          onClose={() => setShowNewDoc(false)}
        />
      ) : null}

      {showFilters ? <FilterModal engine={engine} onClose={() => setShowFilters(false)} /> : null}
    </div>
  );
}