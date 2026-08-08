"use client";

import { useEffect, useState } from "react";
import { Card, OutputBox, buttonClass, softButtonClass, CopyButton } from "./shared";

type ClipEntry = { id: string; text: string; timestamp: Date };

const storageKey = "office-tracker-clipboard-history";

export function ClipboardHistoryTool() {
  const [entries, setEntries] = useState<ClipEntry[]>([]);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { text: string; timestamp: string }[];
        setEntries(parsed.map((e) => ({ ...e, id: crypto.randomUUID(), timestamp: new Date(e.timestamp) })));
      }
    } catch {}
  }, []);

  function saveEntries(next: ClipEntry[]) {
    setEntries(next);
    localStorage.setItem(storageKey, JSON.stringify(next.map((e) => ({ text: e.text, timestamp: e.timestamp.toISOString() }))));
  }

  async function addFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const entry: ClipEntry = { id: crypto.randomUUID(), text, timestamp: new Date() };
      saveEntries([entry, ...entries]);
    } catch {
      alert("Could not read clipboard. Try pasting manually.");
    }
  }

  function addManual() {
    if (!manualInput.trim()) return;
    const entry: ClipEntry = { id: crypto.randomUUID(), text: manualInput, timestamp: new Date() };
    saveEntries([entry, ...entries]);
    setManualInput("");
  }

  function removeEntry(id: string) {
    saveEntries(entries.filter((e) => e.id !== id));
  }

  function clearAll() {
    saveEntries([]);
  }

  return (
    <div className="space-y-4">
      <Card title="Clipboard History">
        <p className="text-sm text-slate-600">Store and search your recent clipboard copies. Data is saved in your browser only.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void addFromClipboard()} className={buttonClass}>Add from clipboard</button>
          <button type="button" onClick={clearAll} disabled={entries.length === 0} className={softButtonClass}>Clear all</button>
        </div>
        <div className="mt-4 flex gap-2">
          <input value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Or paste/type text here..." className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100" />
          <button type="button" onClick={addManual} disabled={!manualInput.trim()} className={buttonClass}>Add</button>
        </div>
      </Card>
      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No clipboard entries yet. Click "Add from clipboard" to start.
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-slate-800">{entry.text}</pre>
              <div className="flex shrink-0 gap-1">
                <CopyButton value={entry.text} label="Copy" copiedLabel="✓ Copied" className="rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50" />
                <button type="button" onClick={() => removeEntry(entry.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">{entry.timestamp.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
