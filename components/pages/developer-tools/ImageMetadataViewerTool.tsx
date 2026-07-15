"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, formatBytes } from "./shared";

type Metadata = {
  name: string;
  size: number;
  type: string;
  lastModified: string;
  width: number | null;
  height: number | null;
  exif: Record<string, string>;
};

async function getMetadata(file: File): Promise<Metadata> {
  const meta: Metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleString(),
    width: null,
    height: null,
    exif: {}
  };

  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = url;
    });
    meta.width = img.naturalWidth;
    meta.height = img.naturalHeight;
    URL.revokeObjectURL(url);
  } catch {}

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    if (view.getUint16(0, false) === 0xFFD8) {
      let offset = 2;
      while (offset < view.byteLength - 1) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          const exifLength = view.getUint16(offset + 2, false);
          const exifStart = offset + 4;
          const tiffOffset = exifStart;
          const bigEndian = view.getUint16(tiffOffset, false) === 0x4D4D;

          const ifdOffset = view.getUint32(tiffOffset + 4, !bigEndian) + tiffOffset;
          const numEntries = view.getUint16(ifdOffset, !bigEndian);

          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + i * 12;
            if (entryOffset + 12 > view.byteLength) break;
            const tag = view.getUint16(entryOffset, !bigEndian);
            const type = view.getUint16(entryOffset + 2, !bigEndian);
            const count = view.getUint32(entryOffset + 4, !bigEndian);

            const tagNames: Record<number, string> = {
              0x010F: "Make", 0x0110: "Model", 0x0112: "Orientation",
              0x011A: "XResolution", 0x011B: "YResolution",
              0x0131: "Software", 0x0132: "DateTime",
              0x0213: "YCbCrPositioning", 0x8769: "ExifOffset"
            };

            if (tagNames[tag]) {
              let val = "";
              if (type === 2 && count <= 100) {
                const strOffset = count <= 4 ? entryOffset + 8 : view.getUint32(entryOffset + 8, !bigEndian) + tiffOffset;
                for (let c = 0; c < count - 1; c++) {
                  val += String.fromCharCode(view.getUint8(strOffset + c));
                }
              } else if (type === 3) {
                val = String(view.getUint16(entryOffset + 8, !bigEndian));
              } else if (type === 4) {
                val = String(view.getUint32(entryOffset + 8, !bigEndian));
              }
              if (val) meta.exif[tagNames[tag]] = val;
            }
          }
          break;
        }
        offset += 2;
      }
    }
  } catch {}

  return meta;
}

export function ImageMetadataViewerTool() {
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) {
      setMeta(null);
      return;
    }
    setLoading(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    try {
      const data = await getMetadata(file);
      setMeta(data);
    } catch {
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  const output = useMemo(() => {
    if (!meta) return "";
    const rows = [
      ["File name", meta.name],
      ["File size", formatBytes(meta.size)],
      ["MIME type", meta.type],
      ["Last modified", meta.lastModified],
      ["Width", meta.width ? meta.width + "px" : "N/A"],
      ["Height", meta.height ? meta.height + "px" : "N/A"],
      ["Megapixels", meta.width && meta.height ? (meta.width * meta.height / 1_000_000).toFixed(2) + " MP" : "N/A"],
      ...Object.entries(meta.exif).map(([k, v]) => ["EXIF: " + k, v])
    ];
    return rows.map(([k, v]) => k.padEnd(22) + v).join("\n");
  }, [meta]);

  return (
    <div className="space-y-4">
      <Card title="Image Metadata Viewer">
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
      {output && <OutputBox value={output} label="Metadata" />}
    </div>
  );
}
