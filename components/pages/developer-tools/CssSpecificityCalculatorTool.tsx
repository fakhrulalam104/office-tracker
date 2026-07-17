"use client";

import { useState } from "react";
import { Card, inputClass, buttonClass, softButtonClass } from "./shared";

interface Specificity {
  inline: number;
  ids: number;
  classes: number;
  elements: number;
}

function calculateSpecificity(selector: string): Specificity {
  let inline = 0;
  let ids = 0;
  let classes = 0;
  let elements = 0;
  
  // Remove pseudo-classes and pseudo-elements for counting
  const cleaned = selector
    .replace(/::[\w-]+/g, "") // Remove pseudo-elements
    .replace(/:[\w-]+(\([^)]*\))?/g, ""); // Remove pseudo-classes
  
  // Count inline styles
  if (selector.startsWith("[style")) {
    inline = 1;
  }
  
  // Split by combinators
  const parts = cleaned.split(/[\s>+~]+/).filter(Boolean);
  
  for (const part of parts) {
    // Count IDs
    const idMatches = part.match(/#[\w-]+/g);
    ids += idMatches ? idMatches.length : 0;
    
    // Count classes, attributes
    const classMatches = part.match(/\.[\w-]+/g);
    classes += classMatches ? classMatches.length : 0;
    
    const attrMatches = part.match(/\[[^\]]+\]/g);
    classes += attrMatches ? attrMatches.length : 0;
    
    // Count elements (anything that's not an ID, class, or attribute)
    const elementPart = part
      .replace(/#[\w-]+/g, "")
      .replace(/\.[\w-]+/g, "")
      .replace(/\[[^\]]+\]/g, "");
    
    if (elementPart && elementPart !== "*") {
      const elementMatches = elementPart.match(/[a-zA-Z][\w-]*/g);
      elements += elementMatches ? elementMatches.length : 0;
    } else if (elementPart === "*") {
      // Universal selector doesn't add specificity
    }
  }
  
  return { inline, ids, classes, elements };
}

function specificityToString(spec: Specificity): string {
  return `${spec.inline}-${spec.ids}-${spec.classes}-${spec.elements}`;
}

function specificityToNumber(spec: Specificity): number {
  return spec.inline * 1000 + spec.ids * 100 + spec.classes * 10 + spec.elements;
}

function getExplanation(selector: string, spec: Specificity): string {
  const parts: string[] = [];
  
  if (spec.inline > 0) parts.push(`${spec.inline} inline style(s)`);
  if (spec.ids > 0) parts.push(`${spec.ids} ID selector(s)`);
  if (spec.classes > 0) parts.push(`${spec.classes} class/attribute selector(s)`);
  if (spec.elements > 0) parts.push(`${spec.elements} element selector(s)`);
  
  if (parts.length === 0) {
    return "This selector has no specificity (empty or only combinators).";
  }
  
  return `Specificity is based on: ${parts.join(", ")}.`;
}

export function CssSpecificityCalculatorTool() {
  const [selector1, setSelector1] = useState("#header .nav a");
  const [selector2, setSelector2] = useState("body .container #main a.link");
  const [specificity1, setSpecificity1] = useState<Specificity | null>(null);
  const [specificity2, setSpecificity2] = useState<Specificity | null>(null);

  function calculate() {
    setSpecificity1(calculateSpecificity(selector1));
    setSpecificity2(calculateSpecificity(selector2));
  }

  function getWinner(): string | null {
    if (!specificity1 || !specificity2) return null;
    const num1 = specificityToNumber(specificity1);
    const num2 = specificityToNumber(specificity2);
    if (num1 > num2) return "Selector 1 wins";
    if (num2 > num1) return "Selector 2 wins";
    return "Equal specificity - last one wins";
  }

  return (
    <div className="space-y-5">
      <Card title="CSS Specificity Calculator">
        <p className="text-sm text-slate-600 mb-4">
          Paste CSS selectors and get their specificity score with an explanation of why one rule beats another.
        </p>
        
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Selector 1</label>
              <input
                type="text"
                value={selector1}
                onChange={(e) => setSelector1(e.target.value)}
                className={inputClass}
                placeholder="#header .nav a"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Selector 2</label>
              <input
                type="text"
                value={selector2}
                onChange={(e) => setSelector2(e.target.value)}
                className={inputClass}
                placeholder="body .container #main a.link"
              />
            </div>
          </div>
          
          <button type="button" onClick={calculate} className={buttonClass}>
            Calculate Specificity
          </button>
        </div>

        {specificity1 && specificity2 && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-sm text-slate-800 mb-2">{selector1}</div>
                <div className="text-2xl font-bold text-sky-700">{specificityToString(specificity1)}</div>
                <div className="mt-2 text-xs text-slate-500">
                  <span className="inline-block w-16">Inline:</span> {specificity1.inline}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">IDs:</span> {specificity1.ids}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">Classes:</span> {specificity1.classes}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">Elements:</span> {specificity1.elements}
                </div>
                <div className="mt-3 text-xs text-slate-600">{getExplanation(selector1, specificity1)}</div>
              </div>
              
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-sm text-slate-800 mb-2">{selector2}</div>
                <div className="text-2xl font-bold text-sky-700">{specificityToString(specificity2)}</div>
                <div className="mt-2 text-xs text-slate-500">
                  <span className="inline-block w-16">Inline:</span> {specificity2.inline}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">IDs:</span> {specificity2.ids}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">Classes:</span> {specificity2.classes}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="inline-block w-16">Elements:</span> {specificity2.elements}
                </div>
                <div className="mt-3 text-xs text-slate-600">{getExplanation(selector2, specificity2)}</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl text-center font-bold ${
              getWinner()?.includes("1") ? "bg-sky-100 text-sky-800" :
              getWinner()?.includes("2") ? "bg-amber-100 text-amber-800" :
              "bg-slate-100 text-slate-800"
            }`}>
              {getWinner()}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}