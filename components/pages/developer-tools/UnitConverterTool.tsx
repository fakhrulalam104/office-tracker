"use client";

import { useMemo, useState } from "react";
import { Card, inputClass } from "./shared";

type Category = "length" | "weight" | "temperature" | "data" | "time";

const conversions: Record<Category, { label: string; units: { key: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  length: {
    label: "Length",
    units: [
      { key: "mm", label: "Millimeters", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { key: "cm", label: "Centimeters", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { key: "m", label: "Meters", toBase: (v) => v, fromBase: (v) => v },
      { key: "km", label: "Kilometers", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { key: "in", label: "Inches", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { key: "ft", label: "Feet", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { key: "yd", label: "Yards", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { key: "mi", label: "Miles", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ]
  },
  weight: {
    label: "Weight",
    units: [
      { key: "mg", label: "Milligrams", toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
      { key: "g", label: "Grams", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { key: "kg", label: "Kilograms", toBase: (v) => v, fromBase: (v) => v },
      { key: "oz", label: "Ounces", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      { key: "lb", label: "Pounds", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { key: "t", label: "Metric Tons", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ]
  },
  temperature: {
    label: "Temperature",
    units: [
      { key: "c", label: "Celsius", toBase: (v) => v, fromBase: (v) => v },
      { key: "f", label: "Fahrenheit", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { key: "k", label: "Kelvin", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ]
  },
  data: {
    label: "Data Size",
    units: [
      { key: "b", label: "Bytes", toBase: (v) => v, fromBase: (v) => v },
      { key: "kb", label: "Kilobytes", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { key: "mb", label: "Megabytes", toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
      { key: "gb", label: "Gigabytes", toBase: (v) => v * 1024 * 1024 * 1024, fromBase: (v) => v / (1024 * 1024 * 1024) },
      { key: "tb", label: "Terabytes", toBase: (v) => v * 1024 * 1024 * 1024 * 1024, fromBase: (v) => v / (1024 * 1024 * 1024 * 1024) },
      { key: "bit", label: "Bits", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    ]
  },
  time: {
    label: "Time",
    units: [
      { key: "ms", label: "Milliseconds", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { key: "s", label: "Seconds", toBase: (v) => v, fromBase: (v) => v },
      { key: "min", label: "Minutes", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { key: "hr", label: "Hours", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { key: "day", label: "Days", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { key: "wk", label: "Weeks", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    ]
  }
};

const categories: { key: Category; label: string }[] = [
  { key: "length", label: "Length" },
  { key: "weight", label: "Weight" },
  { key: "temperature", label: "Temperature" },
  { key: "data", label: "Data" },
  { key: "time", label: "Time" }
];

export function UnitConverterTool() {
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState("km");
  const [toUnit, setToUnit] = useState("mi");
  const [value, setValue] = useState("1");

  const cat = conversions[category];
  const numValue = parseFloat(value) || 0;

  const result = useMemo(() => {
    const from = cat.units.find((u) => u.key === fromUnit);
    const to = cat.units.find((u) => u.key === toUnit);
    if (!from || !to) return "0";
    const base = from.toBase(numValue);
    return to.fromBase(base).toPrecision(10).replace(/\.?0+$/, "");
  }, [cat, fromUnit, toUnit, numValue]);

  function swap() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c.key} type="button" onClick={() => { setCategory(c.key); setFromUnit(conversions[c.key].units[0].key); setToUnit(conversions[c.key].units[1]?.key ?? conversions[c.key].units[0].key); }}
            className={category === c.key ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"}>
            {c.label}
          </button>
        ))}
      </div>
      <Card title={cat.label + " Conversion"}>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">From</span>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={"mt-1 " + inputClass}>
              {cat.units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
            </select>
            <input value={value} onChange={(e) => setValue(e.target.value)} className={"mt-2 " + inputClass} />
          </label>
          <button type="button" onClick={swap} className="mb-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-700 hover:bg-slate-50">Swap</button>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">To</span>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={"mt-1 " + inputClass}>
              {cat.units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
            </select>
            <div className={"mt-2 " + inputClass + " bg-slate-50"}>{result}</div>
          </label>
        </div>
      </Card>
    </div>
  );
}
