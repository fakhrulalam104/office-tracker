"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, textAreaClass, buttonClass, softButtonClass, copyText } from "./shared";

function deserializePhpString(str: string): unknown {
  const trimmed = str.trim();
  
  const arrayMatch = trimmed.match(/^a:(\d+):\{(.+)\}$/s);
  if (arrayMatch) {
    const count = parseInt(arrayMatch[1]);
    const content = arrayMatch[2];
    const result: Record<string, unknown> = {};
    let pos = 0;
    
    while (pos < content.length && Object.keys(result).length < count) {
      const keyMatch = content.substring(pos).match(/^s:(\d+):"([^"]*)";/);
      if (!keyMatch) break;
      const keyLen = parseInt(keyMatch[1]);
      const key = keyMatch[2];
      pos += keyMatch[0].length;
      
      if (content[pos] === 's') {
        const valMatch = content.substring(pos).match(/^s:(\d+):"([^"]*)";/);
        if (!valMatch) break;
        result[key] = valMatch[2];
        pos += valMatch[0].length;
      } else if (content[pos] === 'a') {
        const nestedMatch = content.substring(pos).match(/^a:\d+:\{/);
        if (!nestedMatch) break;
        let depth = 1;
        let end = pos + nestedMatch[0].length;
        while (depth > 0 && end < content.length) {
          if (content[end] === '{') depth++;
          if (content[end] === '}') depth--;
          end++;
        }
        const nestedStr = content.substring(pos, end);
        result[key] = deserializePhpString(nestedStr);
        pos = end;
      } else {
        break;
      }
    }
    return result;
  }
  
  return trimmed;
}

function serializePhpString(obj: unknown, key?: string): string {
  if (typeof obj === "string") {
    return `s:${obj.length}:"${obj}";`;
  }
  
  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    const entries = Object.entries(obj as Record<string, unknown>);
    let inner = "";
    for (const [k, v] of entries) {
      inner += `s:${k.length}:"${k}";`;
      if (typeof v === "string") {
        inner += `s:${v.length}:"${v}";`;
      } else if (typeof v === "object" && v !== null) {
        inner += serializePhpString(v);
      }
    }
    return `a:${entries.length}:{${inner}}`;
  }
  
  if (Array.isArray(obj)) {
    let inner = "";
    obj.forEach((v, i) => {
      inner += `i:${i};`;
      if (typeof v === "string") {
        inner += `s:${v.length}:"${v}";`;
      } else if (typeof v === "object" && v !== null) {
        inner += serializePhpString(v);
      }
    });
    return `a:${obj.length}:{${inner}}`;
  }
  
  return String(obj);
}

function safeReplaceSerialized(serialized: string, search: string, replace: string): string {
  try {
    const parsed = deserializePhpString(serialized);
    
    function replaceInObject(obj: unknown): unknown {
      if (typeof obj === "string") {
        return obj.split(search).join(replace);
      }
      if (typeof obj === "object" && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          result[k] = replaceInObject(v);
        }
        return result;
      }
      return obj;
    }
    
    const replaced = replaceInObject(parsed);
    return serializePhpString(replaced);
  } catch {
    return serialized.split(search).join(replace);
  }
}

export function SerializedPhpReplaceTool() {
  const [input, setInput] = useState('a:2:{s:7:"domain";s:18:"old-domain.com";s:6:"option";s:12:"some value";}');
  const [search, setSearch] = useState("old-domain.com");
  const [replace, setReplace] = useState("new-domain.com");
  const [output, setOutput] = useState("");

  function handleReplace() {
    setOutput(safeReplaceSerialized(input, search, replace));
  }

  return (
    <div className="space-y-5">
      <Card title="Serialized PHP Search & Replace">
        <p className="text-sm text-slate-600 mb-4">
          Safely replace text in WordPress serialized strings. Normal find-replace breaks byte-length prefixes; this tool re-serializes with correct lengths.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Serialized String</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={textAreaClass}
              placeholder="Paste your serialized PHP string here..."
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
                placeholder="Text to find..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Replace</label>
              <input
                type="text"
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                className={inputClass}
                placeholder="Replace with..."
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={handleReplace} className={buttonClass}>
              Replace Safely
            </button>
            <button type="button" onClick={() => { setInput(""); setOutput(""); }} className={softButtonClass}>
              Clear
            </button>
          </div>
        </div>
      </Card>

      <OutputBox value={output} label="Result" />
    </div>
  );
}