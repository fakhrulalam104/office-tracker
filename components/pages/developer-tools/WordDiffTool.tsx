"use client";

import { useMemo, useState } from "react";
import { Card, textAreaClass } from "./shared";

type DiffPart = { type: "same" | "added" | "removed"; text: string };

function diffWords(left: string, right: string): DiffPart[] {
  const a = left.split(/(\s+)/);
  const b = right.split(/(\s+)/);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ type: "removed", text: a[i] });
      i++;
    } else {
      result.push({ type: "added", text: b[j] });
      j++;
    }
  }

  while (i < a.length) { result.push({ type: "removed", text: a[i] }); i++; }
  while (j < b.length) { result.push({ type: "added", text: b[j] }); j++; }

  return result;
}

const sampleLeft = "The quick brown fox jumps over the lazy dog";
const sampleRight = "The quick red fox leaps over the sleepy cat";

export function WordDiffTool() {
  const [left, setLeft] = useState(sampleLeft);
  const [right, setRight] = useState(sampleRight);

  const diff = useMemo(() => diffWords(left, right), [left, right]);
  const stats = useMemo(() => {
    const added = diff.filter((p) => p.type === "added").length;
    const removed = diff.filter((p) => p.type === "removed").length;
    return `+${added} added, -${removed} removed`;
  }, [diff]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Original">
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} className={textAreaClass} />
        </Card>
        <Card title="Changed">
          <textarea value={right} onChange={(e) => setRight(e.target.value)} className={textAreaClass} />
        </Card>
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Word diff</h2>
          <span className="text-xs font-semibold text-slate-500">{stats}</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 font-mono text-sm">
          {diff.map((part, i) => (
            <span
              key={`${part.type}-${i}`}
              className={`inline ${
                part.type === "added" ? "bg-emerald-100 text-emerald-900" : part.type === "removed" ? "bg-rose-100 text-rose-900 line-through" : ""
              }`}
            >
              {part.text}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
