"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface BlockConfig {
  name: string;
  namespace: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  attributes: { name: string; type: string }[];
}

function generateBlockJson(config: BlockConfig): string {
  const attributes = config.attributes.reduce((acc, attr) => {
    acc[attr.name] = { type: attr.type };
    return acc;
  }, {} as Record<string, { type: string }>);

  return JSON.stringify({
    $schema: "https://schemas.wp.org/trunk/block.json",
    apiVersion: 3,
    name: `${config.namespace}/${config.name}`,
    title: config.title,
    description: config.description,
    category: config.category,
    icon: config.icon,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    supports: {
      html: false,
      align: true,
    },
    editorScript: "file:./build/index.js",
    editorStyle: "file:./build/index.css",
    style: "file:./build/style-index.css",
  }, null, 2);
}

function generateEditJs(config: BlockConfig): string {
  const useBlockProps = config.attributes.length > 0
    ? `const { attributes, setAttributes } = useBlockProps();`
    : `const blockProps = useBlockProps();`;

  const attributesInterface = config.attributes.length > 0
    ? `\ninterface Attributes {\n${config.attributes.map((a) => `  ${a.name}: ${a.type === "string" ? "string" : a.type === "number" ? "number" : "boolean"};`).join("\n")}\n}`
    : "";

  return `import { useBlockProps, RichText } from '@wordpress/block-editor';
${config.attributes.some((a) => a.type === "string") ? `\nimport { __ } from '@wordpress.i18n';` : ""}

${attributesInterface}

export function edit({ attributes, setAttributes }: { attributes: ${config.attributes.length > 0 ? "Attributes" : "Record<string, never>"}; setAttributes: (attrs: Partial<${config.attributes.length > 0 ? "Attributes" : "Record<string, never>"}>) => void }) {
  return (
    <div { ...useBlockProps() }>
      <h2>${config.title}</h2>
      ${config.attributes.some((a) => a.name === "content")
        ? `<RichText
          tagname="p"
          value={attributes.content}
          onChange={(content: string) => setAttributes({ content })}
          placeholder={__('Enter content...')}
        />`
        : `<!-- Block content -->`}
    </div>
  );
}`;
}

function generateSaveJs(config: BlockConfig): string {
  const useBlockProps = "";

  return `import { useBlockProps, RichText } from '@wordpress/block-editor';

export function save({ attributes }: { attributes: ${config.attributes.length > 0 ? `Record<string, ${config.attributes.some((a) => a.type === "string") ? "string" : "number | boolean"}>` : "Record<string, never>"} }) {
  return (
    <div { ...useBlockProps.save() }>
      <h2>${config.title}</h2>
      ${config.attributes.some((a) => a.name === "content")
        ? `<RichText.Content value={attributes.content} />`
        : `<!-- Saved content -->`}
    </div>
  );
}`;
}

function generateIndexJs(config: BlockConfig): string {
  return `import { registerBlockType } from '@wordpress/blocks';
import { edit } from './edit';
import { save } from './save';
import metadata from './block.json';

registerBlockType(metadata.name, {
  edit,
  save,
});`;
}

function generateStyleScss(config: BlockConfig): string {
  return `.wp-block-${config.namespace}-${config.name} {
  /* Block styles */
}`;
}

export function GutenbergBlockBoilerplateTool() {
  const [config, setConfig] = useState<BlockConfig>({
    name: "my-custom-block",
    namespace: "my-namespace",
    title: "My Custom Block",
    description: "A custom Gutenberg block",
    category: "common",
    icon: "smiley",
    attributes: [
      { name: "content", type: "string" },
    ],
  });
  const [activeFile, setActiveFile] = useState<"block.json" | "edit.js" | "save.js" | "index.js" | "style.scss">("block.json");

  function updateConfig(key: keyof BlockConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function addAttribute() {
    setConfig((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: "", type: "string" }],
    }));
  }

  function removeAttribute(index: number) {
    setConfig((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  }

  function updateAttribute(index: number, key: "name" | "type", value: string) {
    setConfig((prev) => ({
      ...prev,
      attributes: prev.attributes.map((a, i) => (i === index ? { ...a, [key]: value } : a)),
    }));
  }

  const files: Record<string, string> = {
    "block.json": generateBlockJson(config),
    "edit.js": generateEditJs(config),
    "save.js": generateSaveJs(config),
    "index.js": generateIndexJs(config),
    "style.scss": generateStyleScss(config),
  };

  return (
    <div className="space-y-5">
      <Card title="Gutenberg Block Boilerplate Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate block.json, edit.js, save.js, index.js, and style.scss scaffolding for custom WordPress blocks.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Block Name</label>
            <input type="text" value={config.name} onChange={(e) => updateConfig("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Namespace</label>
            <input type="text" value={config.namespace} onChange={(e) => updateConfig("namespace", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
            <input type="text" value={config.title} onChange={(e) => updateConfig("title", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
            <select value={config.category} onChange={(e) => updateConfig("category", e.target.value)} className={inputClass}>
              <option value="common">Common</option>
              <option value="formatting">Formatting</option>
              <option value="widgets">Widgets</option>
              <option value="embed">Embed</option>
              <option value="design">Design</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Attributes</label>
            <button type="button" onClick={addAttribute} className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              + Add Attribute
            </button>
          </div>
          <div className="space-y-2">
            {config.attributes.map((attr, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(i, "name", e.target.value)}
                  className={inputClass}
                  placeholder="Name"
                />
                <select
                  value={attr.type}
                  onChange={(e) => updateAttribute(i, "type", e.target.value)}
                  className={inputClass}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </select>
                <button type="button" onClick={() => removeAttribute(i)} className="text-red-500 hover:text-red-700 px-2">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Generated Files">
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(files) as Array<keyof typeof files>).map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => setActiveFile(file)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
                activeFile === file
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {file}
            </button>
          ))}
        </div>
        <OutputBox value={files[activeFile]} label={activeFile} />
      </Card>
    </div>
  );
}