"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

export function PhpExecutionTimeFixerTool() {
  const [maxExecTime, setMaxExecTime] = useState("300");
  const [maxInputTime, setMaxInputTime] = useState("300");
  const [hostType, setHostType] = useState<"apache" | "nginx">("apache");
  const [activeTab, setActiveTab] = useState<"php" | "server">("php");

  const phpSnippet = `; PHP Settings - add to .user.ini, php.ini, or via .htaccess (Apache+mod_php only)
max_execution_time = ${maxExecTime}
max_input_time = ${maxInputTime}
; Set to -1 for unlimited (use with caution)
; max_execution_time = -1`;

  const serverSnippet = hostType === "apache"
    ? `# Apache: Add to .htaccess (only works with mod_php)
php_value max_execution_time ${maxExecTime}
php_value max_input_time ${maxInputTime}

# Apache: For httpd.conf or virtual host config
# Timeout 300
#
# Note: Apache's Timeout directive (default 300) also limits request time
# It's separate from PHP's max_execution_time`
    : `# Nginx: Add to your server or location block in nginx.conf
# This is CRITICAL for PHP-FPM setups

server {
    # ... your existing config ...

    location ~ \\.php$ {
        # Pass to PHP-FPM
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Increase timeouts for long-running operations
        fastcgi_read_timeout ${maxExecTime}s;
        fastcgi_send_timeout ${maxExecTime}s;
        fastcgi_connect_timeout 60s;
    }

    # For large file uploads/import
    client_max_body_size 64M;
}

# If using proxy_pass:
# proxy_read_timeout ${maxExecTime}s;
# proxy_send_timeout ${maxExecTime}s;`;

  const snippets: Record<string, string> = {
    php: phpSnippet,
    server: serverSnippet,
  };

  return (
    <div className="space-y-5">
      <Card title="PHP Execution Time / Timeout Fixer">
        <p className="text-sm text-slate-600 mb-4">
          Fix <code className="bg-slate-100 px-1 rounded text-xs">max_execution_time</code>, <code className="bg-slate-100 px-1 rounded text-xs">max_input_time</code>, and server-level timeouts for imports, exports, and large plugin installs.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Max Execution Time (seconds)</label>
            <select value={maxExecTime} onChange={(e) => setMaxExecTime(e.target.value)} className={inputClass}>
              <option value="30">30 (default)</option><option value="60">60</option><option value="120">120</option><option value="300">300</option><option value="600">600</option><option value="-1">Unlimited (-1)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Max Input Time (seconds)</label>
            <select value={maxInputTime} onChange={(e) => setMaxInputTime(e.target.value)} className={inputClass}>
              <option value="60">60 (default)</option><option value="120">120</option><option value="300">300</option><option value="600">600</option><option value="-1">Unlimited (-1)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Server Type</label>
            <select value={hostType} onChange={(e) => setHostType(e.target.value as typeof hostType)} className={inputClass}>
              <option value="apache">Apache</option><option value="nginx">Nginx</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(["php", "server"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {tab === "php" ? "PHP Settings" : hostType === "apache" ? "Apache Config" : "Nginx Config"}
            </button>
          ))}
        </div>
      </Card>

      <OutputBox value={snippets[activeTab]} label={activeTab === "php" ? "PHP Settings" : hostType === "apache" ? "Apache Config" : "Nginx Config"} />
    </div>
  );
}