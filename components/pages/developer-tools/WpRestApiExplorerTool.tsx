"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

const COMMON_ENDPOINTS = [
  { path: "/wp-json/wp/v2/posts", label: "Posts" },
  { path: "/wp-json/wp/v2/pages", label: "Pages" },
  { path: "/wp-json/wp/v2/media", label: "Media" },
  { path: "/wp-json/wp/v2/categories", label: "Categories" },
  { path: "/wp-json/wp/v2/tags", label: "Tags" },
  { path: "/wp-json/wp/v2/users", label: "Users" },
  { path: "/wp-json/wp/v2/comments", label: "Comments" },
  { path: "/wp-json/wp/v2/types", label: "Post Types" },
  { path: "/wp-json/wp/v2/taxonomies", label: "Taxonomies" },
];

export function WpRestApiExplorerTool() {
  const [siteUrl, setSiteUrl] = useState("https://example.com");
  const [endpoint, setEndpoint] = useState("/wp-json/wp/v2/posts");
  const [params, setParams] = useState("per_page=5&_embed");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchEndpoint() {
    setLoading(true);
    setError("");
    setResponse("");
    
    try {
      const url = new URL(endpoint, siteUrl);
      if (params) {
        params.split("&").forEach((param) => {
          const [key, value] = param.split("=");
          if (key) url.searchParams.set(key, value || "");
        });
      }
      
      const res = await fetch(url.toString());
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch endpoint");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card title="WP REST API Explorer">
        <p className="text-sm text-slate-600 mb-4">
          Browse and test WordPress REST API endpoints. Enter a site URL and endpoint to explore the JSON response.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Site URL</label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Endpoint</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className={inputClass}
              placeholder="/wp-json/wp/v2/posts"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Query Parameters</label>
            <input
              type="text"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className={inputClass}
              placeholder="per_page=5&_embed"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Quick Endpoints</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ENDPOINTS.map((ep) => (
                <button
                  key={ep.path}
                  type="button"
                  onClick={() => setEndpoint(ep.path)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  {ep.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={fetchEndpoint} disabled={loading} className={buttonClass}>
              {loading ? "Fetching..." : "Fetch Endpoint"}
            </button>
            <button type="button" onClick={() => { setResponse(""); setError(""); }} className={softButtonClass}>
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
      </Card>

      <OutputBox value={response} label="JSON Response" />
    </div>
  );
}