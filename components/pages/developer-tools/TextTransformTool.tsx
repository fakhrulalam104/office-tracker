"use client";

import { useEffect, useRef, useState } from "react";
import { Card, textAreaClass, copyText } from "./shared";

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

function toCapitalize(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSentenceCase(s: string) {
  return s.replace(/(^\s*[a-z]|\.\s+[a-z]|!\s+[a-z]|\?\s+[a-z])/g, (c) => c.toUpperCase());
}

function toNormalText(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
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

type TransformKey = string;

const transforms: { key: TransformKey; label: string; fn: (s: string) => string }[] = [
  { key: "camel", label: "camelCase", fn: toCamelCase },
  { key: "pascal", label: "PascalCase", fn: toPascalCase },
  { key: "snake", label: "snake_case", fn: toSnakeCase },
  { key: "kebab", label: "kebab-case", fn: toKebabCase },
  { key: "constant", label: "CONSTANT_CASE", fn: toConstantCase },
  { key: "dot", label: "dot.case", fn: toDotCase },
  { key: "path", label: "path/case", fn: toPathCase },
  { key: "capitalize", label: "Capitalize", fn: toCapitalize },
  { key: "sentence", label: "Sentence case", fn: toSentenceCase },
  { key: "normal", label: "Normal text", fn: toNormalText },
  { key: "upper", label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
  { key: "lower", label: "lowercase", fn: (s: string) => s.toLowerCase() },
  { key: "unicode", label: "Unicode Escape", fn: unicodeEscape },
  { key: "html", label: "HTML Entities", fn: htmlEntities },
  { key: "reverse", label: "Reverse", fn: reverseString },
];

export function TextTransformTool() {
  const [input, setInput] = useState("hello-world example_text");
  const [active, setActive] = useState<TransformKey | null>(null);
  const [copied, setCopied] = useState(false);
  const originalRef = useRef("hello-world example_text");

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  function handleCopy() {
    copyText(input);
    setCopied(true);
  }

  function applyTransform(key: TransformKey, fn: (s: string) => string) {
    if (active === key) {
      setInput(originalRef.current);
      setActive(null);
    } else {
      if (active === null) {
        originalRef.current = input;
      }
      setInput(fn(originalRef.current));
      setActive(key);
    }
  }

  function handleManualEdit(value: string) {
    setInput(value);
    if (active) {
      originalRef.current = value;
      setActive(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Input">
        <div className="flex items-start justify-between gap-3">
          <textarea value={input} onChange={(e) => handleManualEdit(e.target.value)} className={textAreaClass} />
          <button type="button" onClick={handleCopy} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${copied ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">{wordCount(input)}</p>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {transforms.map((t) => {
          const isActive = active === t.key;
          const preview = t.fn(originalRef.current).slice(0, 40);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => applyTransform(t.key, t.fn)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50"
              }`}
            >
              <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>{t.label}</span>
              <span className={`mt-1 block truncate font-mono text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>{preview}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
