"use client";
import { useState } from "react";
import { Card, OutputBox, buttonClass } from "./shared";

const WP_TABLES = [
  "wp_commentmeta", "wp_comments", "wp_links", "wp_options",
  "wp_postmeta", "wp_posts", "wp_term_relationships", "wp_term_taxonomy",
  "wp_termmeta", "wp_terms", "wp_usermeta", "wp_users",
];

export function DbRepairOptimizerTool() {
  const [activeTab, setActiveTab] = useState<"config" | "optimize">("config");
  const [tablePrefix, setTablePrefix] = useState("wp_");

  const tables = tablePrefix === "wp_" ? WP_TABLES : WP_TABLES.map((t) => t.replace("wp_", tablePrefix));

  const configSnippet = `<?php
/**
 * Step 1: Add this line to wp-config.php (before "That's all, stop editing!")
 */
define( 'WP_ALLOW_REPAIR', true );

/**
 * Step 2: Visit the repair page in your browser:
 * ${typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/wp-admin/maint/repair.php
 *
 * Step 3: REMOVE the define line after repair is complete!
 * Leaving WP_ALLOW_REPAIR enabled is a security risk.
 */`;

  const optimizeSnippet = `-- Optimize all WordPress tables
-- Run this in phpMyAdmin, Adminer, or via WP-CLI: wp db optimize

${tables.map((t) => `OPTIMIZE TABLE \`${t}\`;`).join("\n")}

-- Or repair and optimize all at once:
${tables.map((t) => `REPAIR TABLE \`${t}\`;`).join("\n")}

-- WP-CLI alternative (recommended):
-- wp db optimize
-- wp db repair`;

  const wpcliSnippet = `# WP-CLI Commands for Database Maintenance

# Repair the database
wp db repair

# Optimize the database
wp db optimize

# Repair and optimize at once
wp db repair && wp db optimize

# Check database status
wp db check

# Drop-in replacement for repair.php (more thorough):
wp db repair --allow-root`;

  const snippets: Record<string, string> = {
    config: configSnippet,
    optimize: optimizeSnippet,
  };

  return (
    <div className="space-y-5">
      <Card title="Database Repair / Optimize Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate the WP_ALLOW_REPAIR constant, repair.php link, and SQL to optimize all WordPress tables.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Table Prefix</label>
            <input
              type="text"
              value={tablePrefix}
              onChange={(e) => setTablePrefix(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(["config", "optimize"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {tab === "config" ? "WP Config Setup" : "SQL Optimize"}
            </button>
          ))}
          <button type="button" onClick={() => setActiveTab("config")} className="px-3 py-1.5 text-sm font-semibold rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
            WP-CLI
          </button>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>Security Note:</strong> Always remove <code className="bg-amber-100 px-1 rounded">WP_ALLOW_REPAIR</code> from wp-config.php after repair. Leaving it enabled exposes your database.
        </div>
      </Card>

      {activeTab === "config" ? (
        <OutputBox value={configSnippet} label="wp-config.php + Repair URL" />
      ) : activeTab === "optimize" ? (
        <OutputBox value={optimizeSnippet} label="SQL Optimize/Repair" />
      ) : (
        <OutputBox value={wpcliSnippet} label="WP-CLI Commands" />
      )}
    </div>
  );
}