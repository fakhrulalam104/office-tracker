"use client";

import { useState } from "react";
import { Card, inputClass, buttonClass, softButtonClass } from "./shared";

interface MetaConfig {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
}

function FacebookPreview({ config }: { config: MetaConfig }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
      {config.image && (
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={config.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="p-3">
        <div className="text-xs text-gray-500 uppercase">{new URL(config.url || "https://example.com").hostname}</div>
        <div className="font-bold text-sm text-gray-900 mt-1 line-clamp-2">{config.title || "Page Title"}</div>
        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{config.description || "Page description will appear here..."}</div>
      </div>
    </div>
  );
}

function TwitterPreview({ config }: { config: MetaConfig }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white max-w-md">
      {config.image && (
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={config.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 line-clamp-2">{config.title || "Page Title"}</div>
        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{config.description || "Page description..."}</div>
        <div className="text-xs text-gray-400 mt-2">{new URL(config.url || "https://example.com").hostname}</div>
      </div>
    </div>
  );
}

function LinkedInPreview({ config }: { config: MetaConfig }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
      {config.image && (
        <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={config.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">{new URL(config.url || "https://example.com").hostname}</div>
        <div className="font-bold text-sm text-gray-900 mt-1">{config.title || "Page Title"}</div>
        <div className="text-xs text-gray-600 mt-1 line-clamp-3">{config.description || "Page description..."}</div>
      </div>
    </div>
  );
}

function SlackPreview({ config }: { config: MetaConfig }) {
  return (
    <div className="border-l-4 border-green-500 rounded-r-lg overflow-hidden bg-white max-w-md">
      <div className="p-3">
        <div className="font-bold text-sm text-gray-900">{config.title || "Page Title"}</div>
        <div className="text-xs text-gray-600 mt-1 line-clamp-3">{config.description || "Page description..."}</div>
        <div className="text-xs text-gray-400 mt-2">{new URL(config.url || "https://example.com").hostname}</div>
      </div>
      {config.image && (
        <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={config.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
    </div>
  );
}

export function MetaTagPreviewTool() {
  const [config, setConfig] = useState<MetaConfig>({
    title: "My Awesome Page Title",
    description: "This is a description of my page that will appear in social media previews. Keep it under 160 characters for best results.",
    url: "https://example.com/page",
    image: "https://picsum.photos/1200/630",
    siteName: "My Website",
  });
  const [activePreview, setActivePreview] = useState<"facebook" | "twitter" | "linkedin" | "slack">("facebook");

  function updateConfig(key: keyof MetaConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const previewComponents = {
    facebook: FacebookPreview,
    twitter: TwitterPreview,
    linkedin: LinkedInPreview,
    slack: SlackPreview,
  };

  const PreviewComponent = previewComponents[activePreview];

  return (
    <div className="space-y-5">
      <Card title="Meta Tag / Open Graph Preview">
        <p className="text-sm text-slate-600 mb-4">
          Preview how your pages will render on Facebook, Twitter/X, LinkedIn, and Slack. Catch issues before sharing.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
            <input type="text" value={config.title} onChange={(e) => updateConfig("title", e.target.value)} className={inputClass} />
            <div className="text-xs text-slate-400 mt-1">{config.title.length}/60 characters</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">URL</label>
            <input type="url" value={config.url} onChange={(e) => updateConfig("url", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => updateConfig("description", e.target.value)}
              className="min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
            <div className="text-xs text-slate-400 mt-1">{config.description.length}/160 characters</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Image URL</label>
            <input type="url" value={config.image} onChange={(e) => updateConfig("image", e.target.value)} className={inputClass} placeholder="https://..." />
            <div className="text-xs text-slate-400 mt-1">Recommended: 1200x630px</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Site Name</label>
            <input type="text" value={config.siteName} onChange={(e) => updateConfig("siteName", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Warnings</label>
          <div className="space-y-1">
            {config.title.length > 60 && <div className="text-xs text-amber-600">Title is too long ({config.title.length} chars, max 60)</div>}
            {config.description.length > 160 && <div className="text-xs text-amber-600">Description is too long ({config.description.length} chars, max 160)</div>}
            {!config.image && <div className="text-xs text-red-600">Missing og:image - shared links will have no preview image</div>}
          </div>
        </div>
      </Card>

      <Card title="Preview">
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(previewComponents) as Array<keyof typeof previewComponents>).map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setActivePreview(platform)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition capitalize ${
                activePreview === platform ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center p-4 bg-slate-100 rounded-xl">
          <PreviewComponent config={config} />
        </div>
      </Card>
    </div>
  );
}