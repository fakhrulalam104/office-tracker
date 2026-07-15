"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, buttonClass, softButtonClass, smallInputClass, copyText } from "./shared";

function generatePassword(length: number, options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }) {
  let chars = "";
  if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

function getStrengthscore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return score;
}

function strengthLabel(score: number) {
  if (score <= 2) return { label: "Weak", color: "text-red-600 bg-red-50" };
  if (score <= 4) return { label: "Fair", color: "text-amber-600 bg-amber-50" };
  return { label: "Strong", color: "text-emerald-600 bg-emerald-50" };
}

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const generated = useMemo(() => {
    if (!password) return "";
    return password;
  }, [password]);

  const strength = useMemo(() => strengthLabel(getStrengthscore(generated)), [generated]);

  function generate() {
    setPassword(generatePassword(length, { upper, lower, numbers, symbols }));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Password Options">
        <label className="block">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Length</span>
            <span className="font-mono">{length}</span>
          </span>
          <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="mt-2 w-full accent-sky-600" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Uppercase", value: upper, set: setUpper },
            { label: "Lowercase", value: lower, set: setLower },
            { label: "Numbers", value: numbers, set: setNumbers },
            { label: "Symbols", value: symbols, set: setSymbols }
          ].map((opt) => (
            <label key={opt.label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition cursor-pointer ${opt.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
              <input type="checkbox" checked={opt.value} onChange={(e) => opt.set(e.target.checked)} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </div>
        <button type="button" onClick={generate} className={`mt-4 w-full ${buttonClass}`}>
          Generate password
        </button>
      </Card>
      <OutputBox value={generated} label="Generated password" />
    </div>
  );
}
