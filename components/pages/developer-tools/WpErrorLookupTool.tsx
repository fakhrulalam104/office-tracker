"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

interface WpError {
  message: string;
  keywords: string[];
  cause: string;
  fix: string;
  snippet: string;
}

const WP_ERRORS: WpError[] = [
  {
    message: "Allowed memory size of X bytes exhausted (tried to allocate Y bytes)",
    keywords: ["memory", "exhausted", "allocated", "bytes"],
    cause: "PHP runs out of memory during an operation (common with large imports, media uploads, or heavy plugins).",
    fix: "Increase WP_MEMORY_LIMIT in wp-config.php and php memory_limit in .user.ini or php.ini.",
    snippet: `// wp-config.php - add before "That's all, stop editing!"
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

// .user.ini (create in WordPress root)
memory_limit = 512M`,
  },
  {
    message: "Error establishing a database connection",
    keywords: ["database", "connection", "establishing"],
    cause: "WordPress cannot connect to the MySQL database. Wrong credentials, DB server down, or DB corrupted.",
    fix: "Verify DB_NAME, DB_USER, DB_PASSWORD, DB_HOST in wp-config.php. Test credentials manually.",
    snippet: `// Test connection - add temporarily to wp-config.php:
echo '<pre>';
$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($db->connect_error) {
    die('Connection Failed: ' . $db->connect_error);
}
echo 'Connected successfully to ' . DB_HOST . '/' . DB_NAME;
echo '</pre>';
die(); // Remove after testing`,
  },
  {
    message: "Briefly unavailable for scheduled maintenance. Check back in a minute.",
    keywords: ["briefly unavailable", "maintenance", "scheduled"],
    cause: "WordPress left a .maintenance file after a failed or interrupted update.",
    fix: "Delete the .maintenance file from the WordPress root directory via FTP/file manager.",
    snippet: `# Via SSH/FTP:
rm .maintenance

# If you can't access FTP, add this to wp-config.php temporarily:
define( 'WP_MAINTENANCE_MODE', false );`,
  },
  {
    message: "There has been a critical error on your website. Please check your site admin email inbox for instructions.",
    keywords: ["critical error", "critical", "error on your website"],
    cause: "PHP fatal error. Could be plugin, theme, or server issue. WordPress 5.2+ shows this generic message.",
    fix: "Enable WP_DEBUG to see the actual error, check wp-content/debug.log, deactivate plugins via FTP.",
    snippet: `// Add to wp-config.php to see the actual error:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );

// Check the log:
// tail -100 wp-content/debug.log

// Or via FTP, rename plugins folder:
// mv wp-content/plugins wp-content/plugins_old`,
  },
  {
    message: "The site is experiencing technical difficulties. Please check your site admin email inbox for instructions.",
    keywords: ["technical difficulties", "experiencing technical"],
    cause: "Same as critical error - WordPress 5.2+ generic error screen.",
    fix: "Same as 'critical error' above - enable debug mode to see actual error.",
    snippet: `define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );`,
  },
  {
    message: "Connection timed out / ERR_CONNECTION_TIMED_OUT",
    keywords: ["connection timed out", "timeout", "timed out", "err_connection"],
    cause: "Server is too slow, overloaded, or firewall blocking. Could also be DNS issue.",
    fix: "Check with hosting provider, increase PHP execution time, verify DNS resolution.",
    snippet: `// Increase execution time in .user.ini:
max_execution_time = 300
max_input_time = 300

// In wp-config.php, also try:
define( 'WP_CRON_LOCK_TIMEOUT', 120 );`,
  },
  {
    message: "500 Internal Server Error",
    keywords: ["500", "internal server error", "server error"],
    cause: "Server configuration issue: bad .htaccess, PHP error, memory limit, or file permissions.",
    fix: "Check .htaccess (rename to test), enable WP_DEBUG, check error logs, verify file permissions.",
    snippet: `# Test by renaming .htaccess:
mv .htaccess .htaccess.bak

# If that fixes it, regenerate via Settings > Permalinks

# Check Apache error log:
tail -100 /var/log/apache2/error.log

# Or enable WordPress debug:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );`,
  },
  {
    message: "403 Forbidden / Access Denied",
    keywords: ["403", "forbidden", "access denied", "access is denied"],
    cause: "File permissions wrong, .htaccess blocking, or security plugin blocking access.",
    fix: "Fix file permissions (folders 755, files 644), check .htaccess, whitelist IP in security plugin.",
    snippet: `# Fix permissions via SSH:
find . -type d -exec chmod 755 {} \\;
find . -type f -exec chmod 644 {} \\;
chmod 600 wp-config.php

# Check .htaccess for deny rules:
cat .htaccess`,
  },
  {
    message: "404 Not Found / Page Not Found",
    keywords: ["404", "not found", "page not found"],
    cause: "Permalinks not configured, .htaccess missing/corrupt, or migration without flushing rewrite rules.",
    fix: "Go to Settings > Permalinks and click Save (flushes rewrite rules). Check .htaccess exists.",
    snippet: `// Flush rewrite rules via wp-cli:
wp rewrite flush

// Or add to functions.php temporarily:
function flush_rewrite_on_activation() {
    flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'flush_rewrite_on_activation' );

// Check if .htaccess has WordPress rules:
// BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
// END WordPress`,
  },
  {
    message: "This site can't be reached / DNS_PROBE_FINISHED_NXDOMAIN",
    keywords: ["can't be reached", "dns_probe", "nxdomain", "site can't"],
    cause: "DNS not pointing to the hosting server, or DNS not propagated yet.",
    fix: "Verify DNS A/CNAME records, wait for propagation (up to 48h), flush local DNS cache.",
    snippet: `# Flush local DNS cache:
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux:
sudo systemd-resolve --flush-caches

# Check DNS:
dig example.com
nslookup example.com`,
  },
  {
    message: "Warning: Cannot modify header information - headers already sent",
    keywords: ["headers already sent", "cannot modify header", "headers already"],
    cause: "Output (whitespace, echo, BOM) sent before headers. Usually a plugin/theme issue or extra space in wp-config.php.",
    fix: "Check for BOM characters, extra whitespace before <?php, or output in plugins.",
    snippet: `// Check wp-config.php - make sure NO output before <?php:
// Bad:  <?php (with BOM or space before it)
// Good: <?php (immediately at start of file, no BOM)

// To remove BOM:
// Use a hex editor or:
grep -rPl '\\xEF\\xBB\\BF' wp-content/themes/ wp-content/plugins/`,
  },
  {
    message: "Parse error / syntax error, unexpected T_VARIABLE",
    keywords: ["parse error", "syntax error", "unexpected"],
    cause: "PHP syntax error in a file. Missing semicolon, bracket, or incompatible PHP version.",
    fix: "Enable debug to find the exact file/line. Check for missing semicolons, unclosed brackets.",
    snippet: `// Enable debug to see the file/line:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_DISPLAY', true );

// The error will show something like:
// Parse error: syntax error, unexpected T_VARIABLE in /path/to/file.php on line 42

// Common causes:
// 1. Missing semicolon at end of line
// 2. Unclosed bracket or quote
// 3. PHP 8+ incompatible code (check PHP Version Checker tool)`,
  },
];

export function WpErrorLookupTool() {
  const [search, setSearch] = useState("");
  const [selectedError, setSelectedError] = useState<WpError | null>(null);

  const filtered = search.length < 2
    ? WP_ERRORS
    : WP_ERRORS.filter((e) =>
        e.message.toLowerCase().includes(search.toLowerCase()) ||
        e.keywords.some((k) => k.includes(search.toLowerCase()))
      );

  return (
    <div className="space-y-5">
      <Card title="Common WP Error Message Lookup">
        <p className="text-sm text-slate-600 mb-4">
          Searchable list of frequent WordPress error messages mapped to their standard fixes.
        </p>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedError(null); }}
            className={inputClass}
            placeholder="Search error messages (e.g., 'memory', 'database', '500')..."
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filtered.map((error, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedError(selectedError === error ? null : error)}
              className={`w-full text-left p-3 rounded-xl border transition ${
                selectedError === error
                  ? "border-sky-300 bg-sky-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-800 line-clamp-2">{error.message}</div>
            </button>
          ))}
        </div>
      </Card>

      {selectedError && (
        <>
          <Card title="Cause & Fix">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cause</div>
                <div className="text-sm text-slate-800">{selectedError.cause}</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Fix</div>
                <div className="text-sm text-green-800">{selectedError.fix}</div>
              </div>
            </div>
          </Card>
          <OutputBox value={selectedError.snippet} label="Fix Snippet" />
        </>
      )}
    </div>
  );
}