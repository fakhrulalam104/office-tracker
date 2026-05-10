"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ToolKey =
  | "json"
  | "jwt"
  | "base64"
  | "url"
  | "uuid"
  | "hash"
  | "regex"
  | "timestamp"
  | "color"
  | "diff"
  | "markdown"
  | "csv"
  | "api"
  | "dummy"
  | "qr";

const tools: { key: ToolKey; label: string; hint: string }[] = [
  { key: "json", label: "JSON", hint: "Format, minify, validate" },
  { key: "jwt", label: "JWT", hint: "Decode header and payload" },
  { key: "base64", label: "Base64", hint: "Encode and decode text" },
  { key: "url", label: "URL", hint: "Encode, decode, inspect params" },
  { key: "uuid", label: "UUID", hint: "Generate bulk IDs" },
  { key: "hash", label: "Hash", hint: "MD5, SHA-1, SHA-256" },
  { key: "regex", label: "Regex", hint: "Test matches and groups" },
  { key: "timestamp", label: "Timestamp", hint: "Unix and human dates" },
  { key: "color", label: "Color", hint: "HEX, RGB, HSL, contrast" },
  { key: "diff", label: "Diff", hint: "Compare text line by line" },
  { key: "markdown", label: "Markdown", hint: "Preview docs quickly" },
  { key: "csv", label: "CSV/JSON", hint: "Convert tabular data" },
  { key: "api", label: "API", hint: "Light request builder" },
  { key: "dummy", label: "Dummy Data", hint: "Mock users and text" },
  { key: "qr", label: "QR Code", hint: "Generate link codes" }
];

const textAreaClass =
  "min-h-56 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
const buttonClass = "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800";
const softButtonClass = "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

function copyText(value: string) {
  if (!value) {
    return;
  }

  void navigator.clipboard?.writeText(value);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function base64Encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64Decode(value: string) {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return base64Decode(padded);
}

function md5(value: string) {
  function rotateLeft(number: number, bits: number) {
    return (number << bits) | (number >>> (32 - bits));
  }

  function addUnsigned(left: number, right: number) {
    const leftHigh = left & 0x80000000;
    const rightHigh = right & 0x80000000;
    const leftLow = left & 0x40000000;
    const rightLow = right & 0x40000000;
    const result = (left & 0x3fffffff) + (right & 0x3fffffff);

    if (leftLow & rightLow) {
      return result ^ 0x80000000 ^ leftHigh ^ rightHigh;
    }

    if (leftLow | rightLow) {
      return result & 0x40000000 ? result ^ 0xc0000000 ^ leftHigh ^ rightHigh : result ^ 0x40000000 ^ leftHigh ^ rightHigh;
    }

    return result ^ leftHigh ^ rightHigh;
  }

  function f(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }

  function g(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }

  function h(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }

  function i(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function round(fn: (x: number, y: number, z: number) => number, a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, fn(b, c, d)), addUnsigned(x, ac)), s), b);
  }

  function toWords(input: string) {
    const bytes = new TextEncoder().encode(input);
    const wordCount = (((bytes.length + 8) >>> 6) + 1) * 16;
    const words = new Array<number>(wordCount).fill(0);

    bytes.forEach((byte, index) => {
      words[index >> 2] |= byte << ((index % 4) * 8);
    });

    words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
    words[wordCount - 2] = bytes.length * 8;
    return words;
  }

  function toHex(number: number) {
    let output = "";
    for (let index = 0; index <= 3; index += 1) {
      output += ((number >>> (index * 8)) & 255).toString(16).padStart(2, "0");
    }
    return output;
  }

  const words = toWords(value);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < words.length; k += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = round(f, a, b, c, d, words[k], 7, 0xd76aa478);
    d = round(f, d, a, b, c, words[k + 1], 12, 0xe8c7b756);
    c = round(f, c, d, a, b, words[k + 2], 17, 0x242070db);
    b = round(f, b, c, d, a, words[k + 3], 22, 0xc1bdceee);
    a = round(f, a, b, c, d, words[k + 4], 7, 0xf57c0faf);
    d = round(f, d, a, b, c, words[k + 5], 12, 0x4787c62a);
    c = round(f, c, d, a, b, words[k + 6], 17, 0xa8304613);
    b = round(f, b, c, d, a, words[k + 7], 22, 0xfd469501);
    a = round(f, a, b, c, d, words[k + 8], 7, 0x698098d8);
    d = round(f, d, a, b, c, words[k + 9], 12, 0x8b44f7af);
    c = round(f, c, d, a, b, words[k + 10], 17, 0xffff5bb1);
    b = round(f, b, c, d, a, words[k + 11], 22, 0x895cd7be);
    a = round(f, a, b, c, d, words[k + 12], 7, 0x6b901122);
    d = round(f, d, a, b, c, words[k + 13], 12, 0xfd987193);
    c = round(f, c, d, a, b, words[k + 14], 17, 0xa679438e);
    b = round(f, b, c, d, a, words[k + 15], 22, 0x49b40821);

    a = round(g, a, b, c, d, words[k + 1], 5, 0xf61e2562);
    d = round(g, d, a, b, c, words[k + 6], 9, 0xc040b340);
    c = round(g, c, d, a, b, words[k + 11], 14, 0x265e5a51);
    b = round(g, b, c, d, a, words[k], 20, 0xe9b6c7aa);
    a = round(g, a, b, c, d, words[k + 5], 5, 0xd62f105d);
    d = round(g, d, a, b, c, words[k + 10], 9, 0x2441453);
    c = round(g, c, d, a, b, words[k + 15], 14, 0xd8a1e681);
    b = round(g, b, c, d, a, words[k + 4], 20, 0xe7d3fbc8);
    a = round(g, a, b, c, d, words[k + 9], 5, 0x21e1cde6);
    d = round(g, d, a, b, c, words[k + 14], 9, 0xc33707d6);
    c = round(g, c, d, a, b, words[k + 3], 14, 0xf4d50d87);
    b = round(g, b, c, d, a, words[k + 8], 20, 0x455a14ed);
    a = round(g, a, b, c, d, words[k + 13], 5, 0xa9e3e905);
    d = round(g, d, a, b, c, words[k + 2], 9, 0xfcefa3f8);
    c = round(g, c, d, a, b, words[k + 7], 14, 0x676f02d9);
    b = round(g, b, c, d, a, words[k + 12], 20, 0x8d2a4c8a);

    a = round(h, a, b, c, d, words[k + 5], 4, 0xfffa3942);
    d = round(h, d, a, b, c, words[k + 8], 11, 0x8771f681);
    c = round(h, c, d, a, b, words[k + 11], 16, 0x6d9d6122);
    b = round(h, b, c, d, a, words[k + 14], 23, 0xfde5380c);
    a = round(h, a, b, c, d, words[k + 1], 4, 0xa4beea44);
    d = round(h, d, a, b, c, words[k + 4], 11, 0x4bdecfa9);
    c = round(h, c, d, a, b, words[k + 7], 16, 0xf6bb4b60);
    b = round(h, b, c, d, a, words[k + 10], 23, 0xbebfbc70);
    a = round(h, a, b, c, d, words[k + 13], 4, 0x289b7ec6);
    d = round(h, d, a, b, c, words[k], 11, 0xeaa127fa);
    c = round(h, c, d, a, b, words[k + 3], 16, 0xd4ef3085);
    b = round(h, b, c, d, a, words[k + 6], 23, 0x4881d05);
    a = round(h, a, b, c, d, words[k + 9], 4, 0xd9d4d039);
    d = round(h, d, a, b, c, words[k + 12], 11, 0xe6db99e5);
    c = round(h, c, d, a, b, words[k + 15], 16, 0x1fa27cf8);
    b = round(h, b, c, d, a, words[k + 2], 23, 0xc4ac5665);

    a = round(i, a, b, c, d, words[k], 6, 0xf4292244);
    d = round(i, d, a, b, c, words[k + 7], 10, 0x432aff97);
    c = round(i, c, d, a, b, words[k + 14], 15, 0xab9423a7);
    b = round(i, b, c, d, a, words[k + 5], 21, 0xfc93a039);
    a = round(i, a, b, c, d, words[k + 12], 6, 0x655b59c3);
    d = round(i, d, a, b, c, words[k + 3], 10, 0x8f0ccc92);
    c = round(i, c, d, a, b, words[k + 10], 15, 0xffeff47d);
    b = round(i, b, c, d, a, words[k + 1], 21, 0x85845dd1);
    a = round(i, a, b, c, d, words[k + 8], 6, 0x6fa87e4f);
    d = round(i, d, a, b, c, words[k + 15], 10, 0xfe2ce6e0);
    c = round(i, c, d, a, b, words[k + 6], 15, 0xa3014314);
    b = round(i, b, c, d, a, words[k + 13], 21, 0x4e0811a1);
    a = round(i, a, b, c, d, words[k + 4], 6, 0xf7537e82);
    d = round(i, d, a, b, c, words[k + 11], 10, 0xbd3af235);
    c = round(i, c, d, a, b, words[k + 2], 15, 0x2ad7d2bb);
    b = round(i, b, c, d, a, words[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  return `${toHex(a)}${toHex(b)}${toHex(c)}${toHex(d)}`;
}

async function digest(value: string, algorithm: "SHA-1" | "SHA-256") {
  const hash = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

function csvToJson(input: string) {
  const rows = parseCsv(input);
  const headers = rows[0] ?? [];
  return rows.slice(1).map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header || `column_${index + 1}`] = row[index] ?? "";
      return record;
    }, {})
  );
}

function jsonToCsv(input: string) {
  const parsed = JSON.parse(input) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const objects = rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null && !Array.isArray(row));
  const headers = Array.from(new Set(objects.flatMap((row) => Object.keys(row))));
  const escapeCell = (value: unknown) => {
    const text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [headers.join(","), ...objects.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
}

function renderMarkdown(input: string) {
  const lines = escapeHtml(input).split("\n");
  let inList = false;
  let inCode = false;
  let html = "";

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      html += inCode ? "</code></pre>" : "<pre><code>";
      inCode = !inCode;
      return;
    }

    if (inCode) {
      html += `${line}\n`;
      return;
    }

    const inline = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

    if (/^###\s/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${inline.replace(/^###\s/, "")}</h3>`;
    } else if (/^##\s/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${inline.replace(/^##\s/, "")}</h2>`;
    } else if (/^#\s/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1>${inline.replace(/^#\s/, "")}</h1>`;
    } else if (/^-\s/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline.replace(/^-\s/, "")}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += line.trim() ? `<p>${inline}</p>` : "<br />";
    }
  });

  if (inList) {
    html += "</ul>";
  }

  if (inCode) {
    html += "</code></pre>";
  }

  return html;
}

function diffLines(left: string, right: string) {
  const a = left.split("\n");
  const b = right.split("\n");
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: { type: "same" | "added" | "removed"; text: string }[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ type: "removed", text: a[i] });
      i += 1;
    } else {
      result.push({ type: "added", text: b[j] });
      j += 1;
    }
  }

  while (i < a.length) {
    result.push({ type: "removed", text: a[i] });
    i += 1;
  }

  while (j < b.length) {
    result.push({ type: "added", text: b[j] });
    j += 1;
  }

  return result;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error("Enter a valid HEX color.");
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    if (max === gg) h = (bb - rr) / d + 2;
    if (max === bb) h = (rr - gg) / d + 4;
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    const channel = (value: number) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  };

  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OutputBox({ value, label = "Output" }: { value: string; label?: string }) {
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

export function DeveloperToolsPageClient() {
  const [activeTool, setActiveTool] = useState<ToolKey>("json");
  const [jsonInput, setJsonInput] = useState('{"status":"ok","items":[1,2,3]}');
  const [jsonOutput, setJsonOutput] = useState("");
  const [jwtInput, setJwtInput] = useState("");
  const [base64Input, setBase64Input] = useState("Office Tracker");
  const [base64Output, setBase64Output] = useState("");
  const [urlInput, setUrlInput] = useState("https://example.com/search?q=office tools&role=admin");
  const [uuidCount, setUuidCount] = useState(5);
  const [uuids, setUuids] = useState("");
  const [hashInput, setHashInput] = useState("Office Tracker");
  const [hashOutput, setHashOutput] = useState("");
  const [regexPattern, setRegexPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [regexFlags, setRegexFlags] = useState("gi");
  const [regexText, setRegexText] = useState("Email support@example.com or admin@company.com");
  const [timestampInput, setTimestampInput] = useState(Math.floor(Date.now() / 1000).toString());
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 16));
  const [colorHex, setColorHex] = useState("#0f172a");
  const [contrastFg, setContrastFg] = useState("#0f172a");
  const [contrastBg, setContrastBg] = useState("#ffffff");
  const [leftDiff, setLeftDiff] = useState("const status = 'pending';\nreturn status;");
  const [rightDiff, setRightDiff] = useState("const status = 'approved';\nreturn status;");
  const [markdown, setMarkdown] = useState("# Release Notes\n\n- Added tools\n- Improved workflow\n\n**Ship it.**");
  const [csvInput, setCsvInput] = useState("name,email\nAda Lovelace,ada@example.com\nGrace Hopper,grace@example.com");
  const [csvOutput, setCsvOutput] = useState("");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiUrl, setApiUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [apiHeaders, setApiHeaders] = useState("{\n  \"Accept\": \"application/json\"\n}");
  const [apiBody, setApiBody] = useState("");
  const [apiOutput, setApiOutput] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [dummyCount, setDummyCount] = useState(5);
  const [dummyOutput, setDummyOutput] = useState("");
  const [qrText, setQrText] = useState("https://example.com");

  const jwtOutput = useMemo(() => {
    if (!jwtInput.trim()) {
      return "Paste a JWT to decode it.";
    }

    try {
      const [header, payload] = jwtInput.split(".");
      const decodedHeader = JSON.parse(decodeBase64Url(header));
      const decodedPayload = JSON.parse(decodeBase64Url(payload));
      const exp = typeof decodedPayload.exp === "number" ? new Date(decodedPayload.exp * 1000) : null;

      return JSON.stringify(
        {
          header: decodedHeader,
          payload: decodedPayload,
          expiresAt: exp ? exp.toLocaleString() : null,
          expired: exp ? exp.getTime() < Date.now() : null
        },
        null,
        2
      );
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid JWT.";
    }
  }, [jwtInput]);

  const urlOutput = useMemo(() => {
    try {
      const trimmed = urlInput.trim();
      const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(trimmed, "https://example.com");
      const params = Array.from(parsed.searchParams.entries()).map(([key, value]) => ({ key, value }));
      return JSON.stringify(
        {
          encoded: encodeURIComponent(urlInput),
          decoded: decodeURIComponent(urlInput),
          origin: parsed.origin,
          pathname: parsed.pathname,
          params
        },
        null,
        2
      );
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid URL.";
    }
  }, [urlInput]);

  const regexOutput = useMemo(() => {
    try {
      const flags = regexFlags.includes("g") ? regexFlags : `${regexFlags}g`;
      const regex = new RegExp(regexPattern, flags);
      const matches = Array.from(regexText.matchAll(regex)).map((match) => ({
        match: match[0],
        index: match.index,
        groups: match.slice(1)
      }));
      return JSON.stringify({ count: matches.length, matches }, null, 2);
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid regex.";
    }
  }, [regexFlags, regexPattern, regexText]);

  const timestampOutput = useMemo(() => {
    const seconds = Number(timestampInput);
    const fromTimestamp = Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
    const fromDate = dateInput ? new Date(dateInput) : null;
    return JSON.stringify(
      {
        timestampToDate: fromTimestamp
          ? {
              local: fromTimestamp.toLocaleString(),
              utc: fromTimestamp.toUTCString(),
              iso: fromTimestamp.toISOString()
            }
          : null,
        dateToTimestamp: fromDate && !Number.isNaN(fromDate.getTime()) ? Math.floor(fromDate.getTime() / 1000) : null
      },
      null,
      2
    );
  }, [dateInput, timestampInput]);

  const colorOutput = useMemo(() => {
    try {
      const rgb = hexToRgb(colorHex);
      const ratio = contrastRatio(contrastFg, contrastBg);
      return JSON.stringify(
        {
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb: `rgb(${rgb.r} ${rgb.g} ${rgb.b})`,
          hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
          contrast: `${ratio.toFixed(2)}:1`,
          wcagAA: ratio >= 4.5
        },
        null,
        2
      );
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid color.";
    }
  }, [colorHex, contrastBg, contrastFg]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrText)}`;

  function formatJson(spaces: number) {
    try {
      setJsonOutput(JSON.stringify(JSON.parse(jsonInput), null, spaces));
    } catch (error) {
      setJsonOutput(error instanceof Error ? error.message : "Invalid JSON.");
    }
  }

  async function generateHash() {
    const [sha1, sha256] = await Promise.all([digest(hashInput, "SHA-1"), digest(hashInput, "SHA-256")]);
    setHashOutput(JSON.stringify({ md5: md5(hashInput), sha1, sha256 }, null, 2));
  }

  async function sendApiRequest() {
    setApiLoading(true);
    setApiOutput("");

    try {
      const headers = apiHeaders.trim() ? (JSON.parse(apiHeaders) as HeadersInit) : undefined;
      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers,
        body: apiMethod === "GET" || apiMethod === "HEAD" ? undefined : apiBody || undefined
      });
      const text = await response.text();
      const pretty = (() => {
        try {
          return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          return text;
        }
      })();

      setApiOutput(
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: pretty
          },
          null,
          2
        )
      );
    } catch (error) {
      setApiOutput(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setApiLoading(false);
    }
  }

  function generateDummyData() {
    const first = ["Ada", "Grace", "Linus", "Margaret", "Ken", "Radia", "Donald", "Barbara"];
    const last = ["Lovelace", "Hopper", "Torvalds", "Hamilton", "Thompson", "Perlman", "Knuth", "Liskov"];
    const roles = ["Frontend Engineer", "Backend Engineer", "QA Engineer", "DevOps Engineer", "Product Manager"];
    const users = Array.from({ length: dummyCount }, (_, index) => {
      const name = `${first[index % first.length]} ${last[(index * 3) % last.length]}`;
      return {
        id: crypto.randomUUID(),
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        phone: `+1-555-${String(1000 + index).padStart(4, "0")}`,
        role: roles[index % roles.length]
      };
    });
    setDummyOutput(JSON.stringify(users, null, 2));
  }

  function renderActiveTool() {
    if (activeTool === "json") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Input">
            <textarea value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} className={textAreaClass} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => formatJson(2)} className={buttonClass}>
                Format
              </button>
              <button type="button" onClick={() => formatJson(0)} className={softButtonClass}>
                Minify
              </button>
            </div>
          </Card>
          <OutputBox value={jsonOutput} />
        </div>
      );
    }

    if (activeTool === "jwt") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Token">
            <textarea value={jwtInput} onChange={(event) => setJwtInput(event.target.value)} placeholder="eyJhbGciOi..." className={textAreaClass} />
          </Card>
          <OutputBox value={jwtOutput} label="Decoded token" />
        </div>
      );
    }

    if (activeTool === "base64") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Text">
            <textarea value={base64Input} onChange={(event) => setBase64Input(event.target.value)} className={textAreaClass} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setBase64Output(base64Encode(base64Input))} className={buttonClass}>
                Encode
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    setBase64Output(base64Decode(base64Input));
                  } catch (error) {
                    setBase64Output(error instanceof Error ? error.message : "Invalid Base64.");
                  }
                }}
                className={softButtonClass}
              >
                Decode
              </button>
            </div>
          </Card>
          <OutputBox value={base64Output} />
        </div>
      );
    }

    if (activeTool === "url") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="URL">
            <textarea value={urlInput} onChange={(event) => setUrlInput(event.target.value)} className={textAreaClass} />
          </Card>
          <OutputBox value={urlOutput} label="Parsed URL" />
        </div>
      );
    }

    if (activeTool === "uuid") {
      return (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card title="Generator">
            <label className="text-sm font-semibold text-slate-700">How many IDs?</label>
            <input type="number" min={1} max={100} value={uuidCount} onChange={(event) => setUuidCount(Number(event.target.value))} className={`mt-2 ${inputClass}`} />
            <button
              type="button"
              onClick={() => setUuids(Array.from({ length: Math.max(1, Math.min(100, uuidCount)) }, () => crypto.randomUUID()).join("\n"))}
              className={`mt-4 ${buttonClass}`}
            >
              Generate
            </button>
          </Card>
          <OutputBox value={uuids} label="UUIDs" />
        </div>
      );
    }

    if (activeTool === "hash") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Text">
            <textarea value={hashInput} onChange={(event) => setHashInput(event.target.value)} className={textAreaClass} />
            <button type="button" onClick={() => void generateHash()} className={`mt-3 ${buttonClass}`}>
              Generate hashes
            </button>
          </Card>
          <OutputBox value={hashOutput} />
        </div>
      );
    }

    if (activeTool === "regex") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Pattern">
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <input value={regexPattern} onChange={(event) => setRegexPattern(event.target.value)} className={inputClass} />
              <input value={regexFlags} onChange={(event) => setRegexFlags(event.target.value)} className={inputClass} />
            </div>
            <textarea value={regexText} onChange={(event) => setRegexText(event.target.value)} className={`mt-3 ${textAreaClass}`} />
          </Card>
          <OutputBox value={regexOutput} label="Matches" />
        </div>
      );
    }

    if (activeTool === "timestamp") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Convert">
            <label className="text-sm font-semibold text-slate-700">Unix timestamp</label>
            <input value={timestampInput} onChange={(event) => setTimestampInput(event.target.value)} className={`mt-2 ${inputClass}`} />
            <label className="mt-4 block text-sm font-semibold text-slate-700">Human date</label>
            <input type="datetime-local" value={dateInput} onChange={(event) => setDateInput(event.target.value)} className={`mt-2 ${inputClass}`} />
          </Card>
          <OutputBox value={timestampOutput} />
        </div>
      );
    }

    if (activeTool === "color") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Color">
            <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
              <input type="color" value={colorHex} onChange={(event) => setColorHex(event.target.value)} className="h-12 w-24 rounded-xl border border-slate-200 bg-white p-1" />
              <input value={colorHex} onChange={(event) => setColorHex(event.target.value)} className={inputClass} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={contrastFg} onChange={(event) => setContrastFg(event.target.value)} className={inputClass} />
              <input value={contrastBg} onChange={(event) => setContrastBg(event.target.value)} className={inputClass} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-6 text-center font-semibold" style={{ color: contrastFg, backgroundColor: contrastBg }}>
              Contrast preview
            </div>
          </Card>
          <OutputBox value={colorOutput} />
        </div>
      );
    }

    if (activeTool === "diff") {
      const diff = diffLines(leftDiff, rightDiff);
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Original">
              <textarea value={leftDiff} onChange={(event) => setLeftDiff(event.target.value)} className={textAreaClass} />
            </Card>
            <Card title="Changed">
              <textarea value={rightDiff} onChange={(event) => setRightDiff(event.target.value)} className={textAreaClass} />
            </Card>
          </div>
          <Card title="Line diff">
            <div className="overflow-hidden rounded-2xl border border-slate-200 font-mono text-sm">
              {diff.map((line, index) => (
                <div
                  key={`${line.type}-${index}`}
                  className={`grid grid-cols-[44px_1fr] gap-3 px-3 py-2 ${
                    line.type === "added" ? "bg-emerald-50 text-emerald-900" : line.type === "removed" ? "bg-rose-50 text-rose-900" : "bg-white text-slate-700"
                  }`}
                >
                  <span className="select-none text-slate-400">{line.type === "added" ? "+" : line.type === "removed" ? "-" : ""}</span>
                  <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    if (activeTool === "markdown") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Markdown">
            <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} className={textAreaClass} />
          </Card>
          <Card title="Preview">
            <div
              className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-800 prose-a:text-sky-700"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </Card>
        </div>
      );
    }

    if (activeTool === "csv") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Input">
            <textarea value={csvInput} onChange={(event) => setCsvInput(event.target.value)} className={textAreaClass} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    setCsvOutput(JSON.stringify(csvToJson(csvInput), null, 2));
                  } catch (error) {
                    setCsvOutput(error instanceof Error ? error.message : "Conversion failed.");
                  }
                }}
                className={buttonClass}
              >
                CSV to JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    setCsvOutput(jsonToCsv(csvInput));
                  } catch (error) {
                    setCsvOutput(error instanceof Error ? error.message : "Conversion failed.");
                  }
                }}
                className={softButtonClass}
              >
                JSON to CSV
              </button>
            </div>
          </Card>
          <OutputBox value={csvOutput} />
        </div>
      );
    }

    if (activeTool === "api") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Request">
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <select value={apiMethod} onChange={(event) => setApiMethod(event.target.value)} className={inputClass}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} className={inputClass} />
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Headers JSON</label>
            <textarea value={apiHeaders} onChange={(event) => setApiHeaders(event.target.value)} className={`mt-2 min-h-32 ${textAreaClass}`} />
            <label className="mt-4 block text-sm font-semibold text-slate-700">Body</label>
            <textarea value={apiBody} onChange={(event) => setApiBody(event.target.value)} className={`mt-2 min-h-32 ${textAreaClass}`} />
            <button type="button" onClick={() => void sendApiRequest()} className={`mt-3 ${buttonClass}`} disabled={apiLoading}>
              {apiLoading ? "Sending..." : "Send request"}
            </button>
          </Card>
          <OutputBox value={apiOutput} label="Response" />
        </div>
      );
    }

    if (activeTool === "dummy") {
      return (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card title="Mock users">
            <input type="number" min={1} max={50} value={dummyCount} onChange={(event) => setDummyCount(Number(event.target.value))} className={inputClass} />
            <button type="button" onClick={generateDummyData} className={`mt-4 ${buttonClass}`}>
              Generate
            </button>
          </Card>
          <OutputBox value={dummyOutput} />
        </div>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card title="QR code">
          <textarea value={qrText} onChange={(event) => setQrText(event.target.value)} className="min-h-40 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
          <a href={qrUrl} download="qr-code.png" className={`mt-4 inline-flex ${buttonClass}`}>
            Download QR
          </a>
        </Card>
        <Card title="Preview">
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {qrText.trim() ? <img src={qrUrl} alt="Generated QR code" className="h-64 w-64 rounded-xl border border-slate-200 bg-white p-3" /> : <p className="text-sm text-slate-500">Enter text to generate a QR code.</p>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/features" className="text-sm font-semibold text-sky-700 transition hover:text-sky-900">
              Back to tools
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Developer Tools</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Small utilities for common IT, QA, frontend, backend, and support workflows.</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-6 xl:self-start">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {tools.map((tool) => (
                <button
                  key={tool.key}
                  type="button"
                  onClick={() => setActiveTool(tool.key)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    activeTool === tool.key ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-sm font-semibold">{tool.label}</span>
                  <span className={`mt-1 block text-xs ${activeTool === tool.key ? "text-slate-300" : "text-slate-500"}`}>{tool.hint}</span>
                </button>
              ))}
            </div>
          </aside>

          <main>{renderActiveTool()}</main>
        </div>
      </div>
    </div>
  );
}
