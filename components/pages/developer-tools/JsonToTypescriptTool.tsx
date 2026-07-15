"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, textAreaClass, buttonClass, softButtonClass } from "./shared";

function jsonToInterface(obj: unknown, name = "Root", indent = 0): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (obj === null) return `${pad}${name}: null;`;
  if (obj === undefined) return `${pad}${name}: undefined;`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${pad}${name}: unknown[];`;
    const itemType = inferType(obj[0]);
    if (typeof obj[0] === "object" && obj[0] !== null && !Array.isArray(obj[0])) {
      return `${pad}${name}: ${jsonToInterface(obj[0], "", indent).trim()}[];`;
    }
    return `${pad}${name}: ${itemType}[];`;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return `${pad}${name}: Record<string, unknown>;`;
    const lines = entries.map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        return jsonToInterface(val, safeKey, indent + 1);
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return `${padInner}${safeKey}: unknown[];`;
        if (typeof val[0] === "object" && val[0] !== null && !Array.isArray(val[0])) {
          const inner = jsonToInterface(val[0], "", indent + 2).trim();
          return `${padInner}${safeKey}: (${inner})[];`;
        }
        return `${padInner}${safeKey}: ${inferType(val[0])}[];`;
      }
      return `${padInner}${safeKey}: ${inferType(val)};`;
    });
    return `${pad}${name ? `interface ${name}` : ""} {\n${lines.join("\n")}\n${pad}}`;
  }

  return `${pad}${name}: ${inferType(obj)};`;
}

function inferType(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return "string";
  if (typeof val === "number") return Number.isInteger(val) ? "number" : "number";
  if (typeof val === "boolean") return "boolean";
  return "unknown";
}

function jsonToZod(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null) return `${pad}z.null()`;
  if (typeof obj === "string") return `${pad}z.string()`;
  if (typeof obj === "number") return `${pad}z.number()`;
  if (typeof obj === "boolean") return `${pad}z.boolean()`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${pad}z.array(z.unknown())`;
    return `${pad}z.array(${jsonToZod(obj[0], indent)})`;
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    const lines = entries.map(([key, val]) => `${pad}  ${key}: ${jsonToZod(val, indent + 2).trim()},`);
    return `${pad}z.object({\n${lines.join("\n")}\n${pad}})`;
  }
  return `${pad}z.unknown()`;
}

const sampleJson = `{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "tags": ["admin", "user"],
  "address": {
    "street": "123 Main St",
    "city": "London"
  }
}`;

export function JsonToTypescriptTool() {
  const [json, setJson] = useState(sampleJson);
  const [mode, setMode] = useState<"interface" | "zod">("interface");

  const output = useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      if (mode === "interface") return jsonToInterface(parsed, "Root", 0);
      return `import { z } from "zod";\n\nconst schema = ${jsonToZod(parsed, 0)};\n\ntype Root = z.infer<typeof schema>;`;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON";
    }
  }, [json, mode]);

  return (
    <div className="space-y-4">
      <Card title="JSON Input">
        <textarea value={json} onChange={(e) => setJson(e.target.value)} className={textAreaClass} />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setMode("interface")} className={mode === "interface" ? buttonClass : softButtonClass}>TypeScript Interface</button>
          <button type="button" onClick={() => setMode("zod")} className={mode === "zod" ? buttonClass : softButtonClass}>Zod Schema</button>
        </div>
      </Card>
      <OutputBox value={output} label={mode === "interface" ? "TypeScript Interface" : "Zod Schema"} />
    </div>
  );
}
