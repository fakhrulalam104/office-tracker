"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = "active" | "pinned" | "archived" | "all";

const storageKey = "office-tracker-notes-v2";
const saveDebounceMs = 650;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNote(): Note {
  const now = new Date().toISOString();
  return { id: createId(), title: "Untitled note", body: "", tags: [], pinned: false, archived: false, createdAt: now, updatedAt: now };
}

function normalizeTags(value: string) {
  return Array.from(new Set(value.split(",").map((t) => t.trim().replace(/\s+/g, " ")).filter(Boolean))).slice(0, 12);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function extractLinks(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(new Set(Array.from(doc.querySelectorAll("a")).map((a) => a.href).filter((u) => u.startsWith("http")))).slice(0, 20);
}

function countWords(html: string) {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function notePreview(html: string) {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim().slice(0, 120) || "No text yet.";
}

function readStoredNotes() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((note): Note[] => {
      if (!note || typeof note !== "object") return [];
      const now = new Date().toISOString();
      return [{
        id: typeof note.id === "string" ? note.id : createId(),
        title: typeof note.title === "string" && note.title.trim() ? note.title : "Untitled note",
        body: typeof note.body === "string" ? note.body : "",
        tags: Array.isArray(note.tags) ? note.tags.filter((t: unknown): t is string => typeof t === "string").slice(0, 12) : [],
        pinned: Boolean(note.pinned), archived: Boolean(note.archived),
        createdAt: typeof note.createdAt === "string" ? note.createdAt : now,
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : now
      }];
    });
  } catch { return []; }
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

const fonts = ["System UI", "Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact", "Comic Sans MS"];
const fontSizes = [
  { label: "Small", value: "1" }, { label: "Normal", value: "3" }, { label: "Medium", value: "4" },
  { label: "Large", value: "5" }, { label: "Huge", value: "7" }
];

function ToolbarButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [fontFamily, setFontFamily] = useState("System UI");
  const [fontSize, setFontSize] = useState("3");
  const [showMore, setShowMore] = useState(false);
  const [fontColor, setFontColor] = useState("#0f172a");
  const [highlightColor, setHighlightColor] = useState("#fef08a");

  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    exec(cmd, val);
  }, [editorRef]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5">
      <select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); execCmd("fontName", e.target.value); }} className="rounded-lg border-0 bg-transparent px-1 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
        {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={fontSize} onChange={(e) => { setFontSize(e.target.value); execCmd("fontSize", e.target.value); }} className="rounded-lg border-0 bg-transparent px-1 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
        {fontSizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("bold")} title="Bold">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><path d="M4 2h5a3 3 0 011.8 5.4A3.5 3.5 0 0110.5 14H4V2zm2 5h3a1 1 0 000-2H6v2zm0 2v3h4.5a1.5 1.5 0 000-3H6z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("italic")} title="Italic">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 14h4M10 2H6M9 14l-3-10" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("underline")} title="Underline">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v6a4 4 0 008 0V2M3 14h10" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("strikeThrough")} title="Strikethrough">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M5.5 4h5a2.5 2.5 0 010 5M5.5 11h5a2.5 2.5 0 000-5" strokeLinecap="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("subscript")} title="Subscript">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 4l4 4-4 4M10 12l3 2-3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("superscript")} title="Superscript">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 4l4-4-4 4M10 4l3-2-3 2M10 14h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <div className="relative">
        <label title="Font color" className="flex items-center cursor-pointer rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={fontColor} strokeWidth="1.8"><path d="M3 14l3-10 3 10M4.2 10h3.6M11 4v8M11 4c1 0 2.5 1 2.5 3s-1.5 3-2.5 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <input type="color" value={fontColor} onChange={(e) => { setFontColor(e.target.value); execCmd("foreColor", e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>
      </div>
      <div className="relative">
        <label title="Highlight" className="flex items-center cursor-pointer rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><rect x="1" y="10" width="14" height="4" rx="1" fill={highlightColor} stroke="currentColor" strokeWidth="1"/><path d="M9.5 2l3 8M6.5 2L3 10M5 6h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <input type="color" value={highlightColor} onChange={(e) => { setHighlightColor(e.target.value); execCmd("hiliteColor", e.target.value); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>
      </div>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("justifyLeft")} title="Align left">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M2 7h8M2 11h10M2 15h6" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("justifyCenter")} title="Align center">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M4 7h8M3 11h10M5 15h6" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("justifyRight")} title="Align right">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12M6 7h8M4 11h10M8 15h6" strokeLinecap="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="2.5" cy="4" r="1" fill="currentColor"/><circle cx="2.5" cy="8" r="1" fill="currentColor"/><circle cx="2.5" cy="12" r="1" fill="currentColor"/><path d="M6 4h8M6 8h8M6 12h8" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("insertOrderedList")} title="Numbered list">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 3.5h1.5M1 7.5h1.5M1 11.5h1.5" strokeLinecap="round"/><text x="4" y="5" fontSize="3.5" fill="currentColor" stroke="none" fontWeight="600">1</text><text x="4" y="9" fontSize="3.5" fill="currentColor" stroke="none" fontWeight="600">2</text><text x="4" y="13" fontSize="3.5" fill="currentColor" stroke="none" fontWeight="600">3</text><path d="M8 4h6M8 8h6M8 12h6" strokeLinecap="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <button type="button" onClick={() => setShowMore(!showMore)} title="More options" className={`rounded-lg p-1.5 transition ${showMore ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor"><circle cx="3" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="13" cy="8" r="1.2"/></svg>
      </button>
      <ToolbarButton onClick={() => execCmd("removeFormat")} title="Clear formatting">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2l8 12M2 8h12M7 2l-3 6M12 2l-3 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
    </div>
  );
}

function MoreToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    exec(cmd, val);
  }, [editorRef]);

  function toCase(mode: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString();
    if (!text) return;
    let result = "";
    switch (mode) {
      case "sentence": result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
      case "lower": result = text.toLowerCase(); break;
      case "upper": result = text.toUpperCase(); break;
      case "capitalize": result = text.replace(/\b\w/g, (c) => c.toUpperCase()); break;
      case "toggle": result = text.split("").map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join(""); break;
    }
    exec("insertText", result);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 mt-2">
      <ToolbarButton onClick={() => toCase("sentence")} title="Sentence case">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h4M4 4v8M6 8h2M6 12h2M10 4l2 8M14 4l-2 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => toCase("lower")} title="lowercase">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12V4h3l2 4 2-4h3v8M2 8h4M10 8h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => toCase("upper")} title="UPPERCASE">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12V4h5l3 5.5L12 4h3v8M4 12h2M10 12h2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => toCase("capitalize")} title="Capitalize Each Word">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12V4h3l1.5 3L7 4h2v8M10 12V4h3l1.5 3L16 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => toCase("toggle")} title="tOGGLE cASE">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h4M4 4v8M7 12V4l2.5 4L12 4v8M14 4v8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("smallCaps")} title="Small Caps">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12V4h4l2 4 2-4h4v8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton onClick={() => execCmd("insertHorizontalRule")} title="Horizontal line">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => { const url = prompt("Enter link URL:"); if (url) execCmd("createLink", url); }} title="Insert link">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" strokeLinecap="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("undo")} title="Undo">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h7a3 3 0 010 6H8M3 6l3-3M3 6l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => execCmd("redo")} title="Redo">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 6H6a3 3 0 000 6h2M13 6l-3-3M13 6l-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </ToolbarButton>
    </div>
  );
}

export function NotesPageClient() {
  const [backLoading, setBackLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("active");
  const [tagFilter, setTagFilter] = useState("all");
  const [focusMode, setFocusMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const importRef = useRef<HTMLInputElement | null>(null);
  const saveTimersRef = useRef<Record<string, number>>({});
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadNotes() {
      setError(null);
      try {
        const response = await fetch("/api/notes");
        if (!response.ok) throw new Error("Failed to load notes.");
        const data = (await response.json()) as { notes: Note[] };
        if (!active) return;
        if (data.notes.length > 0) {
          setNotes(data.notes);
          setSelectedId(data.notes[0].id);
        } else {
          const localNotes = readStoredNotes();
          const notesToCreate = localNotes.length > 0 ? localNotes : [createNote()];
          const created: Note[] = [];
          for (const note of notesToCreate) {
            const r = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) });
            if (r.ok) { const d = (await r.json()) as { note: Note }; created.push(d.note); }
          }
          setNotes(created);
          setSelectedId(created[0]?.id ?? null);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Unable to load notes.");
      } finally { if (active) setLoaded(true); }
    }
    void loadNotes();
    return () => { active = false; Object.values(saveTimersRef.current).forEach((t) => window.clearTimeout(t)); };
  }, []);

  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags))).sort(), [notes]);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null;
  const selectedLinks = selectedNote ? extractLinks(selectedNote.body) : [];

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (view === "active" && n.archived) return false;
        if (view === "pinned" && (!n.pinned || n.archived)) return false;
        if (view === "archived" && !n.archived) return false;
        if (tagFilter !== "all" && !n.tags.includes(tagFilter)) return false;
        if (!q) return true;
        const text = new DOMParser().parseFromString(n.body, "text/html").body.textContent ?? "";
        return [n.title, text, n.tags.join(" ")].some((v) => v.toLowerCase().includes(q));
      })
      .sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); });
  }, [notes, query, tagFilter, view]);

  function scheduleSave(id: string, patch: Partial<Note>) {
    window.clearTimeout(saveTimersRef.current[id]);
    setSavingState("saving");
    saveTimersRef.current[id] = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
        if (!r.ok) throw new Error("Failed to save note.");
        const d = (await r.json()) as { note: Note };
        setNotes((c) => c.map((n) => (n.id === id ? d.note : n)));
        setSavingState("saved");
      } catch (e) { setSavingState("error"); setError(e instanceof Error ? e.message : "Could not save."); }
    }, saveDebounceMs);
  }

  function updateNote(id: string, patch: Partial<Note>) {
    const updatedAt = new Date().toISOString();
    setNotes((c) => c.map((n) => (n.id === id ? { ...n, ...patch, updatedAt } : n)));
    scheduleSave(id, patch);
  }

  function handleEditorInput() {
    if (!selectedNote || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== selectedNote.body) {
      updateNote(selectedNote.id, { body: html });
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      document.execCommand("insertHTML", false, html);
    } else {
      document.execCommand("insertText", false, text);
    }
  }

  useEffect(() => {
    if (!editorRef.current || !selectedNote) return;
    if (editorRef.current.innerHTML !== selectedNote.body) {
      editorRef.current.innerHTML = selectedNote.body;
    }
  }, [selectedId]);

  async function addNote() {
    setError(null);
    const draft = createNote();
    const r = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    if (!r.ok) { setError("Could not create note."); return; }
    const d = (await r.json()) as { note: Note };
    setNotes((c) => [d.note, ...c]);
    setSelectedId(d.note.id);
    setView("active");
  }

  async function deleteNote(id: string) {
    window.clearTimeout(saveTimersRef.current[id]);
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!r.ok) { setError("Could not delete note."); return; }
    setNotes((c) => { const next = c.filter((n) => n.id !== id); if (selectedId === id) setSelectedId(next[0]?.id ?? null); return next; });
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "office-tracker-notes.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function importNotes(file: File | null) {
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) return;
      const normalized = imported.flatMap((note): Note[] => {
        if (!note || typeof note !== "object") return [];
        const now = new Date().toISOString();
        return [{ id: createId(), title: typeof note.title === "string" && note.title.trim() ? note.title : "Untitled note", body: typeof note.body === "string" ? note.body : "", tags: Array.isArray(note.tags) ? note.tags.filter((t: unknown): t is string => typeof t === "string").slice(0, 12) : [], pinned: Boolean(note.pinned), archived: Boolean(note.archived), createdAt: now, updatedAt: now }];
      });
      const created: Note[] = [];
      for (const note of normalized) { const r = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) }); if (r.ok) { const d = (await r.json()) as { note: Note }; created.push(d.note); } }
      setNotes((c) => [...created, ...c]);
      setSelectedId(created[0]?.id ?? selectedId);
    } finally { if (importRef.current) importRef.current.value = ""; }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" onClick={() => setBackLoading(true)} className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            {backLoading ? (<span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /> Loading...</span>) : ("Back to features")}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportNotes} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Export</button>
            <button type="button" onClick={() => importRef.current?.click()} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Import</button>
            <input ref={importRef} type="file" accept="application/json" onChange={(e) => void importNotes(e.target.files?.[0] ?? null)} className="hidden" />
            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${savingState === "error" ? "bg-red-50 text-red-700" : savingState === "saving" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {savingState === "saving" ? "Saving" : savingState === "error" ? "Save failed" : "Saved"}
            </span>
            <button type="button" onClick={() => void addNote()} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">New note</button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className={`grid min-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${focusMode ? "lg:grid-cols-1" : "lg:grid-cols-[340px_minmax(0,1fr)_300px]"}`}>
          {!focusMode ? <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Notes</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{notes.length} saved</h1>
            </div>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["active", "pinned", "archived", "all"] as ViewMode[]).map((item) => (
                <button key={item} type="button" onClick={() => setView(item)} className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize transition ${view === item ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{item}</button>
              ))}
            </div>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
              <option value="all">All tags</option>
              {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <button key={note.id} type="button" onClick={() => setSelectedId(note.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedNote?.id === note.id ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-950">{note.title}</p>
                    {note.pinned ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pinned</span> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notePreview(note.body)}</p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatDate(note.updatedAt)}</p>
                </button>
              ))}
              {filteredNotes.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No notes found.</div> : null}
            </div>
          </aside> : null}

          <main className="flex min-h-[560px] flex-col p-4 lg:p-5">
            {selectedNote ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <input value={selectedNote.title} onChange={(e) => updateNote(selectedNote.id, { title: e.target.value || "Untitled note" })} className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight text-slate-950 outline-none" />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowToolbar(!showToolbar)} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${showToolbar ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {showToolbar ? "Hide toolbar" : "Show toolbar"}
                    </button>
                    <button type="button" onClick={() => setFocusMode((v) => !v)} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${focusMode ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {focusMode ? "Exit focus" : "Focus mode"}
                    </button>
                    <button type="button" onClick={() => updateNote(selectedNote.id, { pinned: !selectedNote.pinned })} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${selectedNote.pinned ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {selectedNote.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => updateNote(selectedNote.id, { archived: !selectedNote.archived })} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
                      {selectedNote.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>

                {showToolbar && (
                  <div className="mt-3">
                    <RichToolbar editorRef={editorRef} />
                    <MoreToolbar editorRef={editorRef} />
                  </div>
                )}

                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  suppressContentEditableWarning
                  data-placeholder="Write notes, links, checklists, decisions, or reminders."
                  className="mt-3 min-h-[420px] flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none transition empty:before:pointer-events-none empty:before:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 [&:empty]:before:content-[attr(data-placeholder)]"
                />

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <input value={selectedNote.tags.join(", ")} onChange={(e) => updateNote(selectedNote.id, { tags: normalizeTags(e.target.value) })} placeholder="Tags separated by commas" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                  <button type="button" onClick={() => { const text = new DOMParser().parseFromString(selectedNote.body, "text/html").body.textContent ?? ""; void navigator.clipboard?.writeText(text); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Copy text</button>
                  <button type="button" onClick={() => void deleteNote(selectedNote.id)} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">Delete</button>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">Create a note to start.</div>
            )}
          </main>

          {!focusMode ? <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stats</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{selectedNote ? countWords(selectedNote.body) : 0}</p>
                  <p className="text-xs font-medium text-slate-500">Words</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{selectedLinks.length}</p>
                  <p className="text-xs font-medium text-slate-500">Links</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Links</p>
              <div className="mt-3 space-y-2">
                {selectedLinks.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block break-all rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-sky-700 transition hover:bg-sky-50">{url}</a>
                ))}
                {selectedLinks.length === 0 ? <p className="text-sm leading-6 text-slate-500">No links in this note.</p> : null}
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedNote?.tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => setTagFilter(tag)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-sky-100 hover:text-sky-700">{tag}</button>
                ))}
                {!selectedNote?.tags.length ? <p className="text-sm leading-6 text-slate-500">No tags.</p> : null}
              </div>
            </div>
          </aside> : null}
        </section>
      </div>
    </div>
  );
}
