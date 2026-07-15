"use client";

import { useMemo, useState } from "react";
import { Card, textAreaClass, buttonClass, softButtonClass, copyText } from "./shared";

const sampleMarkdown = `# Welcome to Slides
## Your presentation title

---

# Section One
- Point one
- Point two
- Point three

---

# Section Two
Some content here with **bold** and *italic* text.

---

# Thank You
Questions?`;

function parseSlides(markdown: string): string[][] {
  const slides = markdown.split(/\n---\n/);
  return slides.map((slide) => slide.split("\n").filter((line) => line.trim()));
}

function renderSlide(lines: string[]) {
  return lines.map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-bold text-slate-950">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-semibold text-slate-800">{line.slice(3)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-lg text-slate-700">{line.slice(2)}</li>;
    return <p key={i} className="text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />;
  });
}

export function MarkdownToSlidesTool() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = useMemo(() => parseSlides(markdown), [markdown]);

  function prev() { setCurrentSlide((s) => Math.max(0, s - 1)); }
  function next() { setCurrentSlide((s) => Math.min(slides.length - 1, s + 1)); }

  function exportPrintable() {
    const html = `<!DOCTYPE html><html><head><style>
body{font-family:system-ui;margin:0;padding:0}
.slide{width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;box-sizing:border-box;page-break-after:always;text-align:center}
h1{font-size:3rem;margin:0 0 1rem}h2{font-size:2rem;margin:0 0 1rem}li{font-size:1.5rem;margin:.3rem 0}p{font-size:1.3rem;margin:.5rem 0}
@media print{.slide{page-break-after:always}}
</style></head><body>${slides.map((s) => `<div class="slide">${renderSlide(s).map((el) => (typeof el === "string" ? el : "")).join("")}</div>`).join("")}</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  return (
    <div className="space-y-4">
      <Card title="Markdown Input">
        <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} className={`${textAreaClass} min-h-40`} />
        <p className="mt-2 text-xs text-slate-500">Separate slides with <code className="rounded bg-slate-100 px-1 py-0.5">---</code> (three dashes on their own line)</p>
      </Card>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{currentSlide + 1} / {slides.length}</span>
            <button type="button" onClick={prev} disabled={currentSlide === 0} className={softButtonClass}>Prev</button>
            <button type="button" onClick={next} disabled={currentSlide === slides.length - 1} className={softButtonClass}>Next</button>
            <button type="button" onClick={exportPrintable} className={buttonClass}>Print / PDF</button>
          </div>
        </div>
        <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
          {slides[currentSlide] && renderSlide(slides[currentSlide])}
        </div>
        <div className="mt-3 flex justify-center gap-1">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition ${i === currentSlide ? "w-6 bg-slate-950" : "w-2 bg-slate-300"}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
