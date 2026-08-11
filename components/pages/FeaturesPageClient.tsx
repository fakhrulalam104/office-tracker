"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

const features = [
  {
    href: "/features/stopwatch",
    label: "Stopwatch",
    description: "A focused timer users can keep open while working through any task.",
    status: "Available",
    icon: "timer"
  },
  {
    href: "/features/image-converter",
    label: "Image Converter",
    description: "Convert browser-supported image files with quality control and side-by-side preview.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/image-background-remover",
    label: "Image Background Remover",
    description: "Remove image backgrounds locally and export clean transparent PNG files.",
    status: "Available",
    icon: "cutout"
  },
  {
    href: "/features/image-editor",
    label: "Image Editor",
    description: "Layer-based photo editor with brush, fill, selections, filters, text, and PNG/JPEG export.",
    status: "Available",
    icon: "editor"
  },
  {
    href: "/features/notes",
    label: "Notes",
    description: "Keep text notes, links, tags, pinned items, and archived references in one focused workspace.",
    status: "Available",
    icon: "notes"
  },
  {
    href: "/features/developer-tools",
    label: "Developer Tools",
    description: "15 tools: JSON, JWT, Base64, UUID, Hash, Regex, Timestamp, Color, Diff, Markdown, CSV, API, Dummy Data, and QR Code.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/dummy-card-generator",
    label: "Dummy Card Generator",
    description: "Generate realistic test credit cards with valid-format numbers, CVVs, expiry dates, and cardholder names in a real card view.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/password-generator",
    label: "Password Generator",
    description: "Generate strength-rated passwords with customizable options.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/cron-parser",
    label: "Cron Parser",
    description: "Convert cron expressions to human-readable schedules.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/json-schema-validator",
    label: "JSON Schema Validator",
    description: "Validate JSON data against a JSON Schema definition.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/word-diff",
    label: "Word Diff",
    description: "Compare text with word-level diff highlighting.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/hmac-signing",
    label: "HMAC Signing",
    description: "Create and verify HMAC-SHA signatures for data integrity.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/html-email-preview",
    label: "HTML Email Preview",
    description: "Preview HTML email templates with live rendering.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/svg-viewer",
    label: "SVG Viewer",
    description: "Preview, minify, and export SVG images as PNG.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/regex-debugger",
    label: "Regex Debugger",
    description: "Step through regex patterns with detailed match analysis.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/cheat-sheets",
    label: "Cheat Sheets",
    description: "Quick reference for HTTP, CSS, SQL, Linux, and Git commands.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/text-transform",
    label: "Text Transform",
    description: "Transform text case, convert unicode, and handle HTML entities.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/pomodoro-timer",
    label: "Pomodoro Timer",
    description: "25/5 minute focus timer for productive work sessions.",
    status: "Available",
    icon: "timer"
  },
  {
    href: "/features/batch-image-resizer",
    label: "Batch Image Resizer",
    description: "Resize multiple images at once with batch processing.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/clipboard-history",
    label: "Clipboard History",
    description: "Manager for tracking and reusing clipboard content.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/color-palette-generator",
    label: "Color Palette Generator",
    description: "Generate harmonious color palettes for design projects.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/markdown-to-slides",
    label: "Markdown to Slides",
    description: "Convert Markdown content into presentation slides.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/json-to-typescript",
    label: "JSON to TypeScript",
    description: "Generate TypeScript interfaces and Zod schemas from JSON.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/lorem-ipsum-generator",
    label: "Lorem Ipsum Generator",
    description: "Generate placeholder text for design and development.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/unit-converter",
    label: "Unit Converter",
    description: "Convert between length, weight, data, and time units.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/image-metadata-viewer",
    label: "Image Metadata Editor",
    description: "View, edit, and delete EXIF metadata from image files.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/regex-playbook",
    label: "Regex Playbook",
    description: "Pattern library and tester for regular expressions.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/html-editor",
    label: "HTML Editor",
    description: "Live HTML code editor with preview, device presets, and full screen mode.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/color-picker",
    label: "Color Picker",
    description: "Developer color picker with HEX, RGB, HSL, contrast checker, and Tailwind palette.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/responsive-checker",
    label: "Responsive Checker",
    description: "Test any website across 50+ real devices — phones, tablets, laptops, and desktops.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-salts-generator",
    label: "WP Salts/Keys Generator",
    description: "Generate the 8 unique security keys for wp-config.php with a regenerate + copy as PHP define block button.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/serialized-php-replace",
    label: "Serialized PHP Search & Replace",
    description: "Safely replace text in WordPress serialized strings without breaking byte-length prefixes.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/htaccess-generator",
    label: ".htaccess Generator/Tester",
    description: "Toggle common Apache rewrite blocks: HTTPS, redirects, XML-RPC, caching, and test against sample URLs.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-config-generator",
    label: "wp-config.php Generator",
    description: "Generate a complete wp-config.php with DB settings, debug constants, memory limits, and auto-generated salts.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/gutenberg-block-boilerplate",
    label: "Gutenberg Block Boilerplate Generator",
    description: "Generate block.json, edit.js, save.js, index.js, and style.scss scaffolding for custom WordPress blocks.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/shortcode-tester",
    label: "Shortcode Tester",
    description: "Test shortcode attribute parsing and rendering logic before deploying to a live theme.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-rest-api-explorer",
    label: "WP REST API Explorer",
    description: "Browse and test WordPress REST API endpoints with JSON response viewing and parameter inspection.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/plugin-theme-header-generator",
    label: "Plugin/Theme Header Generator",
    description: "Generate the exact docblock WordPress parses for plugin and theme headers with all required fields.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/child-theme-generator",
    label: "Child Theme Generator",
    description: "Generate style.css with correct Template header and functions.php with proper stylesheet loading.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/acf-json-viewer",
    label: "ACF JSON Field Group Viewer",
    description: "Paste ACF field group JSON and get a collapsible tree view of field names, types, keys, and conditional logic.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/robots-txt-generator",
    label: "Robots.txt Generator/Tester",
    description: "Toggle common WP disallow rules, add sitemap, and test URL paths against the ruleset.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/meta-tag-preview",
    label: "Meta Tag / Open Graph Preview",
    description: "Preview how your pages will render on Facebook, Twitter/X, LinkedIn, and Slack with live cards.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/dns-lookup",
    label: "DNS Lookup Tool",
    description: "Query A, AAAA, CNAME, MX, TXT, NS records for any domain to verify DNS configuration.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/ssl-certificate-checker",
    label: "SSL Certificate Checker",
    description: "Check cert issuer, expiry date, chain validity, and SANs covered for any domain.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/favicon-generator",
    label: "Favicon Generator",
    description: "Upload one image and get the full modern favicon set with all required sizes and webmanifest.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/css-specificity-calculator",
    label: "CSS Specificity Calculator",
    description: "Paste a selector and get its specificity score with explanation of why one rule beats another.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/curl-command-builder",
    label: "cURL Command Builder",
    description: "Build curl commands from form inputs or parse existing commands into readable request breakdowns.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-gitignore-generator",
    label: ".gitignore Generator (WP-aware)",
    description: "One-click WP-flavored gitignore with presets for uploads, cache, config, and common plugins.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/php-memory-limit-increaser",
    label: "PHP Memory Limit Increaser",
    description: "Generate wp-config, .htaccess, and php.ini snippets to bump memory_limit with host-specific notes.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/max-upload-size-fixer",
    label: "Max Upload Size Fixer",
    description: "Fix upload_max_filesize, post_max_size, and memory_limit together across multiple methods.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/php-execution-time-fixer",
    label: "PHP Execution Time Fixer",
    description: "Fix max_execution_time, max_input_time, and server-level timeouts for large operations.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/white-screen-checklist",
    label: "WP White Screen of Death Checklist",
    description: "Interactive diagnostic tree with fix snippets for memory, plugin conflicts, PHP version, and more.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-config-fixes",
    label: "Common wp-config.php Fixes",
    description: "Copy-paste blocks for memory, file editing, SSL, auto-updates, revisions, and redirect fixes.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/php-version-checker",
    label: "PHP Version Compatibility Checker",
    description: "Paste code to flag deprecated functions that break on PHP 8+ before hosting upgrades.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/db-repair-optimizer",
    label: "Database Repair / Optimize Generator",
    description: "Generate WP_ALLOW_REPAIR constant and OPTIMIZE TABLE SQL for all wp_* tables.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-error-lookup",
    label: "Common WP Error Message Lookup",
    description: "Searchable list of error strings mapped to their standard fixes.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/nginx-config-generator",
    label: "Nginx Config Snippet Generator",
    description: "WP-flavored Nginx config with rewrites, caching, fastcgi_pass, and security rules.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/wp-cron-debugger",
    label: "WP-Cron Debugger",
    description: "Check if wp-cron.php fires correctly and generate real system crontab replacement.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/file-permission-fixer",
    label: "File Permission Reference / Fixer",
    description: "Standard WP permission chart with chmod/chown commands for SSH paste.",
    status: "Available",
    icon: "tools"
  }
];

const pinStorageKey = "office-tracker-pinned-features";

function FeatureIcon({ name }: { name: string }) {
  if (name === "tools") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M8 7 4 12l4 5M16 7l4 5-4 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m14 5-4 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "notes") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M7 4h8l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M15 4v5h5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M8 13h8M8 16h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "image") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m7 16 3.2-3.2 2.4 2.4 2.1-2.1L18 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (name === "cutout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 16.5 16.5 8M9 8h3M8 9v3M12 17h3M17 12v3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "editor") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M4 6a2 2 0 0 1 2-2h6l4 4h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M12 6v4h4" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M8.5 13.5 9 15l1.5.5L9 16l-.5 1.5L8 16l-1.5-.5L8 15l.5-1.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        <path d="M13.5 15.5h4M13 18h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M9 3h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeaturesPageClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(pinStorageKey);
      if (stored) setPinned(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  function togglePin(href: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      localStorage.setItem(pinStorageKey, JSON.stringify([...next]));
      return next;
    });
  }

  const sorted = [...features].sort((a, b) => {
    const ap = pinned.has(a.href) ? 0 : 1;
    const bp = pinned.has(b.href) ? 0 : 1;
    return ap - bp;
  });

  const pinnedCount = pinned.size;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader
        eyebrow="Features"
        title="Workspace Tools"
        description="A growing collection of lightweight apps users can open whenever they need a little extra utility during the day."
      />

      {pinnedCount > 0 && (
        <p className="text-xs font-semibold text-slate-500">{pinnedCount} pinned tool{pinnedCount !== 1 ? "s" : ""} shown first</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((feature) => {
          const isPinned = pinned.has(feature.href);
          return (
            <Link
              key={feature.href}
              href={feature.href}
              onClick={() => setLoading(feature.href)}
              className={`group relative rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isPinned ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200 hover:border-sky-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${isPinned ? "bg-amber-500" : "bg-slate-950"}`}>
                  <FeatureIcon name={feature.icon} />
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{feature.status}</span>
                  <button
                    type="button"
                    onClick={(e) => togglePin(feature.href, e)}
                    className={`rounded-full p-1.5 transition ${isPinned ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-slate-500"}`}
                    title={isPinned ? "Unpin" : "Pin to top"}
                  >
                    <StarIcon filled={isPinned} />
                  </button>
                </div>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-semibold text-slate-950">{feature.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
              </div>
              <div className="mt-6 text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">
                {loading === feature.href ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" />
                    Loading...
                  </span>
                ) : (
                  "Open app"
                )}
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
