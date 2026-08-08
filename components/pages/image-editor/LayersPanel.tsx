"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorEngine } from "./engine";
import { BLEND_MODES, type BlendMode } from "./types";

type LayersPanelProps = {
  engine: EditorEngine;
  version: number;
};

function LayerThumbnail({ engine, layerId, version }: { engine: EditorEngine; layerId: string; version: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const layer = engine.layers.find((item) => item.id === layerId);
    if (!canvas || !layer) return;

    const thumb = canvas.getContext("2d");
    if (!thumb) return;
    const targetWidth = 56;
    const targetHeight = 42;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    thumb.clearRect(0, 0, targetWidth, targetHeight);
    thumb.imageSmoothingEnabled = true;
    thumb.drawImage(layer.canvas, 0, 0, targetWidth, targetHeight);
  }, [engine, layerId, version]);

  return <canvas ref={ref} className="h-[42px] w-[56px] rounded border border-slate-200 bg-slate-50" />;
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      {visible ? <circle cx="12" cy="12" r="2.5" /> : <path d="M4 4l16 16" />}
    </svg>
  );
}

function ChevronRight({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-3.5 w-3.5 ${up ? "-rotate-90" : "rotate-90"}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function LayersPanel({ engine, version }: LayersPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const topFirstLayers = [...engine.layers].reverse();
  const activeLayer = engine.activeLayer;
  void version;

  useEffect(() => {
    if (!renamingId) return;
    setRenameValue(engine.layers.find((layer) => layer.id === renamingId)?.name ?? "");
  }, [renamingId, engine]);

  function commitRename() {
    if (renamingId) {
      engine.renameLayer(renamingId, renameValue);
    }
    setRenamingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Layers</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Layer stack</h2>
        </div>
        <button
          type="button"
          onClick={() => engine.addLayer("New Layer")}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          + Add
        </button>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Top</span>
        <span>{engine.layers.length} layer{engine.layers.length !== 1 ? "s" : ""}</span>
        <span>Bottom</span>
      </div>

      <div className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-0.5">
        {topFirstLayers.map((layer) => {
          const isActive = activeLayer ? layer.id === activeLayer.id : false;
          return (
            <div
              key={layer.id}
              onClick={() => engine.setActiveLayer(layer.id)}
              className={`cursor-pointer rounded-2xl border px-2.5 py-2 transition hover:border-sky-200 ${
                isActive ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                  onClick={(event) => {
                    event.stopPropagation();
                    engine.setLayerVisibility(layer.id, !layer.visible);
                  }}
                  className={`rounded p-1 transition ${layer.visible ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-slate-500"}`}
                >
                  <EyeIcon visible={layer.visible} />
                </button>
                <LayerThumbnail engine={engine} layerId={layer.id} version={version} />
                <div className="min-w-0 flex-1">
                  {renamingId === layer.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename();
                        if (event.key === "Escape") setRenamingId(null);
                      }}
                      onFocus={(event) => event.currentTarget.select()}
                      onClick={(event) => event.stopPropagation()}
                      className="w-full rounded-lg border border-sky-300 px-1.5 py-0.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  ) : (
                    <p
                      title="Double-click to rename"
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        setRenamingId(layer.id);
                      }}
                      className="truncate text-xs font-semibold text-slate-800"
                    >
                      {layer.name}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {layer.blendMode} &middot; {Math.round(layer.opacity)}%
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    title="Move up"
                    disabled={layer.id === engine.layers[engine.layers.length - 1]?.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      engine.moveLayer(layer.id, 1);
                    }}
                    className="rounded-md p-1 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight up />
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    disabled={layer.id === engine.layers[0]?.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      engine.moveLayer(layer.id, -1);
                    }}
                    className="rounded-md p-1 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight up={false} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    title="Duplicate layer"
                    onClick={(event) => {
                      event.stopPropagation();
                      engine.duplicateLayer(layer.id);
                    }}
                    className="rounded-md px-1 py-0.5 text-[11px] font-bold text-slate-500 transition hover:bg-white hover:text-sky-700"
                  >
                    D
                  </button>
                  <button
                    type="button"
                    title="Delete layer"
                    onClick={(event) => {
                      event.stopPropagation();
                      engine.deleteLayer(layer.id);
                    }}
                    className="rounded-md px-1 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-white hover:text-rose-600"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeLayer ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-3">
          <label className="block">
            <span className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
              <span>Opacity</span>
              <span>{Math.round(activeLayer.opacity)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={activeLayer.opacity}
              onChange={(event) => engine.setLayerOpacity(activeLayer.id, Number(event.target.value))}
              className="mt-2 w-full accent-sky-600"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Blend mode</span>
            <select
              value={activeLayer.blendMode}
              onChange={(event) => engine.setLayerBlendMode(activeLayer.id, event.target.value as BlendMode)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {BLEND_MODES.map((blendMode) => (
                <option key={blendMode} value={blendMode}>
                  {blendMode === "normal" ? "Normal" : blendMode}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <p className="text-[11px] leading-5 text-slate-400">
        Double-click a layer name to rename it. D duplicates, X deletes. Layer order runs top to bottom.
      </p>
    </div>
  );
}