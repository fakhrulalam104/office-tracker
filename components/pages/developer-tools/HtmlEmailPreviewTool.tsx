"use client";

import { useState } from "react";
import { Card, textAreaClass, buttonClass, softButtonClass } from "./shared";

const sampleHtml = `<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
  .header { background: #0f172a; color: white; padding: 24px; text-align: center; }
  .content { padding: 24px; color: #334155; line-height: 1.6; }
  .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
  .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome!</h1></div>
    <div class="content">
      <p>Hello there,</p>
      <p>We're excited to have you on board. Click below to get started.</p>
      <p><a href="#" class="button">Get Started</a></p>
    </div>
    <div class="footer">You received this email because you signed up.</div>
  </div>
</body>
</html>`;

export function HtmlEmailPreviewTool() {
  const [html, setHtml] = useState(sampleHtml);
  const [mode, setMode] = useState<"light" | "dark">("light");

  return (
    <div className="space-y-4">
      <Card title="HTML Email Code">
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} className={`${textAreaClass} min-h-48`} />
      </Card>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("light")} className={mode === "light" ? buttonClass : softButtonClass}>Light</button>
            <button type="button" onClick={() => setMode("dark")} className={mode === "dark" ? buttonClass : softButtonClass}>Dark</button>
          </div>
        </div>
        <div className={`mt-4 overflow-hidden rounded-2xl border border-slate-200 ${mode === "dark" ? "bg-slate-900" : "bg-slate-100"} p-4`}>
          <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg bg-white shadow-lg">
            <iframe
              srcDoc={html}
              title="Email preview"
              className="h-[500px] w-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
