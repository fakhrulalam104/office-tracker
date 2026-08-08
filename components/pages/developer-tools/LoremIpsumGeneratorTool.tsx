"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

const words = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum"
];

const names = ["James Smith", "Maria Garcia", "Robert Johnson", "Emily Chen", "David Kim", "Sarah Johnson", "Michael Lee", "Jennifer Wang"];
const emails = ["james@example.com", "maria@test.com", "robert@mail.com", "emily@work.com", "david@corp.com", "sarah@site.com", "michael@demo.com", "jenny@app.com"];
const cities = ["New York", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Toronto", "Seoul"];
const streets = ["123 Main St", "456 Oak Ave", "789 Pine Rd", "321 Elm Blvd", "654 Maple Dr", "987 Cedar Ln"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWord() {
  return randomFrom(words);
}

function generateSentence() {
  const len = randomInt(8, 18);
  const sentence = Array.from({ length: len }, generateWord);
  sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
  return sentence.join(" ") + ".";
}

function generateParagraph() {
  const len = randomInt(4, 8);
  return Array.from({ length: len }, generateSentence).join(" ");
}

function generateName() { return randomFrom(names); }
function generateEmail() { return randomFrom(emails); }
function generatePhone() { return "+1-555-" + String(randomInt(100, 999)) + "-" + String(randomInt(1000, 9999)); }
function generateAddress() { return randomInt(1, 999) + " " + randomFrom(streets) + ", " + randomFrom(cities); }

type OutputType = "paragraphs" | "sentences" | "words" | "names" | "emails" | "phones" | "addresses" | "users";

const outputTypes: { key: OutputType; label: string }[] = [
  { key: "paragraphs", label: "Paragraphs" },
  { key: "sentences", label: "Sentences" },
  { key: "words", label: "Words" },
  { key: "names", label: "Names" },
  { key: "emails", label: "Emails" },
  { key: "phones", label: "Phones" },
  { key: "addresses", label: "Addresses" },
  { key: "users", label: "Users" }
];

export function LoremIpsumGeneratorTool() {
  const [count, setCount] = useState(5);
  const [type, setType] = useState<OutputType>("paragraphs");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const output = useMemo(() => {
    switch (type) {
      case "paragraphs": return Array.from({ length: count }, generateParagraph).join("\n\n");
      case "sentences": return Array.from({ length: count }, generateSentence).join(" ");
      case "words": return Array.from({ length: count }, generateWord).join(" ");
      case "names": return Array.from({ length: count }, generateName).join("\n");
      case "emails": return Array.from({ length: count }, generateEmail).join("\n");
      case "phones": return Array.from({ length: count }, generatePhone).join("\n");
      case "addresses": return Array.from({ length: count }, generateAddress).join("\n");
      case "users": return Array.from({ length: count }, (_, i) => JSON.stringify({ id: i + 1, name: generateName(), email: generateEmail(), phone: generatePhone(), address: generateAddress() }, null, 2)).join("\n\n");
    }
  }, [count, type]);

  return (
    <div className="space-y-4">
      <Card title="Generator Options">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as OutputType)} className={"mt-1 " + inputClass}>
              {outputTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Count</span>
            <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} className={"mt-1 " + inputClass} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              copyText(output);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
            className={buttonClass + " active:scale-95 disabled:opacity-50 " + (copied ? "bg-emerald-600 hover:bg-emerald-600" : "")}
          >
            {copied ? "✓ Copied!" : "Copy output"}
          </button>
          <button
            type="button"
            onClick={() => {
              const b = new Blob([output], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(b);
              a.download = "lorem-" + type + ".txt";
              a.click();
              setDownloaded(true);
              window.setTimeout(() => setDownloaded(false), 1600);
            }}
            className={softButtonClass + " active:scale-95 disabled:opacity-50 " + (downloaded ? "text-emerald-600" : "")}
          >
            {downloaded ? "✓ Downloaded" : "Download .txt"}
          </button>
        </div>
      </Card>
      <OutputBox value={output} label="Generated text" />
    </div>
  );
}
