"use client";

import { useState } from "react";
import { Card, OutputBox, buttonClass, copyText, CopyButton } from "./shared";

const SALT_KEYS = [
  "AUTH_KEY",
  "SECURE_AUTH_KEY",
  "LOGGED_IN_KEY",
  "NONCE_KEY",
  "AUTH_SALT",
  "SECURE_AUTH_SALT",
  "LOGGED_IN_SALT",
  "NONCE_SALT",
];

function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=[]{}|;:,.<>?`~";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function generateSalts(): Record<string, string> {
  const salts: Record<string, string> = {};
  for (const key of SALT_KEYS) {
    salts[key] = generateRandomString(64);
  }
  return salts;
}

function formatAsPhpDefines(salts: Record<string, string>): string {
  return Object.entries(salts)
    .map(([key, value]) => `define('${key}', '${value}');`)
    .join("\n");
}

function formatAsJson(salts: Record<string, string>): string {
  return JSON.stringify(salts, null, 2);
}

export function WpSaltsGeneratorTool() {
  const [salts, setSalts] = useState<Record<string, string>>(generateSalts);
  const [format, setFormat] = useState<"php" | "json">("php");

  function regenerate() {
    setSalts(generateSalts());
  }

  const output = format === "php" ? formatAsPhpDefines(salts) : formatAsJson(salts);

  return (
    <div className="space-y-5">
      <Card title="WP Salts/Keys Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate the 8 unique security keys for <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">wp-config.php</code>. These keys add an extra layer of encryption to the information stored in your cookies.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button type="button" onClick={regenerate} className={buttonClass}>
            Regenerate All
          </button>
          <div className="flex rounded-full border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setFormat("php")}
              className={`px-4 py-2 text-sm font-semibold transition ${format === "php" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              PHP Defines
            </button>
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={`px-4 py-2 text-sm font-semibold transition ${format === "json" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              JSON
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SALT_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-32 truncate" title={key}>{key}</span>
              <code className="flex-1 truncate rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700" title={salts[key]}>
                {salts[key].substring(0, 32)}...
              </code>
              <CopyButton value={salts[key]} label="Copy" copiedLabel="✓ Copied" className="text-xs text-sky-700 hover:text-sky-900" />
            </div>
          ))}
        </div>
      </Card>

      <OutputBox value={output} label={format === "php" ? "PHP Define Block" : "JSON"} />
    </div>
  );
}