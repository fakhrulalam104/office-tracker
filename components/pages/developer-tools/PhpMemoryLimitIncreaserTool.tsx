"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass } from "./shared";

export function PhpMemoryLimitIncreaserTool() {
  const [memoryLimit, setMemoryLimit] = useState("256M");
  const [hostType, setHostType] = useState<"apache-modphp" | "php-fpm" | "suphp-cgi">("apache-modphp");
  const [activeTab, setActiveTab] = useState<"wp-config" | "htaccess" | "php-ini">("wp-config");

  const wpConfigSnippet = `// Increase memory limit in wp-config.php
// This works on MOST hosts, but shared hosts may override it
define( 'WP_MEMORY_LIMIT', '${memoryLimit}' );
define( 'WP_MAX_MEMORY_LIMIT', '${memoryLimit}' );`;

  const htaccessSnippet = hostType === "php-fpm"
    ? `# ⚠️ WARNING: This will cause a 500 error on PHP-FPM hosts!
# php_value directives only work with Apache + mod_php.
# On PHP-FPM, use php.ini or .user.ini instead.
#
# If you're sure you're on mod_php, uncomment below:
# php_value memory_limit ${memoryLimit}`
    : `# Increase PHP memory limit via .htaccess
# Only works with Apache + mod_php (NOT PHP-FPM)
php_value memory_limit ${memoryLimit}`;

  const phpIniSnippet = hostType === "php-fpm"
    ? `; For PHP-FPM hosts, create/edit .user.ini in your WordPress root:
; This is the MOST RELIABLE method for shared hosting with PHP-FPM
memory_limit = ${memoryLimit}

; Some hosts require this in php.ini (contact host if .user.ini doesn't work):
; memory_limit = ${memoryLimit}`
    : `; Create or edit php.ini / .user.ini in your WordPress root:
memory_limit = ${memoryLimit}

; If .user.ini doesn't work, try php.ini at server root
; Some shared hosts: check cPanel > PHP Selector > Options`;

  const snippets: Record<string, string> = {
    "wp-config": wpConfigSnippet,
    "htaccess": htaccessSnippet,
    "php-ini": phpIniSnippet,
  };

  const warnings: Record<string, string> = {
    "apache-modphp": "Works on Apache with mod_php. .htaccess php_value directives will work here.",
    "php-fpm": "php_value in .htaccess will cause a 500 error. Use .user.ini or php.ini instead.",
    "suphp-cgi": ".htaccess php_value may not work. Use .user.ini or php.ini instead.",
  };

  return (
    <div className="space-y-5">
      <Card title="PHP Memory Limit / Config Increaser">
        <p className="text-sm text-slate-600 mb-4">
          Generates all three ways to bump <code className="bg-slate-100 px-1 rounded text-xs">memory_limit</code> since one alone often doesn&apos;t work depending on host.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Memory Limit</label>
            <select value={memoryLimit} onChange={(e) => setMemoryLimit(e.target.value)} className={inputClass}>
              <option>128M</option><option>256M</option><option>512M</option><option>768M</option><option>1024M</option><option>2048M</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Host Type</label>
            <select value={hostType} onChange={(e) => setHostType(e.target.value as typeof hostType)} className={inputClass}>
              <option value="apache-modphp">Apache + mod_php</option>
              <option value="php-fpm">PHP-FPM (most shared hosts)</option>
              <option value="suphp-cgi">suPHP / CGI</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4">
          <strong>Host Note:</strong> {warnings[hostType]}
        </div>

        <div className="flex gap-2 mb-4">
          {(["wp-config", "htaccess", "php-ini"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {tab === "wp-config" ? "wp-config.php" : tab === "htaccess" ? ".htaccess" : "php.ini / .user.ini"}
            </button>
          ))}
        </div>
      </Card>

      <OutputBox value={snippets[activeTab]} label={activeTab === "wp-config" ? "wp-config.php" : activeTab === "htaccess" ? ".htaccess" : "php.ini / .user.ini"} />
    </div>
  );
}