"use client";

import { useRef, useState } from "react";
import { fitDimensions } from "./engine";
import { loadImageFromFile } from "./tools";
import type { DocumentBackground } from "./types";

type NewDocumentModalProps = {
  onSubmit: (result: {
    width: number;
    height: number;
    background: DocumentBackground;
    image: HTMLImageElement | null;
  }) => void;
  onClose: () => void;
};

const PRESETS = [
  { label: "Square 1:1", width: 1024, height: 1024 },
  { label: "Landscape 16:9", width: 1600, height: 900 },
  { label: "A4", width: 1240, height: 1754 },
  { label: "Social 1080x1080", width: 1080, height: 1080 },
  { label: "Banner 1200x300", width: 1200, height: 300 },
  { label: "Photo 1200x800", width: 1200, height: 800 }
];

export function NewDocumentModal({ onSubmit, onClose }: NewDocumentModalProps) {
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [background, setBackground] = useState<DocumentBackground>("white");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setWidth(preset.width);
    setHeight(preset.height);
  }

  function submitBlank() {
    const w = Math.round(width);
    const h = Math.round(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 4096 || h > 4096) {
      setError("Enter dimensions between 1 and 4096 px.");
      return;
    }
    setError(null);
    onSubmit({ width: w, height: h, background, image: null });
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    try {
      const loaded = await loadImageFromFile(file);
      const normalized = fitDimensions(loaded.width, loaded.height, 4096, 4096);
      onSubmit({
        width: normalized.width,
        height: normalized.height,
        background: "transparent",
        image: loaded.image
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that image.");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 px-4 py-6">
      <div className="mx-auto max-w-[560px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Image Editor</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">New document or open image</h2>
            <p className="mt-1 text-sm text-slate-500">Create a blank canvas or start from an image file.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Blank canvas</h3>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-600">Width (px)</span>
              <input
                type="number"
                min="1"
                max="4096"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-600">Height (px)</span>
              <input
                type="number"
                min="1"
                max="4096"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-slate-600">Background</legend>
              <div className="mt-1.5 flex gap-2">
                {(["white", "transparent"] as const).map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition ${
                      background === option ? "border-sky-400 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="background"
                      value={option}
                      checked={background === option}
                      onChange={() => setBackground(option)}
                      className="accent-sky-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={submitBlank}
              className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create canvas
            </button>
          </section>

          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50">
            <h3 className="text-sm font-semibold text-slate-900">Open an image</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use a PNG, JPEG, WebP, or GIF as the starting document. The canvas is sized to the image.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </section>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      </div>
    </div>
  );
}