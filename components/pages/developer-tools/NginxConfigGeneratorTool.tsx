"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

interface NginxRule {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_RULES: NginxRule[] = [
  { id: "rewrite", label: "WordPress Permalink Rewrites", enabled: true },
  { id: "static-cache", label: "Static Asset Caching", enabled: true },
  { id: "gzip", label: "Gzip Compression", enabled: true },
  { id: "security", label: "Block xmlrpc/wp-json Abuse", enabled: true },
  { id: "uploads-php", label: "Block PHP in Uploads", enabled: true },
  { id: "disable-symlinks", label: "Disable Symlinks", enabled: false },
];

export function NginxConfigGeneratorTool() {
  const [rules, setRules] = useState<NginxRule[]>(DEFAULT_RULES);
  const [serverName, setServerName] = useState("example.com www.example.com");
  const [documentRoot, setDocumentRoot] = useState("/var/www/html");
  const [phpSocket, setPhpSocket] = useState("/var/run/php/php8.2-fpm.sock");

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function generateConfig(): string {
    const enabled = rules.filter((r) => r.enabled);
    const sections: string[] = [];

    sections.push(`server {
    listen 80;
    listen [::]:80;
    server_name ${serverName};
    root ${documentRoot};
    index index.php index.html;

    # Logging
    access_log /var/log/nginx/${serverName.split(" ")[0]}_access.log;
    error_log /var/log/nginx/${serverName.split(" ")[0]}_error.log;`);

    if (enabled.some((r) => r.id === "rewrite")) {
      sections.push(`
    # WordPress Permalink Rewrites
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # Handle uploads
    location ~* /wp-content/uploads/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }`);
    }

    if (enabled.some((r) => r.id === "static-cache")) {
      sections.push(`
    # Static Asset Caching
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }`);
    }

    if (enabled.some((r) => r.id === "gzip")) {
      sections.push(`
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 5;`);
    }

    if (enabled.some((r) => r.id === "security")) {
      sections.push(`
    # Block xmlrpc.php (common attack vector)
    location = /xmlrpc.php {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block wp-json abuse (optional - can break REST API)
    # location /wp-json/ {
    #     allow your-ip-address;
    #     deny all;
    # }`);
    }

    if (enabled.some((r) => r.id === "uploads-php")) {
      sections.push(`
    # Block PHP execution in uploads directory
    location ~* /wp-content/uploads/.*\\.php$ {
        deny all;
    }`);
    }

    if (enabled.some((r) => r.id === "disable-symlinks")) {
      sections.push(`
    # Disable symlinks
    disable_symlinks if_not_owner;`);
    }

    sections.push(`
    # PHP-FPM Configuration
    location ~ \\.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\\.php)(/.+)$;
        fastcgi_pass unix:${phpSocket};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Increase timeouts for large operations
        fastcgi_read_timeout 300s;
        fastcgi_send_timeout 300s;
        fastcgi_connect_timeout 60s;
    }

    # Deny access to sensitive files
    location ~ /\\. {
        deny all;
    }

    location ~* \\.(engine|inc|info|install|make|module|profile|test|po|sh|.*sql|theme|tpl(\\.php)?|xtmpl|yml)(~|\\.sw[op])|\\.(bak|old|orig|save)$|\\.(gif|jpe?g|png|webp)$ {
        deny all;
    }
}`);

    return sections.join("\n") + "\n}";
  }

  const output = generateConfig();

  return (
    <div className="space-y-5">
      <Card title="Nginx Config Snippet Generator">
        <p className="text-sm text-slate-600 mb-4">
          WP-flavored Nginx config with rewrites, static caching, fastcgi_pass, and security rules. Toggle sections as needed.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Server Name</label>
            <input type="text" value={serverName} onChange={(e) => setServerName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Document Root</label>
            <input type="text" value={documentRoot} onChange={(e) => setDocumentRoot(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">PHP Socket</label>
            <input type="text" value={phpSocket} onChange={(e) => setPhpSocket(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <label key={rule.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
              rule.enabled ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}>
              <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600" />
              <span className="text-sm text-slate-700">{rule.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <OutputBox value={output} label="nginx.conf (server block)" />
    </div>
  );
}