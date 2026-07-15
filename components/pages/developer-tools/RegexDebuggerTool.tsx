"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, inputClass, textAreaClass } from "./shared";

const cheatSheet = [
  { token: ".", desc: "Any character" },
  { token: "\\d", desc: "Digit [0-9]" },
  { token: "\\w", desc: "Word char [a-zA-Z0-9_]" },
  { token: "\\s", desc: "Whitespace" },
  { token: "^", desc: "Start of string" },
  { token: "$", desc: "End of string" },
  { token: "*", desc: "0 or more" },
  { token: "+", desc: "1 or more" },
  { token: "?", desc: "0 or 1" },
  { token: "{n,m}", desc: "Between n and m" },
  { token: "[abc]", desc: "Character set" },
  { token: "[^abc]", desc: "Negated set" },
  { token: "(abc)", desc: "Capture group" },
  { token: "(?:abc)", desc: "Non-capturing group" },
  { token: "a|b", desc: "Alternation" },
  { token: "\\b", desc: "Word boundary" },
];

export function RegexDebuggerTool() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Contact us at support@example.com or admin@company.com for help.");

  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(text.matchAll(regex)).map((m, i) => ({
        match: m[0],
        index: m.index,
        groups: m.slice(1).map((g, j) => ({ group: j + 1, value: g }))
      }));
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid regex" };
    }
  }, [pattern, flags, text]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pattern">
          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <input value={pattern} onChange={(e) => setPattern(e.target.value)} className={inputClass} placeholder="Regex pattern" />
            <input value={flags} onChange={(e) => setFlags(e.target.value)} className={inputClass} placeholder="flags" />
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className={`mt-3 ${textAreaClass}`} />
          {result.error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{result.error}</div>}
        </Card>
        <Card title="Matches">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-600">{result.matches.length} match(es) found</p>
            {result.matches.map((m, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-sky-700">{m.match}</span>
                  <span className="text-xs text-slate-500">index {m.index}</span>
                </div>
                {m.groups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.groups.map((g) => (
                      <span key={g.group} className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-mono">
                        ${g.group}: {g.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Cheat Sheet">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cheatSheet.map((c) => (
            <div key={c.token} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="font-mono text-sm font-semibold text-sky-700">{c.token}</span>
              <span className="ml-2 text-xs text-slate-600">{c.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
