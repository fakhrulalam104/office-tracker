"use client";

import { useState } from "react";
import { Card, OutputBox, buttonClass, softButtonClass, copyText } from "./shared";

interface GitignoreRule {
  id: string;
  label: string;
  enabled: boolean;
  pattern: string;
  category: string;
}

const DEFAULT_RULES: GitignoreRule[] = [
  // WordPress Core
  { id: "wp-core", label: "WordPress Core Files", enabled: false, pattern: "# WordPress core files\n/wp-admin/\n/wp-includes/\n/wp-login.php\n/wp-settings.php\n/wp-blog-header.php\n/wp-load.php\n/wp-cron.php\n/xmlrpc.php\n/license.txt\n/readme.html", category: "WordPress Core" },
  
  // WordPress Content
  { id: "wp-uploads", label: "Uploads Directory", enabled: true, pattern: "/wp-content/uploads/", category: "WordPress Content" },
  { id: "wp-cache", label: "Cache Directories", enabled: true, pattern: "/wp-content/cache/\n/wp-content/wflogs/", category: "WordPress Content" },
  { id: "wp-plugins", label: "Plugins Directory", enabled: false, pattern: "/wp-content/plugins/", category: "WordPress Content" },
  { id: "wp-themes", label: "Themes Directory", enabled: false, pattern: "/wp-content/themes/", category: "WordPress Content" },
  { id: "wp-backups", label: "Backup Files", enabled: true, pattern: "/wp-content/backup-db/\n*.sql\n*.sql.gz", category: "WordPress Content" },
  
  // Configuration
  { id: "wp-config", label: "wp-config.php", enabled: true, pattern: "/wp-config.php\n/wp-config.php.dist\n/wp-config-sample.php", category: "Configuration" },
  { id: "htaccess", label: ".htaccess", enabled: false, pattern: "/.htaccess", category: "Configuration" },
  { id: "env", label: "Environment Files", enabled: true, pattern: ".env\n.env.*", category: "Configuration" },
  
  // Cache Plugins
  { id: "wp-rocket", label: "WP Rocket", enabled: true, pattern: "/wp-content/wp-rocket-config/\n/wp-content/cache/wp-rocket/", category: "Cache Plugins" },
  { id: "w3tc", label: "W3 Total Cache", enabled: true, pattern: "/wp-content/cache/\n/wp-content/w3tc-config/", category: "Cache Plugins" },
  { id: "wp-super-cache", label: "WP Super Cache", enabled: true, pattern: "/wp-content/cache/", category: "Cache Plugins" },
  { id: "litespeed-cache", label: "LiteSpeed Cache", enabled: true, pattern: "/wp-content/lscache/", category: "Cache Plugins" },
  
  // System Files
  { id: "ds-store", label: ".DS_Store", enabled: true, pattern: ".DS_Store", category: "System Files" },
  { id: "thumbs-db", label: "Thumbs.db", enabled: true, pattern: "Thumbs.db", category: "System Files" },
  { id: "desktop-ini", label: "desktop.ini", enabled: true, pattern: "desktop.ini", category: "System Files" },
  
  // Development
  { id: "node-modules", label: "node_modules", enabled: true, pattern: "node_modules/", category: "Development" },
  { id: "vendor", label: "vendor (Composer)", enabled: true, pattern: "/vendor/", category: "Development" },
  { id: "git", label: ".git", enabled: true, pattern: ".git/", category: "Development" },
  { id: "idea", label: "IDE Files", enabled: true, pattern: ".idea/\n.vscode/\n*.swp\n*.swo", category: "Development" },
];

function generateGitignore(rules: GitignoreRule[]): string {
  const enabledRules = rules.filter((r) => r.enabled);
  const categories = [...new Set(enabledRules.map((r) => r.category))];
  
  const lines: string[] = [];
  
  for (const category of categories) {
    const categoryRules = enabledRules.filter((r) => r.category === category);
    lines.push(`\n# ${category}`);
    for (const rule of categoryRules) {
      lines.push(rule.pattern);
    }
  }
  
  return lines.join("\n").trim();
}

export function WpGitignoreGeneratorTool() {
  const [rules, setRules] = useState<GitignoreRule[]>(DEFAULT_RULES);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("WordPress Content");

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function toggleCategory(category: string) {
    const categoryRules = rules.filter((r) => r.category === category);
    const allEnabled = categoryRules.every((r) => r.enabled);
    
    setRules((prev) =>
      prev.map((r) => (r.category === category ? { ...r, enabled: !allEnabled } : r))
    );
  }

  const categories = [...new Set(rules.map((r) => r.category))];
  const output = generateGitignore(rules);

  return (
    <div className="space-y-5">
      <Card title=".gitignore Generator (WP-aware)">
        <p className="text-sm text-slate-600 mb-4">
          One-click WordPress-flavored .gitignore with presets for uploads, cache, config, and common plugins.
        </p>
        
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryRules = rules.filter((r) => r.category === category);
            const enabledCount = categoryRules.filter((r) => r.enabled).length;
            const isExpanded = expandedCategory === category;
            
            return (
              <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enabledCount === categoryRules.length}
                      onChange={() => toggleCategory(category)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    />
                    <span className="font-semibold text-sm text-slate-800">{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{enabledCount}/{categoryRules.length}</span>
                    <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-3 space-y-2 border-t border-slate-200">
                    {categoryRules.map((rule) => (
                      <label
                        key={rule.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                          rule.enabled ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600"
                        />
                        <span className="text-sm text-slate-700">{rule.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <OutputBox value={output} label=".gitignore Content" />
    </div>
  );
}