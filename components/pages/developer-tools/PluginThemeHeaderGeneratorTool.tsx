"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface HeaderConfig {
  type: "plugin" | "theme";
  name: string;
  uri: string;
  description: string;
  version: string;
  author: string;
  authorUri: string;
  license: string;
  licenseUri: string;
  textDomain: string;
  domainPath: string;
  requiresPhp: string;
  requiresWp: string;
  testedWp: string;
  updateUri: string;
  tags: string;
}

function generatePluginHeader(config: HeaderConfig): string {
  return `<?php
/**
 * Plugin Name: ${config.name}
 * Plugin URI: ${config.uri}
 * Description: ${config.description}
 * Version: ${config.version}
 * Author: ${config.author}
 * Author URI: ${config.authorUri}
 * License: ${config.license}
 * License URI: ${config.licenseUri}
 * Text Domain: ${config.textDomain}
 * Domain Path: ${config.domainPath}
 * Requires at least: ${config.requiresWp}
 * Requires PHP: ${config.requiresPhp}
 * Tested up to: ${config.testedWp}
 * Update URI: ${config.updateUri}
 * Tags: ${config.tags}
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Plugin constants
define( 'MY_PLUGIN_VERSION', '${config.version}' );
define( 'MY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );`;
}

function generateThemeHeader(config: HeaderConfig): string {
  return `/*
Theme Name: ${config.name}
Theme URI: ${config.uri}
Author: ${config.author}
Author URI: ${config.authorUri}
Description: ${config.description}
Version: ${config.version}
License: ${config.license}
License URI: ${config.licenseUri}
Text Domain: ${config.textDomain}
Domain Path: ${config.domainPath}
Tags: ${config.tags}
Requires at least: ${config.requiresWp}
Requires PHP: ${config.requiresPhp}
Tested up to: ${config.testedWp}
*/`;
}

export function PluginThemeHeaderGeneratorTool() {
  const [config, setConfig] = useState<HeaderConfig>({
    type: "plugin",
    name: "My Custom Plugin",
    uri: "https://example.com",
    description: "A short description of what the plugin does.",
    version: "1.0.0",
    author: "Your Name",
    authorUri: "https://example.com",
    license: "GPL v2 or later",
    licenseUri: "https://www.gnu.org/licenses/gpl-2.0.html",
    textDomain: "my-plugin",
    domainPath: "/languages",
    requiresPhp: "7.4",
    requiresWp: "5.8",
    testedWp: "6.4",
    updateUri: "",
    tags: "",
  });

  function updateConfig(key: keyof HeaderConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const output = config.type === "plugin" ? generatePluginHeader(config) : generateThemeHeader(config);

  return (
    <div className="space-y-5">
      <Card title="Plugin/Theme Header Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate the exact docblock WordPress parses from the top of plugin files or style.css themes.
        </p>
        
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => updateConfig("type", "plugin")}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition ${config.type === "plugin" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Plugin Header
          </button>
          <button
            type="button"
            onClick={() => updateConfig("type", "theme")}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition ${config.type === "theme" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Theme Header
          </button>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Name</label>
            <input type="text" value={config.name} onChange={(e) => updateConfig("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">URI</label>
            <input type="url" value={config.uri} onChange={(e) => updateConfig("uri", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
            <input type="text" value={config.description} onChange={(e) => updateConfig("description", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Version</label>
            <input type="text" value={config.version} onChange={(e) => updateConfig("version", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Author</label>
            <input type="text" value={config.author} onChange={(e) => updateConfig("author", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Author URI</label>
            <input type="url" value={config.authorUri} onChange={(e) => updateConfig("authorUri", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">License</label>
            <input type="text" value={config.license} onChange={(e) => updateConfig("license", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Text Domain</label>
            <input type="text" value={config.textDomain} onChange={(e) => updateConfig("textDomain", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Requires PHP</label>
            <input type="text" value={config.requiresPhp} onChange={(e) => updateConfig("requiresPhp", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Requires WP</label>
            <input type="text" value={config.requiresWp} onChange={(e) => updateConfig("requiresWp", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Tested WP</label>
            <input type="text" value={config.testedWp} onChange={(e) => updateConfig("testedWp", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Tags</label>
            <input type="text" value={config.tags} onChange={(e) => updateConfig("tags", e.target.value)} className={inputClass} placeholder="comma, separated, tags" />
          </div>
        </div>
      </Card>

      <OutputBox value={output} label={config.type === "plugin" ? "Plugin Header" : "Theme Header"} />
    </div>
  );
}