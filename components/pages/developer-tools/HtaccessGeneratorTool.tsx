"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

interface Rule {
  id: string;
  label: string;
  enabled: boolean;
  code: string;
}

const DEFAULT_RULES: Rule[] = [
  {
    id: "force-https",
    label: "Force HTTPS",
    enabled: true,
    code: `RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
  },
  {
    id: "force-www",
    label: "Force WWW",
    enabled: false,
    code: `RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\. [NC]
RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]`,
  },
  {
    id: "block-xmlrpc",
    label: "Block XML-RPC",
    enabled: true,
    code: `<Files xmlrpc.php>
  Order Allow,Deny
  Deny from all
</Files>`,
  },
  {
    id: "block-wp-login",
    label: "Block wp-login.php Brute Force",
    enabled: false,
    code: `<Files wp-login.php>
  Order Deny,Allow
  Deny from all
  Allow from xx.xx.xx.xx
</Files>`,
  },
  {
    id: "disable-directory",
    label: "Disable Directory Browsing",
    enabled: true,
    code: `Options -Indexes`,
  },
  {
    id: "custom-404",
    label: "Custom 404 Error",
    enabled: false,
    code: `ErrorDocument 404 /404.html`,
  },
  {
    id: "gzip-compression",
    label: "GZIP Compression",
    enabled: true,
    code: `<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json
</IfModule>`,
  },
  {
    id: "browser-caching",
    label: "Browser Caching",
    enabled: true,
    code: `<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>`,
  },
  {
    id: "wp-default",
    label: "WordPress Default Rewrite",
    enabled: true,
    code: `# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress`,
  },
];

function generateHtaccess(rules: Rule[]): string {
  const enabledRules = rules.filter((r) => r.enabled);
  return enabledRules.map((r) => `# ${r.label}\n${r.code}`).join("\n\n");
}

export function HtaccessGeneratorTool() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState("");

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }

  function testUrl_() {
    if (!testUrl) return;
    const enabledRules = rules.filter((r) => r.enabled);
    const results: string[] = [];
    
    if (enabledRules.some((r) => r.id === "force-https") && !testUrl.startsWith("https://")) {
      results.push("Force HTTPS: Would redirect to https://");
    }
    if (enabledRules.some((r) => r.id === "force-www") && !testUrl.includes("www.")) {
      results.push("Force WWW: Would redirect to www.");
    }
    if (enabledRules.some((r) => r.id === "block-xmlrpc") && testUrl.includes("xmlrpc.php")) {
      results.push("Block XML-RPC: Access denied (403)");
    }
    if (enabledRules.some((r) => r.id === "disable-directory") && testUrl.endsWith("/")) {
      results.push("Directory Index: Would return 403 or custom 404");
    }
    
    setTestResult(results.length > 0 ? results.join("\n") : "No rules would match this URL.");
  }

  const output = generateHtaccess(rules);

  return (
    <div className="space-y-5">
      <Card title=".htaccess Generator/Tester">
        <p className="text-sm text-slate-600 mb-4">
          Toggle common Apache rewrite blocks for WordPress. Enable the rules you need and copy the generated .htaccess content.
        </p>
        
        <div className="space-y-3 mb-4">
          {rules.map((rule) => (
            <label
              key={rule.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition cursor-pointer ${
                rule.enabled ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm font-semibold text-slate-800">{rule.label}</span>
            </label>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Test a URL</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className={inputClass}
              placeholder="https://example.com/wp-login.php"
            />
            <button type="button" onClick={testUrl_} className={buttonClass}>
              Test
            </button>
          </div>
          {testResult && (
            <pre className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 whitespace-pre-wrap">{testResult}</pre>
          )}
        </div>
      </Card>

      <OutputBox value={output} label=".htaccess Content" />
    </div>
  );
}