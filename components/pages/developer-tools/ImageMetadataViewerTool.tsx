"use client";

import { useEffect, useRef, useState } from "react";
import { Card, buttonClass, softButtonClass, copyText, formatBytes } from "./shared";

type ExifEntry = { tag: string; value: string; rawTag: number };

type Metadata = {
  name: string;
  size: number;
  type: string;
  lastModified: string;
  width: number | null;
  height: number | null;
  exif: ExifEntry[];
};

const tagNames: Record<number, string> = {
  0x010F: "Make", 0x0110: "Model", 0x0112: "Orientation",
  0x011A: "XResolution", 0x011B: "YResolution", 0x0131: "Software",
  0x0132: "DateTime", 0x013B: "Artist", 0x8298: "Copyright",
  0x8769: "ExifOffset", 0x829A: "ExposureTime", 0x829D: "FNumber",
  0x8827: "ISOSpeedRatings", 0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized", 0x920A: "FocalLength", 0xA001: "ColorSpace",
  0xA002: "PixelXDimension", 0xA003: "PixelYDimension",
  0xA405: "FocalLengthIn35mmFilm", 0xA420: "ImageUniqueID",
  0x0213: "YCbCrPositioning", 0x0103: "Compression",
  0x0100: "ImageWidth", 0x0101: "ImageHeight",
};

function readExif(file: File): Promise<ExifEntry[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const view = new DataView(buffer);
        const entries: ExifEntry[] = [];
        if (view.getUint16(0, false) !== 0xFFD8) { resolve(entries); return; }
        let offset = 2;
        while (offset < view.byteLength - 1) {
          if (view.getUint16(offset, false) === 0xFFE1) {
            const tiffOffset = offset + 4;
            const bigEndian = view.getUint16(tiffOffset, false) === 0x4D4D;
            const ifdOffset = view.getUint32(tiffOffset + 4, !bigEndian) + tiffOffset;
            const numEntries = view.getUint16(ifdOffset, !bigEndian);
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdOffset + 2 + i * 12;
              if (entryOffset + 12 > view.byteLength) break;
              const tag = view.getUint16(entryOffset, !bigEndian);
              const type = view.getUint16(entryOffset + 2, !bigEndian);
              const count = view.getUint32(entryOffset + 4, !bigEndian);
              let val = "";
              if (type === 2 && count <= 200) {
                const strOffset = count <= 4 ? entryOffset + 8 : view.getUint32(entryOffset + 8, !bigEndian) + tiffOffset;
                for (let c = 0; c < count - 1 && strOffset + c < view.byteLength; c++) val += String.fromCharCode(view.getUint8(strOffset + c));
              } else if (type === 3) val = String(view.getUint16(entryOffset + 8, !bigEndian));
              else if (type === 4) val = String(view.getUint32(entryOffset + 8, !bigEndian));
              else if (type === 5) { const n = view.getUint32(entryOffset + 8, !bigEndian); const d = view.getUint32(entryOffset + 12, !bigEndian); val = d ? (n / d).toFixed(2) : String(n); }
              if (val && tag !== 0x8769) entries.push({ tag: tagNames[tag] || "Tag 0x" + tag.toString(16).toUpperCase(), value: val, rawTag: tag });
            }
            break;
          }
          offset += 2;
        }
        resolve(entries);
      } catch { resolve([]); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { const d = { width: img.naturalWidth, height: img.naturalHeight }; URL.revokeObjectURL(url); resolve(d); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function EditableRow({ label, value, onChange, onDelete }: { label: string; value: string; onChange: (v: string) => void; onDelete?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function confirm() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-200">
      <span className="shrink-0 pt-0.5 text-xs font-semibold text-slate-400 w-28">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={confirm}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          className="flex-1 min-w-0 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-sm font-mono text-slate-800 outline-none ring-2 ring-sky-100"
        />
      ) : (
        <span
          onClick={() => { setDraft(value); setEditing(true); }}
          className="flex-1 min-w-0 break-words text-sm font-mono text-slate-700 cursor-pointer rounded-lg px-2 py-1 transition hover:bg-slate-50"
          title="Click to edit"
        >
          {value}
        </span>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-50">
          Delete
        </button>
      )}
    </div>
  );
}

export function ImageMetadataEditorTool() {
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newValue, setNewValue] = useState("");
  const fileRef = useRef<File | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) { setMeta(null); return; }
    setLoading(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    fileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const [exif, dims] = await Promise.all([readExif(file), loadImageDimensions(file)]);
      setMeta({ name: file.name, size: file.size, type: file.type, lastModified: new Date(file.lastModified).toLocaleString(), width: dims?.width ?? null, height: dims?.height ?? null, exif });
    } catch { setMeta(null); } finally { setLoading(false); }
  }

  function updateFileField(field: "name" | "type" | "lastModified", val: string) {
    if (!meta) return;
    setMeta({ ...meta, [field]: val });
  }

  function updateExif(index: number, val: string) {
    if (!meta) return;
    const next = [...meta.exif];
    next[index] = { ...next[index], value: val };
    setMeta({ ...meta, exif: next });
  }

  function deleteExif(index: number) {
    if (!meta) return;
    setMeta({ ...meta, exif: meta.exif.filter((_, i) => i !== index) });
  }

  function addEntry() {
    if (!meta || !newTag.trim() || !newValue.trim()) return;
    setMeta({ ...meta, exif: [...meta.exif, { tag: newTag.trim(), value: newValue.trim(), rawTag: 0 }] });
    setNewTag(""); setNewValue("");
  }

  function handleCopyAll() {
    if (!meta) return;
    copyText([
      `File: ${meta.name}`, `Size: ${formatBytes(meta.size)}`, `Type: ${meta.type}`,
      `Modified: ${meta.lastModified}`, `Dimensions: ${meta.width ?? "N/A"} x ${meta.height ?? "N/A"}`, "",
      ...meta.exif.map((e) => `${e.tag}: ${e.value}`)
    ].join("\n"));
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  function resetToOriginal() { if (fileRef.current) handleFile(fileRef.current); }

  return (
    <div className="space-y-4">
      <Card title="Image Metadata Editor">
        <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-sky-300 hover:bg-sky-50">
          <span className="text-sm font-semibold text-slate-700">Select an image</span>
          <input type="file" accept="image/*" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
        </label>
        {loading && <p className="mt-3 text-sm text-slate-500">Reading metadata...</p>}
        {previewUrl && (
          <div className="mt-4 flex justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded-xl object-contain" />
          </div>
        )}
      </Card>

      {meta && (
        <>
          <Card title="File Info">
            <p className="mb-3 text-xs text-slate-500">Click any value to edit it.</p>
            <div className="space-y-2">
              <EditableRow label="File name" value={meta.name} onChange={(v) => updateFileField("name", v)} />
              <EditableRow label="File size" value={formatBytes(meta.size)} onChange={() => {}} />
              <EditableRow label="MIME type" value={meta.type} onChange={(v) => updateFileField("type", v)} />
              <EditableRow label="Modified" value={meta.lastModified} onChange={(v) => updateFileField("lastModified", v)} />
              <EditableRow label="Width" value={meta.width ? meta.width + "px" : "N/A"} onChange={() => {}} />
              <EditableRow label="Height" value={meta.height ? meta.height + "px" : "N/A"} onChange={() => {}} />
              <EditableRow label="Megapixels" value={meta.width && meta.height ? (meta.width * meta.height / 1_000_000).toFixed(2) + " MP" : "N/A"} onChange={() => {}} />
            </div>
          </Card>

          <Card title={"Metadata (" + meta.exif.length + " tags)"}>
            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={handleCopyAll} className={copied ? "rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 transition" : softButtonClass}>
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button type="button" onClick={resetToOriginal} className={softButtonClass}>Reset to original</button>
            </div>

            {meta.exif.length === 0 ? (
              <p className="text-sm text-slate-500">No EXIF metadata found in this image.</p>
            ) : (
              <p className="mb-3 text-xs text-slate-500">Click any value to edit. Hover to delete.</p>
            )}

            <div className="space-y-2">
              {meta.exif.map((entry, i) => (
                <EditableRow key={i} label={entry.tag} value={entry.value} onChange={(v) => updateExif(i, v)} onDelete={() => deleteExif(i)} />
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tag name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" />
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" />
              <button type="button" onClick={addEntry} disabled={!newTag.trim() || !newValue.trim()} className={buttonClass + " disabled:opacity-40"}>Add tag</button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
