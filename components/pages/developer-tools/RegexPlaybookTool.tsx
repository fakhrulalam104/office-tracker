"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, inputClass, textAreaClass } from "./shared";

type Pattern = {
  name: string;
  pattern: string;
  description: string;
  testValue: string;
};

const patterns: Pattern[] = [
  { name: "Email", pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$", description: "Standard email addresses", testValue: "user@example.com\ninvalid@.com\nname.surname@domain.co.uk" },
  { name: "Phone (US)", pattern: "^\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$", description: "US phone numbers", testValue: "+1 (555) 123-4567\n555-123-4567\n5551234567" },
  { name: "URL", pattern: "^https?:\\/\\/[\\w.-]+(?:\\.[\\w]+)+[\\w.,@?^=%&:/~+#-]*$", description: "HTTP/HTTPS URLs", testValue: "https://example.com\nhttp://sub.domain.org/path?q=1\nftp://invalid" },
  { name: "IPv4", pattern: "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$", description: "IPv4 addresses", testValue: "192.168.1.1\n255.255.255.0\n999.999.999.999" },
  { name: "Credit Card", pattern: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$", description: "Visa, MasterCard, Amex", testValue: "4111111111111111\n5500000000000004\n378282246310005" },
  { name: "Date (YYYY-MM-DD)", pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$", description: "ISO date format", testValue: "2024-01-15\n2024-12-31\n2024-13-01" },
  { name: "Hex Color", pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$", description: "CSS hex colors", testValue: "#fff\n#0ea5e9\n#000000\n#xyz" },
  { name: "Strong Password", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", description: "Min 8 chars, upper, lower, digit, symbol", testValue: "Passw0rd!\nweak\nStrong123@" },
  { name: "HTML Tag", pattern: "<([a-z][a-z0-9]*)\\b[^>]*>.*?</\\1>", description: "Matching HTML opening/closing tags", testValue: "<div>hello</div>\n<p>text</p>\n<br>" },
  { name: "Username", pattern: "^[a-zA-Z0-9_]{3,20}$", description: "3-20 alphanumeric + underscore", testValue: "john_doe\nab\nvalidUser123" },
];

export function RegexPlaybookTool() {
  const [active, setActive] = useState(0);
  const [testInput, setTestInput] = useState(patterns[0].testValue);

  const pattern = patterns[active];

  const matches = useMemo(() => {
    try {
      const regex = new RegExp(pattern.pattern, "gm");
      const lines = testInput.split("\n");
      return lines.map((line) => {
        const m = line.match(regex);
        return { line, matched: !!m, matches: m ?? [] };
      });
    } catch {
      return [{ line: testInput, matched: false, matches: [] }];
    }
  }, [pattern.pattern, testInput]);

  return (
    <div className="space-y-4">
      <Card title="Pattern Library">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p, i) => (
            <button key={i} type="button" onClick={() => { setActive(i); setTestInput(p.testValue); }}
              className={`rounded-2xl border px-4 py-3 text-left transition ${i === active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
              <span className="block text-sm font-semibold">{p.name}</span>
              <span className="mt-1 block text-xs opacity-70">{p.description}</span>
            </button>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={pattern.name + " Pattern"}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Regex</span>
            <p className="mt-1 font-mono text-sm text-sky-700 break-all">{pattern.pattern}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">{pattern.description}</p>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Test input</span>
            <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} className={"mt-2 " + textAreaClass + " min-h-32"} />
          </label>
        </Card>
        <Card title="Test Results">
          <div className="space-y-2">
            {matches.map((m, i) => (
              <div key={i} className={"flex items-center gap-3 rounded-xl border px-3 py-2 text-sm " + (m.matched ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                <span className={"shrink-0 h-2 w-2 rounded-full " + (m.matched ? "bg-emerald-500" : "bg-slate-300")} />
                <span className={"flex-1 font-mono break-all " + (m.matched ? "text-emerald-800" : "text-slate-600")}>{m.line}</span>
                {m.matches.length > 0 && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{m.matches.length}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
