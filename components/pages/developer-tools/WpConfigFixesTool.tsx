"use client";
import { useState } from "react";
import { Card, OutputBox, buttonClass } from "./shared";

interface WpConfigFix {
  id: string;
  title: string;
  description: string;
  snippet: string;
}

const WP_CONFIG_FIXES: WpConfigFix[] = [
  {
    id: "memory",
    title: "Increase Memory Limit",
    description: "Bump WP_MEMORY_LIMIT and WP_MAX_MEMORY_LIMIT for sites running out of memory.",
    snippet: `define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );`,
  },
  {
    id: "file-edit",
    title: "Disable File Editing",
    description: "Remove the Theme/Plugin editor from wp-admin for security.",
    snippet: `define( 'DISALLOW_FILE_EDIT', true );`,
  },
  {
    id: "ssl-admin",
    title: "Force SSL for Admin",
    description: "Force the admin area to use HTTPS.",
    snippet: `define( 'FORCE_SSL_ADMIN', true );`,
  },
  {
    id: "auto-updates",
    title: "Disable All Auto-Updates",
    description: "Turn off automatic updates for core, plugins, and themes.",
    snippet: `// Disable all auto-updates
define( 'WP_AUTO_UPDATE_CORE', false );
add_filter( 'auto_update_plugin', '__return_false' );
add_filter( 'auto_update_theme', '__return_false' );`,
  },
  {
    id: "revisions",
    title: "Limit Post Revisions",
    description: "Control the number of revisions stored per post.",
    snippet: `// Limit revisions to 5 per post (set to 0 to disable completely)
define( 'WP_POST_REVISIONS', 5 );`,
  },
  {
    id: "home-siteurl",
    title: "Set WP_HOME and WP_SITEURL",
    description: "Force the site URL, useful after domain changes or migrations.",
    snippet: `// Replace with your actual domain
define( 'WP_HOME', 'https://yourdomain.com' );
define( 'WP_SITEURL', 'https://yourdomain.com' );`,
  },
  {
    id: "redirect-fix",
    title: "Fix 'Too Many Redirects' Behind Reverse Proxy",
    description: "Common fix when behind load balancer, Cloudflare, or Nginx reverse proxy.",
    snippet: `// Add BEFORE other wp-config defines
if ( isset( \$_SERVER['HTTP_X_FORWARDED_PROTO'] ) && \$_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ) {
    \$_SERVER['HTTPS'] = 'on';
}

// Also set these:
define( 'WP_HOME', 'https://yourdomain.com' );
define( 'WP_SITEURL', 'https://yourdomain.com' );`,
  },
  {
    id: "debug",
    title: "Enable Debug Mode",
    description: "Show PHP errors instead of white screen.",
    snippet: `define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );    // Logs to wp-content/debug.log
define( 'WP_DEBUG_DISPLAY', true ); // Show on screen (set false in production)`,
  },
  {
    id: "trash",
    title: "Disable Trash (Delete Permanently)",
    description: "Skip the trash bin and delete posts/pages permanently.",
    snippet: `define( 'EMPTY_TRASH_DAYS', 0 ); // 0 = instantly delete`,
  },
  {
    id: "cache",
    title: "Disable Object Cache",
    description: "Force disable persistent object caching (useful for debugging).",
    snippet: `// Disable Redis/Memcached object cache
define( 'WP_CACHE', false );

// Or add this to wp-config to disable the drop-in:
// Delete wp-content/object-cache.php`,
  },
];

export function WpConfigFixesTool() {
  const [selectedFix, setSelectedFix] = useState<string>("memory");

  const currentFix = WP_CONFIG_FIXES.find((f) => f.id === selectedFix);

  return (
    <div className="space-y-5">
      <Card title="Common wp-config.php Fixes">
        <p className="text-sm text-slate-600 mb-4">
          Copy-paste blocks for the most common wp-config.php customizations. Click a fix to see the snippet.
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {WP_CONFIG_FIXES.map((fix) => (
            <button
              key={fix.id}
              type="button"
              onClick={() => setSelectedFix(fix.id)}
              className={`p-3 rounded-xl border text-left transition ${
                selectedFix === fix.id
                  ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-800">{fix.title}</div>
              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{fix.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {currentFix && (
        <OutputBox value={currentFix.snippet} label={`wp-config.php: ${currentFix.title}`} />
      )}
    </div>
  );
}