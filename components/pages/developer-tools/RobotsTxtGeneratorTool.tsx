"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface Rule {
  id: string;
  label: string;
  enabled: boolean;
  path: string;
  directive: "Disallow" | "Allow";
}

const DEFAULT_RULES: Rule[] = [
  { id: "wp-admin", label: "Block /wp-admin/", enabled: true, path: "/wp-admin/", directive: "Disallow" },
  { id: "wp-admin-ajax", label: "Allow /wp-admin/admin-ajax.php", enabled: true, path: "/wp-admin/admin-ajax.php", directive: "Allow" },
  { id: "wp-includes", label: "Block /wp-includes/", enabled: true, path: "/wp-includes/", directive: "Disallow" },
  { id: "wp-content-uploads-php", label: "Block /wp-content/uploads/*.php", enabled: true, path: "/wp-content/uploads/*.php", directive: "Disallow" },
  { id: "wp-content-plugins", label: "Block /wp-content/plugins/", enabled: false, path: "/wp-content/plugins/", directive: "Disallow" },
  { id: "wp-content-cache", label: "Block /wp-content/cache/", enabled: false, path: "/wp-content/cache/", directive: "Disallow" },
  { id: "wp-json", label: "Block /wp-json/", enabled: false, path: "/wp-json/", directive: "Disallow" },
  { id: "xmlrpc", label: "Block /xmlrpc.php", enabled: true, path: "/xmlrpc.php", directive: "Disallow" },
];

function generateRobotsTxt(rules: Rule[], sitemap: string): string {
  const lines: string[] = ["User-agent: *", ""];
  
  const allowRules = rules.filter((r) => r.enabled && r.directive === "Allow");
  const disallowRules = rules.filter((r) => r.enabled && r.directive === "Disallow");
  
  for (const rule of allowRules) {
    lines.push(`Allow: ${rule.path}`);
  }
  
  if (allowRules.length > 0 && disallowRules.length > 0) {
    lines.push("");
  }
  
  for (const rule of disallowRules) {
    lines.push(`Disallow: ${rule.path}`);
  }
  
  if (sitemap) {
    lines.push("", `Sitemap: ${sitemap}`);
  }
  
  return lines.join("\n");
}

function testUrl(rules: Rule[], testPath: string): string {
  const enabledRules = rules.filter((r) => r.enabled);
  const results: string[] = [];
  
  for (const rule of enabledRules) {
    const pattern = rule.path.replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${pattern}$`);
    
    if (regex.test(testPath)) {
      results.push(`${rule.directive}: ${rule.path} (${rule.label})`);
    }
  }
  
  return results.length > 0 ? results.join("\n") : "No matching rules found - URL is accessible.";
}

export function RobotsTxtGeneratorTool() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [sitemap, setSitemap] = useState("https://example.com/sitemap.xml");
  const [testPath, setTestPath] = useState("/wp-content/uploads/image.php");
  const [testResult, setTestResult] = useState("");

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function addRule() {
    setRules((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, label: "Custom Rule", enabled: true, path: "/", directive: "Disallow" },
    ]);
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRule(id: string, key: keyof Rule, value: string | boolean) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function testUrl_() {
    setTestResult(testUrl(rules, testPath));
  }

  const output = generateRobotsTxt(rules, sitemap);

  return (
    <div className="space-y-5">
      <Card title="Robots.txt Generator/Tester">
        <p className="text-sm text-slate-600 mb-4">
          Toggle common WordPress disallow rules, add your sitemap URL, and test paths to see what search engines can access.
        </p>
        
        <div className="space-y-3 mb-4">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              <span className="text-sm text-slate-500 w-20">{rule.directive}</span>
              <input
                type="text"
                value={rule.path}
                onChange={(e) => updateRule(rule.id, "path", e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm font-mono"
              />
              <span className="text-xs text-slate-400 flex-1 truncate">{rule.label}</span>
              {!rule.id.startsWith("wp-") && !rule.id.startsWith("xmlrpc") && (
                <button type="button" onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRule} className="text-sm font-semibold text-sky-700 hover:text-sky-900">
            + Add Rule
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Sitemap URL</label>
          <input type="url" value={sitemap} onChange={(e) => setSitemap(e.target.value)} className={inputClass} placeholder="https://example.com/sitemap.xml" />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Test a URL Path</h3>
          <div className="flex gap-3">
            <input type="text" value={testPath} onChange={(e) => setTestPath(e.target.value)} className={inputClass} placeholder="/wp-content/uploads/file.php" />
            <button type="button" onClick={testUrl_} className={buttonClass}>Test</button>
          </div>
          {testResult && (
            <pre className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 whitespace-pre-wrap">{testResult}</pre>
          )}
        </div>
      </Card>

      <OutputBox value={output} label="robots.txt Content" />
    </div>
  );
}