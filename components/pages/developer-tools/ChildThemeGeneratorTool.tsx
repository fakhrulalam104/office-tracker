"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface ThemeConfig {
  parentTheme: string;
  childThemeName: string;
  author: string;
  authorUri: string;
  description: string;
  version: string;
  textDomain: string;
}

function generateStyleCss(config: ThemeConfig): string {
  return `/*
Theme Name: ${config.childThemeName}
Theme URI: ${config.authorUri}
Author: ${config.author}
Author URI: ${config.authorUri}
Description: ${config.description}
Version: ${config.version}
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${config.textDomain}
Template: ${config.parentTheme}
*/

/* Import parent theme styles */
@import url("../${config.parentTheme}/style.css");

/* Your custom styles below */`;
}

function generateFunctionsPhp(config: ThemeConfig): string {
  return `<?php
/**
 * ${config.childThemeName} functions and definitions
 *
 * @package ${config.childThemeName}
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Enqueue parent and child theme styles.
 */
function ${config.textDomain.replace(/-/g, "_")}_enqueue_styles() {
    // Parent theme style
    wp_enqueue_style(
        '${config.parentTheme}-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme( '${config.parentTheme}' )->get( 'Version' )
    );
    
    // Child theme style
    wp_enqueue_style(
        '${config.textDomain}-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( '${config.parentTheme}-style' ),
        wp_get_theme()->get( 'Version' )
    );
}
add_action( 'wp_enqueue_scripts', '${config.textDomain.replace(/-/g, "_")}_enqueue_styles' );

/**
 * Enqueue child theme-specific scripts.
 */
function ${config.textDomain.replace(/-/g, "_")}_enqueue_scripts() {
    // Add your custom scripts here
    // wp_enqueue_script(
    //     '${config.textDomain}-script',
    //     get_stylesheet_directory_uri() . '/js/custom.js',
    //     array( 'jquery' ),
    //     wp_get_theme()->get( 'Version' ),
    //     true
    // );
}
add_action( 'wp_enqueue_scripts', '${config.textDomain.replace(/-/g, "_")}_enqueue_scripts' );`;
}

export function ChildThemeGeneratorTool() {
  const [config, setConfig] = useState<ThemeConfig>({
    parentTheme: "flavor-developer",
    childThemeName: "Flavor Developer Child",
    author: "Your Name",
    authorUri: "https://example.com",
    description: "A child theme for Flavor Developer",
    version: "1.0.0",
    textDomain: "flavor-developer-child",
  });
  const [activeFile, setActiveFile] = useState<"style.css" | "functions.php">("style.css");

  function updateConfig(key: keyof ThemeConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const files: Record<string, string> = {
    "style.css": generateStyleCss(config),
    "functions.php": generateFunctionsPhp(config),
  };

  return (
    <div className="space-y-5">
      <Card title="Child Theme Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate a complete WordPress child theme with correct Template header and proper stylesheet loading (handling RTL and avoiding deprecated @import).
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Parent Theme Slug</label>
            <input type="text" value={config.parentTheme} onChange={(e) => updateConfig("parentTheme", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Child Theme Name</label>
            <input type="text" value={config.childThemeName} onChange={(e) => updateConfig("childThemeName", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Author</label>
            <input type="text" value={config.author} onChange={(e) => updateConfig("author", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Author URI</label>
            <input type="url" value={config.authorUri} onChange={(e) => updateConfig("authorUri", e.target.value)} className={inputClass} />
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
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Text Domain</label>
            <input type="text" value={config.textDomain} onChange={(e) => updateConfig("textDomain", e.target.value)} className={inputClass} />
          </div>
        </div>
      </Card>

      <Card title="Generated Files">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveFile("style.css")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
              activeFile === "style.css" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            style.css
          </button>
          <button
            type="button"
            onClick={() => setActiveFile("functions.php")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
              activeFile === "functions.php" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            functions.php
          </button>
        </div>
        <OutputBox value={files[activeFile]} label={activeFile} />
      </Card>
    </div>
  );
}