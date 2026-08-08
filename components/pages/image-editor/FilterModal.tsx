"use client";

import { useState } from "react";
import { applyFilterToLayer } from "./tools";
import type { EditorEngine } from "./engine";
import type { FilterId } from "./types";

type FilterModalProps = {
  engine: EditorEngine;
  onClose: () => void;
};

const filters: { id: FilterId; label: string; description: string }[] = [
  { id: "grayscale", label: "Grayscale", description: "Desaturate the active layer." },
  { id: "invert", label: "Invert", description: "Flip every color channel to its opposite." },
  { id: "brightness", label: "Brightness", description: "Lighten or darken by -100 to 100." },
  { id: "contrast", label: "Contrast", description: "Adjust tonal contrast by -100 to 100." },
  { id: "box-blur", label: "Box Blur", description: "Two-pass horizontal + vertical blur." }
];

export function FilterModal({ engine, onClose }: FilterModalProps) {
  const [selected, setSelected] = useState<FilterId>("brightness");
  const [amount, setAmount] = useState(30);

  const activeLayer = engine.activeLayer;
  const currentFilter = filters.find((filter) => filter.id === selected) ?? filters[0];

  function applyFilter() {
    if (!activeLayer) return;
    engine.pushHistory();
    applyFilterToLayer(engine, activeLayer, selected, amount);
    onClose();
  }

  function amountBounds() {
    if (selected === "box-blur") return { min: 1, max: 20, step: 1, suffix: " px" };
    if (selected === "brightness" || selected === "contrast") return { min: -100, max: 100, step: 1, suffix: "" };
    return { min: 0, max: 100, step: 1, suffix: "" };
  }

  const bounds = amountBounds();

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 px-4 py-6">
      <div className="mx-auto max-w-[520px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Apply to active layer</h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeLayer ? `Target: ${activeLayer.name}` : "No active layer."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setSelected(filter.id);
                setAmount(filter.id === "grayscale" || filter.id === "invert" ? 100 : filter.id === "box-blur" ? 4 : 30);
              }}
              className={`rounded-2xl border p-3 text-left transition ${
                selected === filter.id ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-900">{filter.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">{filter.description}</span>
            </button>
          ))}
        </div>

        {selected === "brightness" || selected === "contrast" || selected === "box-blur" ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>{currentFilter.label} amount</span>
                <span>
                  {amount}
                  {bounds.suffix}
                </span>
              </span>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="mt-3 w-full accent-sky-600"
              />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          onClick={applyFilter}
          disabled={!activeLayer}
          className="mt-5 w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply {currentFilter.label}
        </button>
      </div>
    </div>
  );
}