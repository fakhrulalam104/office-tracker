"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton } from "./shared";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
type BodyType = "none" | "json" | "form" | "text";

interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface HttpResponse {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
  isJson: boolean;
}

const PRESET_TESTS = [
  { label: "POST /anything (Echo)", method: "POST" as HttpMethod, url: "https://httpbin.org/anything", bodyType: "json" as BodyType, body: '{\n  "message": "Hello from OfficeTracker",\n  "timestamp": 1700000000\n}' },
  { label: "GET /headers (Inspect)", method: "GET" as HttpMethod, url: "https://httpbin.org/headers", bodyType: "none" as BodyType, body: "" },
  { label: "Test 200 OK", method: "GET" as HttpMethod, url: "https://httpbin.org/status/200", bodyType: "none" as BodyType, body: "" },
  { label: "Test 404 Not Found", method: "GET" as HttpMethod, url: "https://httpbin.org/status/404", bodyType: "none" as BodyType, body: "" },
  { label: "Test 500 Server Error", method: "GET" as HttpMethod, url: "https://httpbin.org/status/500", bodyType: "none" as BodyType, body: "" },
  { label: "Test Delay 2s (Timeout)", method: "GET" as HttpMethod, url: "https://httpbin.org/delay/2", bodyType: "none" as BodyType, body: "" },
  { label: "Test Redirects (3x)", method: "GET" as HttpMethod, url: "https://httpbin.org/redirect/3", bodyType: "none" as BodyType, body: "" },
  { label: "Bearer Auth Test", method: "GET" as HttpMethod, url: "https://httpbin.org/bearer", bodyType: "none" as BodyType, body: "" },
];

export function ApiDebuggerTool() {
  const [method, setMethod] = useState<HttpMethod>("POST");
  const [url, setUrl] = useState("https://httpbin.org/anything");
  const [bodyType, setBodyType] = useState<BodyType>("json");
  const [bodyContent, setBodyContent] = useState('{\n  "name": "Alex Dev",\n  "role": "Engineer",\n  "active": true\n}');
  const [authType, setAuthType] = useState<"none" | "bearer" | "basic">("none");
  const [authToken, setAuthToken] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: "1", key: "Accept", value: "application/json", enabled: true },
    { id: "2", key: "User-Agent", value: "OfficeTracker-ApiDebugger/1.0", enabled: true },
  ]);
  const [params, setParams] = useState<QueryParam[]>([]);

  const [activeRequestTab, setActiveRequestTab] = useState<"body" | "headers" | "params" | "auth">("body");
  const [activeResponseTab, setActiveResponseTab] = useState<"body" | "headers" | "raw">("body");

  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addHeader = () => {
    setHeaders([...headers, { id: Math.random().toString(), key: "", value: "", enabled: true }]);
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const updateHeader = (id: string, field: "key" | "value" | "enabled", val: any) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const addParam = () => {
    setParams([...params, { id: Math.random().toString(), key: "", value: "", enabled: true }]);
  };

  const removeParam = (id: string) => {
    setParams(params.filter((p) => p.id !== id));
  };

  const updateParam = (id: string, field: "key" | "value" | "enabled", val: any) => {
    setParams(params.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const buildFullUrl = (): string => {
    try {
      const u = new URL(url.trim());
      params
        .filter((p) => p.enabled && p.key.trim())
        .forEach((p) => {
          u.searchParams.set(p.key.trim(), p.value);
        });
      return u.toString();
    } catch {
      return url.trim();
    }
  };

  const buildCurlCommand = (): string => {
    const finalUrl = buildFullUrl();
    const parts = [`curl -X ${method} "${finalUrl}"`];

    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        parts.push(`-H "${h.key.trim()}: ${h.value.replace(/"/g, '\\"')}"`);
      });

    if (authType === "bearer" && authToken) {
      parts.push(`-H "Authorization: Bearer ${authToken}"`);
    } else if (authType === "basic" && authUser) {
      parts.push(`-u "${authUser}:${authPass}"`);
    }

    if (method !== "GET" && method !== "HEAD" && bodyType !== "none" && bodyContent) {
      if (bodyType === "json") {
        parts.push(`-H "Content-Type: application/json"`);
      }
      parts.push(`-d '${bodyContent.replace(/'/g, "'\\''")}'`);
    }

    return parts.join(" \\\n  ");
  };

  async function sendRequest() {
    const finalUrl = buildFullUrl();
    if (!finalUrl) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    const reqHeaders: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => {
        reqHeaders[h.key.trim()] = h.value;
      });

    if (authType === "bearer" && authToken.trim()) {
      reqHeaders["Authorization"] = `Bearer ${authToken.trim()}`;
    } else if (authType === "basic" && (authUser || authPass)) {
      reqHeaders["Authorization"] = `Basic ${btoa(`${authUser}:${authPass}`)}`;
    }

    if (method !== "GET" && method !== "HEAD" && bodyType === "json" && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json";
    }

    const start = performance.now();

    try {
      const fetchOpts: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && bodyType !== "none" && bodyContent) {
        fetchOpts.body = bodyContent;
      }

      const res = await fetch(finalUrl, fetchOpts);
      const timeMs = Math.round(performance.now() - start);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });

      const textBody = await res.text();
      let isJson = false;
      let formattedBody = textBody;

      try {
        const parsed = JSON.parse(textBody);
        formattedBody = JSON.stringify(parsed, null, 2);
        isJson = true;
      } catch {
        // Not JSON
      }

      setResponse({
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? "OK" : ""),
        timeMs,
        sizeBytes: new Blob([textBody]).size,
        headers: respHeaders,
        body: formattedBody,
        isJson,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute request (check CORS or URL)");
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
    if (status >= 300 && status < 400) {
      return "bg-sky-100 text-sky-800 border-sky-300";
    }
    if (status >= 400 && status < 500) {
      return "bg-amber-100 text-amber-800 border-amber-300";
    }
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="space-y-6">
      <Card title="API Request Debugger & HTTP Client (httpbin)">
        <p className="text-sm text-slate-600 mb-5">
          Interactive HTTP client for testing API requests, debugging response codes, inspection of headers, payload simulation, latency testing, and curl command generation.
        </p>

        {/* Preset quick actions */}
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Preset Scenarios (httpbin.org)
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_TESTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMethod(preset.method);
                  setUrl(preset.url);
                  setBodyType(preset.bodyType);
                  setBodyContent(preset.body);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* URL and Method Bar */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              aria-label="HTTP Method"
              className="w-28 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-3 font-bold text-white outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendRequest()}
              placeholder="https://httpbin.org/anything or your custom API"
              className={inputClass}
            />
            <button
              type="button"
              onClick={sendRequest}
              disabled={loading}
              className={buttonClass + " flex items-center gap-2 px-6 py-3 shrink-0"}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </button>
          </div>

          {/* Request Config Tabs */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRequestTab("body")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeRequestTab === "body" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Body {bodyType !== "none" && "•"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRequestTab("headers")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeRequestTab === "headers" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Headers ({headers.filter((h) => h.enabled).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRequestTab("params")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeRequestTab === "params" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Params ({params.filter((p) => p.enabled).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRequestTab("auth")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeRequestTab === "auth" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Auth {authType !== "none" && "•"}
                </button>
              </div>

              <CopyButton value={buildCurlCommand()} label="Copy cURL" className="text-xs text-sky-700 hover:text-sky-900" />
            </div>

            <div className="pt-4">
              {activeRequestTab === "body" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">Body Type:</span>
                    {(["none", "json", "form", "text"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="bodyType"
                          checked={bodyType === t}
                          onChange={() => setBodyType(t)}
                        />
                        {t.toUpperCase()}
                      </label>
                    ))}
                  </div>
                  {bodyType !== "none" && (
                    <textarea
                      value={bodyContent}
                      onChange={(e) => setBodyContent(e.target.value)}
                      rows={6}
                      placeholder={bodyType === "json" ? '{\n  "key": "value"\n}' : "key=value&foo=bar"}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-800 outline-none focus:border-sky-300"
                    />
                  )}
                </div>
              )}

              {activeRequestTab === "headers" && (
                <div className="space-y-2">
                  {headers.map((h) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) => updateHeader(h.id, "enabled", e.target.checked)}
                      />
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                        placeholder="Header Key (e.g. Authorization)"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                        placeholder="Header Value"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(h.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHeader}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 pt-1"
                  >
                    + Add Header
                  </button>
                </div>
              )}

              {activeRequestTab === "params" && (
                <div className="space-y-2">
                  {params.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) => updateParam(p.id, "enabled", e.target.checked)}
                      />
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => updateParam(p.id, "key", e.target.value)}
                        placeholder="Parameter Name"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => updateParam(p.id, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeParam(p.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addParam}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 pt-1"
                  >
                    + Add Query Parameter
                  </button>
                </div>
              )}

              {activeRequestTab === "auth" && (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {(["none", "bearer", "basic"] as const).map((a) => (
                      <label key={a} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="authType"
                          checked={authType === a}
                          onChange={() => setAuthType(a)}
                        />
                        {a === "none" ? "No Auth" : a === "bearer" ? "Bearer Token" : "Basic Auth"}
                      </label>
                    ))}
                  </div>

                  {authType === "bearer" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Token</label>
                      <input
                        type="password"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {authType === "basic" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
                        <input
                          type="text"
                          value={authUser}
                          onChange={(e) => setAuthUser(e.target.value)}
                          placeholder="admin"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
                        <input
                          type="password"
                          value={authPass}
                          onChange={(e) => setAuthPass(e.target.value)}
                          placeholder="secret"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Request Error
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {/* Response Panel */}
        {response && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-xl border px-3 py-1 font-mono text-sm font-bold shadow-sm ${getStatusBadge(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ⏱️ {response.timeMs}ms
                </span>
                <span className="text-xs font-medium text-slate-500">
                  📦 {response.sizeBytes} bytes
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResponseTab("body")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activeResponseTab === "body" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Response Body
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResponseTab("headers")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activeResponseTab === "headers" ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Headers ({Object.keys(response.headers).length})
                </button>
              </div>
            </div>

            {activeResponseTab === "body" && (
              <OutputBox value={response.body} label="Response Body" />
            )}

            {activeResponseTab === "headers" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Header</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {Object.entries(response.headers).map(([k, v], i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2 font-bold text-sky-700">{k}</td>
                        <td className="px-4 py-2 text-slate-800 break-all">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
