"use client";

import { useState } from "react";
import { Card, OutputBox, textAreaClass, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface ShortcodeAttribute {
  name: string;
  value: string;
}

function parseShortcode(shortcode: string): { tag: string; attributes: ShortcodeAttribute[]; content: string | null } | null {
  const regex = /\[(\w+)([^\]]*)(?:\]([\s\S]*?)\[\/\1\]|\/?\])/;
  const match = shortcode.match(regex);
  
  if (!match) return null;
  
  const tag = match[1];
  const attrString = match[2].trim();
  const content = match[3] ?? null;
  
  const attributes: ShortcodeAttribute[] = [];
  const attrRegex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
  let attrMatch;
  
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attributes.push({
      name: attrMatch[1],
      value: attrMatch[2] || attrMatch[3],
    });
  }
  
  return { tag, attributes, content };
}

function simulateRender(tag: string, attributes: ShortcodeAttribute[], content: string | null, template: string): string {
  let output = template;
  
  output = output.replace(/\{tag\}/g, tag);
  output = output.replace(/\{content\}/g, content || "");
  
  for (const attr of attributes) {
    const regex = new RegExp(`\\{${attr.name}\\}`, "g");
    output = output.replace(regex, attr.value);
  }
  
  return output;
}

export function ShortcodeTesterTool() {
  const [shortcode, setShortcode] = useState('[gallery ids="1,2,3" columns="2" size="medium"]');
  const [template, setTemplate] = useState('<div class="gallery" data-columns="{columns}">\n  <p>Gallery with {ids}</p>\n  <p>Size: {size}</p>\n</div>');
  const [parsed, setParsed] = useState<{ tag: string; attributes: ShortcodeAttribute[]; content: string | null } | null>(null);
  const [output, setOutput] = useState("");

  function testShortcode() {
    const result = parseShortcode(shortcode);
    setParsed(result);
    
    if (result) {
      const rendered = simulateRender(result.tag, result.attributes, result.content, template);
      setOutput(rendered);
    } else {
      setOutput("Invalid shortcode format.");
    }
  }

  return (
    <div className="space-y-5">
      <Card title="Shortcode Tester">
        <p className="text-sm text-slate-600 mb-4">
          Test shortcode attribute parsing and rendering logic before deploying to a live theme. Useful for checking nested shortcodes.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Shortcode</label>
            <input
              type="text"
              value={shortcode}
              onChange={(e) => setShortcode(e.target.value)}
              className={inputClass}
              placeholder='[gallery ids="1,2,3" columns="2"]'
            />
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Render Template</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className={textAreaClass}
              placeholder='Use {attributeName} for attributes, {content} for inner content, {tag} for the tag name.'
            />
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={testShortcode} className={buttonClass}>
              Test Shortcode
            </button>
            <button type="button" onClick={() => { setShortcode(""); setTemplate(""); setParsed(null); setOutput(""); }} className={softButtonClass}>
              Clear
            </button>
          </div>
        </div>

        {parsed && (
          <div className="mt-4 p-4 rounded-xl bg-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Parsed Result</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-semibold">Tag:</span> {parsed.tag}</p>
              <p><span className="font-semibold">Attributes:</span></p>
              <ul className="ml-4 space-y-1">
                {parsed.attributes.map((attr) => (
                  <li key={attr.name}>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">{attr.name}</code> = <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">"{attr.value}"</code>
                  </li>
                ))}
              </ul>
              {parsed.content !== null && (
                <p><span className="font-semibold">Content:</span> {parsed.content}</p>
              )}
            </div>
          </div>
        )}
      </Card>

      <OutputBox value={output} label="Rendered Output" />
    </div>
  );
}