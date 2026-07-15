"use client";

export const textAreaClass =
  "min-h-56 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
export const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
export const buttonClass =
  "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800";
export const softButtonClass =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
export const smallInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

export function copyText(value: string) {
  if (!value) return;
  void navigator.clipboard?.writeText(value);
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OutputBox({ value, label = "Output" }: { value: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <button type="button" onClick={() => copyText(value)} className="text-xs font-bold text-sky-700 transition hover:text-sky-900">
          Copy
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6 text-slate-800">{value || "No output yet."}</pre>
    </div>
  );
}
