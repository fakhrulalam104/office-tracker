"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

interface PermissionRow {
  path: string;
  permission: string;
  description: string;
  numeric: string;
}

const PERMISSION_CHART: PermissionRow[] = [
  { path: "/ (WordPress root)", permission: "755", numeric: "rwxr-xr-x", description: "Directories" },
  { path: "/wp-admin/", permission: "755", numeric: "rwxr-xr-x", description: "Admin directory" },
  { path: "/wp-includes/", permission: "755", numeric: "rwxr-xr-x", description: "Core includes" },
  { path: "/wp-content/", permission: "755", numeric: "rwxr-xr-x", description: "Content directory" },
  { path: "/wp-content/plugins/", permission: "755", numeric: "rwxr-xr-x", description: "Plugins directory" },
  { path: "/wp-content/themes/", permission: "755", numeric: "rwxr-xr-x", description: "Themes directory" },
  { path: "/wp-content/uploads/", permission: "755", numeric: "rwxr-xr-x", description: "Uploads directory" },
  { path: "All files (*.php, *.css, *.js)", permission: "644", numeric: "rw-r--r--", description: "Regular files" },
  { path: "/wp-config.php", permission: "440 or 600", numeric: "r--r----- or rw-------", description: "Config file (most secure)" },
  { path: "/.htaccess", permission: "644", numeric: "rw-r--r--", description: "Apache config" },
  { path: "/xmlrpc.php", permission: "644", numeric: "rw-r--r--", description: "XML-RPC (consider deleting)" },
];

export function FilePermissionFixerTool() {
  const [webUser, setWebUser] = useState("www-data");
  const [webGroup, setWebGroup] = useState("www-data");
  const [activeTab, setActiveTab] = useState<"chart" | "commands">("chart");

  const commandsSnippet = `# =====================================================
# WordPress File Permission Fix Commands (via SSH)
# Run from your WordPress root directory
# =====================================================

# Set correct ownership (replace www-data with your web server user)
# Common users: www-data (Ubuntu/Debian), apache (CentOS/RHEL), nginx (Nginx)
sudo chown -R ${webUser}:${webGroup} .

# Set directory permissions to 755
sudo find . -type d -exec chmod 755 {} \\;

# Set file permissions to 644
sudo find . -type f -exec chmod 644 {} \\;

# Secure wp-config.php
sudo chmod 600 wp-config.php

# Secure .htaccess
sudo chmod 644 .htaccess

# =====================================================
# Alternative: More aggressive cleanup
# =====================================================

# Remove write permissions for group/other on all PHP files
sudo find . -name "*.php" -exec chmod 644 {} \\;

# Ensure uploads directory is writable but not executable
sudo find ./wp-content/uploads -type f -exec chmod 644 {} \\;
sudo find ./wp-content/uploads -type d -exec chmod 755 {} \\;

# =====================================================
# For shared hosting (cPanel) without sudo:
# Use File Manager or FTP client to set permissions
# =====================================================

# Quick one-liner to set everything:
# (Use with caution - this changes ALL files/dirs)
find . -type d -exec chmod 755 {} + && find . -type f -exec chmod 644 {} + && chmod 600 wp-config.php`;

  const troubleshootSnippet = `# =====================================================
# Troubleshooting Permission Issues
# =====================================================

# 1. Find files with wrong permissions
find . -not -perm 644 -type f  # Files not 644
find . -not -perm 755 -type d  # Dirs not 755

# 2. Find files owned by wrong user
find . ! -user ${webUser}

# 3. Fix uploads directory (if " Unable to create directory" error)
sudo chown -R ${webUser}:${webGroup} wp-content/uploads
sudo chmod -R 755 wp-content/uploads

# 4. Fix "Permission denied" for plugin installs
sudo chown -R ${webUser}:${webGroup} wp-content/plugins
sudo chmod -R 755 wp-content/plugins

# 5. Fix "Unable to create directory" during uploads
sudo chown -R ${webUser}:${webGroup} wp-content/uploads
sudo chmod -R 755 wp-content/uploads

# 6. Check current permissions
ls -la wp-config.php
ls -la .htaccess
ls -la wp-content/

# 7. For Docker/managed hosting:
# Permissions may be controlled by the container - check docker-compose.yml`;

  return (
    <div className="space-y-5">
      <Card title="File Permission Reference / Fixer">
        <p className="text-sm text-slate-600 mb-4">
          Standard WordPress permission chart with chmod/chown commands for SSH. Fix &quot;permission denied&quot; upload errors.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Web Server User</label>
            <select value={webUser} onChange={(e) => setWebUser(e.target.value)} className={inputClass}>
              <option value="www-data">www-data (Ubuntu/Debian)</option>
              <option value="apache">apache (CentOS/RHEL)</option>
              <option value="nginx">nginx</option>
              <option value="nobody">nobody</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Web Server Group</label>
            <select value={webGroup} onChange={(e) => setWebGroup(e.target.value)} className={inputClass}>
              <option value="www-data">www-data (Ubuntu/Debian)</option>
              <option value="apache">apache (CentOS/RHEL)</option>
              <option value="nginx">nginx</option>
              <option value="nobody">nobody</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(["chart", "commands"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {tab === "chart" ? "Permission Chart" : "Fix Commands"}
            </button>
          ))}
        </div>

        {activeTab === "chart" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Path</th>
                  <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Permission</th>
                  <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Octal</th>
                  <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_CHART.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-xs text-slate-800">{row.path}</td>
                    <td className="py-2 px-3 font-mono text-xs text-sky-700">{row.permission}</td>
                    <td className="py-2 px-3 font-mono text-xs text-slate-500">{row.numeric}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {activeTab === "commands" ? (
        <>
          <OutputBox value={commandsSnippet} label="SSH Commands (run from WordPress root)" />
          <OutputBox value={troubleshootSnippet} label="Troubleshooting Commands" />
        </>
      ) : (
        <OutputBox value={commandsSnippet} label="SSH Commands (run from WordPress root)" />
      )}
    </div>
  );
}