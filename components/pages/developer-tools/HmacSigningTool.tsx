"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, textAreaClass, inputClass, buttonClass } from "./shared";

async function hmacSign(message: string, secret: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function HmacSigningTool() {
  const [message, setMessage] = useState("Hello, World!");
  const [secret, setSecret] = useState("my-secret-key");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sign() {
    setLoading(true);
    try {
      const sig = await hmacSign(message, secret, algorithm);
      setOutput(JSON.stringify({ algorithm, signature: sig }, null, 2));
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Signing failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="HMAC Signing">
        <label className="block text-sm font-semibold text-slate-700">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={`mt-2 min-h-32 ${textAreaClass}`} />
        <label className="mt-4 block text-sm font-semibold text-slate-700">Secret key</label>
        <input value={secret} onChange={(e) => setSecret(e.target.value)} className={`mt-2 ${inputClass}`} />
        <label className="mt-4 block text-sm font-semibold text-slate-700">Algorithm</label>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className={`mt-2 ${inputClass}`}>
          <option>HMAC-SHA-1</option>
          <option>HMAC-SHA-256</option>
          <option>HMAC-SHA-384</option>
          <option>HMAC-SHA-512</option>
        </select>
        <button type="button" onClick={() => void sign()} disabled={loading} className={`mt-4 w-full ${buttonClass}`}>
          {loading ? "Signing..." : "Sign message"}
        </button>
      </Card>
      <OutputBox value={output} label="HMAC signature" />
    </div>
  );
}
