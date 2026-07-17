"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

export function MaxUploadSizeFixerTool() {
  const [uploadSize, setUploadSize] = useState("64M");
  const [hostType, setHostType] = useState<"apache-modphp" | "php-fpm" | "suphp-cgi">("apache-modphp");
  const [activeTab, setActiveTab] = useState<"htaccess" | "php-ini" | "functions">("htaccess");

  const postMaxSize = (() => {
    const num = parseInt(uploadSize);
    return isNaN(num) ? "65M" : `${num + 1}M`;
  })();

  const htaccessSnippet = hostType === "php-fpm"
    ? `# ⚠️ WARNING: php_value does NOT work on PHP-FPM hosts (causes 500 error)
# Use .user.ini or php.ini instead
#
# Uncomment only if on Apache + mod_php:
# php_value upload_max_filesize ${uploadSize}
# php_value post_max_size ${postMaxSize}
# php_value memory_limit 256M
# php_value max_execution_time 300
# php_value max_input_time 300`
    : `# Increase max upload size via .htaccess
# Only works with Apache + mod_php (NOT PHP-FPM)
php_value upload_max_filesize ${uploadSize}
php_value post_max_size ${postMaxSize}
php_value memory_limit 256M
php_value max_execution_time 300
php_value max_input_time 300`;

  const phpIniSnippet = `; Create or edit .user.ini in your WordPress root directory
; For PHP-FPM hosts, this is the most reliable method
upload_max_filesize = ${uploadSize}
post_max_size = ${postMaxSize}
memory_limit = 256M
max_execution_time = 300
max_input_time = 300

; Note: post_max_size MUST be >= upload_max_filesize`;

  const functionsPhpSnippet = `<?php
/**
 * Add to your theme's functions.php or a custom plugin
 * This filter increases the max upload size shown in Media Library
 * Note: Server-side limits (php.ini/.htaccess) still apply
 */
function custom_upload_size_limit( $size ) {
    // Change 67108864 to your desired size in bytes
    // 64MB = 67108864, 128MB = 134217728, 256MB = 268435456
    return 268435456; // 256MB
}
add_filter( 'wp_handle_upload_prefilter', 'custom_upload_size_limit' );

// Also increase the limit shown in Site Health
function custom_max_upload_size( $size ) {
    return 268435456; // 256MB
}
add_filter( 'upload_size_limit', 'custom_max_upload_size', 10, 0 );`;

  const snippets: Record<string, string> = {
    htaccess: htaccessSnippet,
    "php-ini": phpIniSnippet,
    functions: functionsPhpSnippet,
  };

  return (
    <div className="space-y-5">
      <Card title="Max Upload Size Fixer">
        <p className="text-sm text-slate-600 mb-4">
          Fix <code className="bg-slate-100 px-1 rounded text-xs">upload_max_filesize</code>, <code className="bg-slate-100 px-1 rounded text-xs">post_max_size</code>, and <code className="bg-slate-100 px-1 rounded text-xs">memory_limit</code> together. post_max_size must be ≥ upload_max_filesize.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Upload Size</label>
            <select value={uploadSize} onChange={(e) => setUploadSize(e.target.value)} className={inputClass}>
              <option>8M</option><option>16M</option><option>32M</option><option>64M</option><option>128M</option><option>256M</option>
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

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 mb-4">
          <strong>Note:</strong> post_max_size is auto-set to {postMaxSize} (upload size + 1M). All three settings must work together.
        </div>

        <div className="flex gap-2 mb-4">
          {(["htaccess", "php-ini", "functions"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {tab === "htaccess" ? ".htaccess" : tab === "php-ini" ? "php.ini / .user.ini" : "functions.php"}
            </button>
          ))}
        </div>
      </Card>

      <OutputBox value={snippets[activeTab]} label={activeTab === "htaccess" ? ".htaccess" : activeTab === "php-ini" ? "php.ini / .user.ini" : "functions.php"} />
    </div>
  );
}