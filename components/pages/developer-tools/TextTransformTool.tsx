"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, textAreaClass, buttonClass, softButtonClass } from "./shared";

function toCamelCase(s: string) {
  return s.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toLowerCase());
}

function toPascalCase(s: string) {
  const camel = toCamelCase(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnakeCase(s: string) {
  return s.replace(/([A-Z])/g, "_$1").replace(/[-\s]+/g, "_").toLowerCase().replace(/^_/, "");
}

function toKebabCase(s: string) {
  return toSnakeCase(s).replace(/_/g, "-");
}

function toConstantCase(s: string) {
  return toSnakeCase(s).toUpperCase();
}

function toDotCase(s: string) {
  return toSnakeCase(s).replace(/_/g, ".");
}

function toPathCase(s: string) {
  return toSnakeCase(s).replace(/_/g, "/");
}

function unicodeEscape(s: string) {
  return Array.from(s).map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`).join("");
}

function htmlEntities(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

function reverseString(s: string) {
  return Array.from(s).reverse().join("");
}

function wordCount(s: string) {
  const words = s.trim().split(/\s+/).filter(Boolean).length;
  const chars = s.length;
  const lines = s.split("\n").length;
  return `Words: ${words} | Characters: ${chars} | Lines: ${lines}`;
}

export function TextTransformTool() {
  const [input, setInput] = useState("hello-world example_text");
  const [output, setOutput] = useState("");

  const transforms = [
    { label: "camelCase", fn: toCamelCase },
    { label: "PascalCase", fn: toPascalCase },
    { label: "snake_case", fn: toSnakeCase },
    { label: "kebab-case", fn: toKebabCase },
    { label: "CONSTANT_CASE", fn: toConstantCase },
    { label: "dot.case", fn: toDotCase },
    { label: "path/case", fn: toPathCase },
    { label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
    { label: "lowercase", fn: (s: string) => s.toLowerCase() },
    { label: "Title Case", fn: (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase()) },
    { label: "Unicode Escape", fn: unicodeEscape },
    { label: "HTML Entities", fn: htmlEntities },
    { label: "Reverse", fn: reverseString },
  ];

  return (
    <div className="space-y-4">
      <Card title="Input">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className={textAreaClass} />
        <p className="mt-2 text-xs font-semibold text-slate-500">{wordCount(input)}</p>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {transforms.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setOutput(t.fn(input))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
          >
            <span className="block text-sm font-semibold text-slate-950">{t.label}</span>
            <span className="mt-1 block truncate font-mono text-xs text-slate-500">{t.fn(input).slice(0, 40)}</span>
          </button>
        ))}
      </div>
      {output && <OutputBox value={output} label="Result" />}
    </div>
  );
}
