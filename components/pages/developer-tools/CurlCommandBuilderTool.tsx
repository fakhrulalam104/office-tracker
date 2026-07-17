"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, textAreaClass, buttonClass, softButtonClass, copyText } from "./shared";

interface CurlConfig {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  auth: string;
  authType: "basic" | "bearer";
  body: string;
  followRedirects: boolean;
  insecure: boolean;
}

function generateCurlCommand(config: CurlConfig): string {
  const parts = ["curl"];
  
  if (config.method !== "GET") {
    parts.push(`-X ${config.method}`);
  }
  
  if (config.followRedirects) {
    parts.push("-L");
  }
  
  if (config.insecure) {
    parts.push("-k");
  }
  
  if (config.auth) {
    if (config.authType === "basic") {
      parts.push(`-u "${config.auth}"`);
    } else {
      parts.push(`-H "Authorization: Bearer ${config.auth}"`);
    }
  }
  
  for (const header of config.headers) {
    if (header.key && header.value) {
      parts.push(`-H "${header.key}: ${header.value}"`);
    }
  }
  
  if (config.body && ["POST", "PUT", "PATCH"].includes(config.method)) {
    parts.push(`-d '${config.body}'`);
  }
  
  parts.push(`"${config.url}"`);
  
  return parts.join(" \\\n  ");
}

function parseCurlCommand(curl: string): Partial<CurlConfig> | null {
  try {
    const config: Partial<CurlConfig> = {
      method: "GET",
      headers: [],
      followRedirects: false,
      insecure: false,
      authType: "basic",
    };
    
    // Extract URL
    const urlMatch = curl.match(/["'](https?:\/\/[^"']+)["']/);
    if (urlMatch) config.url = urlMatch[1];
    
    // Extract method
    const methodMatch = curl.match(/-X\s+(\w+)/);
    if (methodMatch) config.method = methodMatch[1];
    
    // Extract headers
    const headerRegex = /-H\s+["']([^"']+)["']/g;
    let match;
    while ((match = headerRegex.exec(curl)) !== null) {
      const [key, value] = match[1].split(": ").map((s) => s.trim());
      if (key && value) {
        config.headers!.push({ key, value });
      }
    }
    
    // Extract body
    const bodyMatch = curl.match(/-d\s+["'](.+?)["']/s);
    if (bodyMatch) config.body = bodyMatch[1];
    
    // Check flags
    if (curl.includes("-L")) config.followRedirects = true;
    if (curl.includes("-k")) config.insecure = true;
    
    // Extract auth
    const basicAuthMatch = curl.match(/-u\s+["']([^"']+)["']/);
    if (basicAuthMatch) {
      config.auth = basicAuthMatch[1];
      config.authType = "basic";
    }
    
    const bearerMatch = curl.match(/Authorization:\s*Bearer\s+(\S+)/);
    if (bearerMatch) {
      config.auth = bearerMatch[1];
      config.authType = "bearer";
    }
    
    return config;
  } catch {
    return null;
  }
}

export function CurlCommandBuilderTool() {
  const [mode, setMode] = useState<"builder" | "parser">("builder");
  const [config, setConfig] = useState<CurlConfig>({
    method: "GET",
    url: "https://api.example.com/v1/posts",
    headers: [{ key: "Content-Type", value: "application/json" }],
    auth: "",
    authType: "basic",
    body: "",
    followRedirects: true,
    insecure: false,
  });
  const [curlInput, setCurlInput] = useState("");
  const [parsedConfig, setParsedConfig] = useState<Partial<CurlConfig> | null>(null);

  function updateConfig(key: keyof CurlConfig, value: string | boolean | { key: string; value: string }[]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function addHeader() {
    updateConfig("headers", [...config.headers, { key: "", value: "" }]);
  }

  function updateHeader(index: number, key: "key" | "value", value: string) {
    const newHeaders = [...config.headers];
    newHeaders[index] = { ...newHeaders[index], [key]: value };
    updateConfig("headers", newHeaders);
  }

  function removeHeader(index: number) {
    updateConfig("headers", config.headers.filter((_, i) => i !== index));
  }

  function parseInput() {
    const parsed = parseCurlCommand(curlInput);
    setParsedConfig(parsed);
    if (parsed) {
      setConfig({
        method: parsed.method || "GET",
        url: parsed.url || "",
        headers: parsed.headers || [],
        auth: parsed.auth || "",
        authType: parsed.authType || "basic",
        body: parsed.body || "",
        followRedirects: parsed.followRedirects || false,
        insecure: parsed.insecure || false,
      });
      setMode("builder");
    }
  }

  const output = mode === "builder" ? generateCurlCommand(config) : (parsedConfig ? generateCurlCommand(config as CurlConfig) : "");

  return (
    <div className="space-y-5">
      <Card title="cURL Command Builder">
        <p className="text-sm text-slate-600 mb-4">
          Build curl commands from form inputs or parse existing curl commands into readable request breakdowns.
        </p>
        
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("builder")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
              mode === "builder" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setMode("parser")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
              mode === "parser" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Parse cURL
          </button>
        </div>

        {mode === "builder" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Method</label>
                <select value={config.method} onChange={(e) => updateConfig("method", e.target.value)} className={inputClass}>
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">URL</label>
                <input type="url" value={config.url} onChange={(e) => updateConfig("url", e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Headers</label>
                <button type="button" onClick={addHeader} className="text-xs text-sky-700 hover:text-sky-900">+ Add Header</button>
              </div>
              <div className="space-y-2">
                {config.headers.map((header, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={header.key} onChange={(e) => updateHeader(i, "key", e.target.value)} className={inputClass} placeholder="Header name" />
                    <input type="text" value={header.value} onChange={(e) => updateHeader(i, "value", e.target.value)} className={inputClass} placeholder="Value" />
                    <button type="button" onClick={() => removeHeader(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Auth Type</label>
                <select value={config.authType} onChange={(e) => updateConfig("authType", e.target.value)} className={inputClass}>
                  <option value="basic">Basic Auth (user:pass)</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Credentials</label>
                <input type="text" value={config.auth} onChange={(e) => updateConfig("auth", e.target.value)} className={inputClass} placeholder={config.authType === "basic" ? "user:pass" : "token"} />
              </div>
            </div>

            {["POST", "PUT", "PATCH"].includes(config.method) && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Request Body</label>
                <textarea value={config.body} onChange={(e) => updateConfig("body", e.target.value)} className={textAreaClass} placeholder='{"key": "value"}' />
              </div>
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.followRedirects} onChange={(e) => updateConfig("followRedirects", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
                <span className="text-sm text-slate-700">Follow redirects (-L)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.insecure} onChange={(e) => updateConfig("insecure", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
                <span className="text-sm text-slate-700">Insecure (-k)</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Paste cURL Command</label>
              <textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                className={textAreaClass}
                placeholder="curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{&quot;key&quot;: &quot;value&quot;}'"
              />
            </div>
            <button type="button" onClick={parseInput} className={buttonClass}>
              Parse cURL Command
            </button>
          </div>
        )}
      </Card>

      <OutputBox value={output} label="Generated cURL Command" />
    </div>
  );
}