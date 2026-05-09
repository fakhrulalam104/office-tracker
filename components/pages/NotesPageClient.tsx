"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

const storageKey = "office-tracker-notes-v1";
const emptyNoteBody = "";
const saveDebounceMs = 650;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNote(): Note {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: "Untitled note",
    body: emptyNoteBody,
    tags: [],
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().replace(/\s+/g, " "))
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function extractLinks(value: string) {
  return Array.from(new Set(value.match(/https?:\/\/[^\s)]+/g) ?? [])).slice(0, 20);
}

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function notePreview(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact || "No text yet.";
}

function readStoredNotes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((note): Note[] => {
      if (!note || typeof note !== "object") {
        return [];
      }

      const now = new Date().toISOString();
      return [
        {
          id: typeof note.id === "string" ? note.id : createId(),
          title: typeof note.title === "string" && note.title.trim() ? note.title : "Untitled note",
          body: typeof note.body === "string" ? note.body : "",
          tags: Array.isArray(note.tags) ? note.tags.filter((tag: unknown): tag is string => typeof tag === "string").slice(0, 12) : [],
          pinned: Boolean(note.pinned),
          archived: Boolean(note.archived),
          createdAt: typeof note.createdAt === "string" ? note.createdAt : now,
          updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : now
        }
      ];
    });
  } catch {
    return [];
  }
}

export function NotesPageClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("active");
  const [tagFilter, setTagFilter] = useState("all");
  const [focusMode, setFocusMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const saveTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function loadNotes() {
      setError(null);
      try {
        const response = await fetch("/api/notes");
        if (!response.ok) {
          throw new Error("Failed to load notes.");
        }

        const data = (await response.json()) as { notes: Note[] };
        if (!active) {
          return;
        }

        if (data.notes.length > 0) {
          setNotes(data.notes);
          setSelectedId(data.notes[0].id);
        } else {
          const localNotes = readStoredNotes();
          const notesToCreate = localNotes.length > 0 ? localNotes : [createNote()];
          const createdNotes: Note[] = [];

          for (const note of notesToCreate) {
            const response = await fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(note)
            });
            if (!response.ok) {
              throw new Error("Failed to create note.");
            }

            const created = (await response.json()) as { note: Note };
            createdNotes.push(created.note);
          }

          setNotes(createdNotes);
          setSelectedId(createdNotes[0]?.id ?? null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load notes.");
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void loadNotes();

    return () => {
      active = false;
      Object.values(saveTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(), [notes]);
  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;
  const selectedLinks = selectedNote ? extractLinks(selectedNote.body) : [];

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes
      .filter((note) => {
        if (view === "active" && note.archived) {
          return false;
        }
        if (view === "pinned" && (!note.pinned || note.archived)) {
          return false;
        }
        if (view === "archived" && !note.archived) {
          return false;
        }
        if (tagFilter !== "all" && !note.tags.includes(tagFilter)) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }

        return [note.title, note.body, note.tags.join(" ")].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, query, tagFilter, view]);

  function scheduleSave(id: string, patch: Partial<Note>) {
    window.clearTimeout(saveTimersRef.current[id]);
    setSavingState("saving");
    saveTimersRef.current[id] = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch)
        });

        if (!response.ok) {
          throw new Error("Failed to save note.");
        }

        const data = (await response.json()) as { note: Note };
        setNotes((current) => current.map((note) => (note.id === id ? data.note : note)));
        setSavingState("saved");
      } catch (saveError) {
        setSavingState("error");
        setError(saveError instanceof Error ? saveError.message : "Could not save note.");
      }
    }, saveDebounceMs);
  }

  function updateNote(id: string, patch: Partial<Note>) {
    const updatedAt = new Date().toISOString();
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              updatedAt
            }
          : note
      )
    );
    scheduleSave(id, patch);
  }

  async function addNote() {
    setError(null);
    const draft = createNote();
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });

    if (!response.ok) {
      setError("Could not create note.");
      return;
    }

    const data = (await response.json()) as { note: Note };
    setNotes((current) => [data.note, ...current]);
    setSelectedId(data.note.id);
    setView("active");
  }

  async function deleteNote(id: string) {
    window.clearTimeout(saveTimersRef.current[id]);
    const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete note.");
      return;
    }

    setNotes((current) => {
      const next = current.filter((note) => note.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function exportNotes() {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "office-tracker-notes.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importNotes(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) {
        return;
      }
      const normalized = imported.flatMap((note): Note[] => {
        if (!note || typeof note !== "object") {
          return [];
        }
        const now = new Date().toISOString();
        return [
          {
            id: createId(),
            title: typeof note.title === "string" && note.title.trim() ? note.title : "Untitled note",
            body: typeof note.body === "string" ? note.body : "",
            tags: Array.isArray(note.tags) ? note.tags.filter((tag: unknown): tag is string => typeof tag === "string").slice(0, 12) : [],
            pinned: Boolean(note.pinned),
            archived: Boolean(note.archived),
            createdAt: now,
            updatedAt: now
          }
        ];
      });

      const created: Note[] = [];
      for (const note of normalized) {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note)
        });
        if (response.ok) {
          const data = (await response.json()) as { note: Note };
          created.push(data.note);
        }
      }

      setNotes((current) => [...created, ...current]);
      setSelectedId(created[0]?.id ?? selectedId);
    } finally {
      if (importRef.current) {
        importRef.current.value = "";
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/features" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
            Back to features
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportNotes}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Import
            </button>
            <input ref={importRef} type="file" accept="application/json" onChange={(event) => void importNotes(event.target.files?.[0] ?? null)} className="hidden" />
            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold ${
                savingState === "error"
                  ? "bg-red-50 text-red-700"
                  : savingState === "saving"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {savingState === "saving" ? "Saving" : savingState === "error" ? "Save failed" : "Saved"}
            </span>
            <button type="button" onClick={() => void addNote()} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              New note
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section
          className={`grid min-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${
            focusMode ? "lg:grid-cols-1" : "lg:grid-cols-[340px_minmax(0,1fr)_300px]"
          }`}
        >
          {!focusMode ? <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Notes</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{notes.length} saved</h1>
            </div>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["active", "pinned", "archived", "all"] as ViewMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize transition ${
                    view === item ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selectedNote?.id === note.id ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
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
                  <input
                    value={selectedNote.title}
                    onChange={(event) => updateNote(selectedNote.id, { title: event.target.value || "Untitled note" })}
                    className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight text-slate-950 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFocusMode((value) => !value)}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                        focusMode ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {focusMode ? "Exit focus" : "Focus mode"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNote(selectedNote.id, { pinned: !selectedNote.pinned })}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                        selectedNote.pinned ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {selectedNote.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateNote(selectedNote.id, { archived: !selectedNote.archived })}
                      className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      {selectedNote.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={selectedNote.body}
                  onChange={(event) => updateNote(selectedNote.id, { body: event.target.value })}
                  placeholder="Write notes, links, checklists, decisions, or reminders."
                  className="mt-4 min-h-[420px] flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <input
                    value={selectedNote.tags.join(", ")}
                    onChange={(event) => updateNote(selectedNote.id, { tags: normalizeTags(event.target.value) })}
                    placeholder="Tags separated by commas"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(selectedNote.body)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Copy text
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteNote(selectedNote.id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
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
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-sky-700 transition hover:bg-sky-50"
                  >
                    {url}
                  </a>
                ))}
                {selectedLinks.length === 0 ? <p className="text-sm leading-6 text-slate-500">No links in this note.</p> : null}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedNote?.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tag)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-sky-100 hover:text-sky-700"
                  >
                    {tag}
                  </button>
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
