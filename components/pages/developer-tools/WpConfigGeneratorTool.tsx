"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, copyText } from "./shared";

const SALT_KEYS = [
  "AUTH_KEY", "SECURE_AUTH_KEY", "LOGGED_IN_KEY", "NONCE_KEY",
  "AUTH_SALT", "SECURE_AUTH_SALT", "LOGGED_IN_SALT", "NONCE_SALT",
];

function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=[]{}|;:,.<>?`~";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

interface Config {
  dbName: string;
  dbUser: string;
  dbPass: string;
  dbHost: string;
  dbCharset: string;
  tablePrefix: string;
  debug: boolean;
  debugLog: boolean;
  debugDisplay: boolean;
  memoryLimit: string;
  fsMethod: string;
  multisite: boolean;
  wpDebug: boolean;
}

function generateWpConfig(config: Config): string {
  const salts = SALT_KEYS.map((key) => `define('${key}', '${generateRandomString(64)}');`).join("\n");
  
  return `<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't need to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * @package WordPress
 */

// ** Database settings ** //
define( 'DB_NAME', '${config.dbName}' );
define( 'DB_USER', '${config.dbUser}' );
define( 'DB_PASSWORD', '${config.dbPass}' );
define( 'DB_HOST', '${config.dbHost}' );
define( 'DB_CHARSET', '${config.dbCharset}' );
define( 'DB_COLLATE', '' );

/**
 * Authentication unique keys and salts.
 */
${salts}

/**
 * WordPress database table prefix.
 */
\$table_prefix = '${config.tablePrefix}';

/**
 * Debugging mode.
 */
define( 'WP_DEBUG', ${config.wpDebug ? "true" : "false"} );
define( 'WP_DEBUG_LOG', ${config.debugLog ? "true" : "false"} );
define( 'WP_DEBUG_DISPLAY', ${config.debugDisplay ? "true" : "false"} );

/**
 * Memory limits.
 */
define( 'WP_MEMORY_LIMIT', '${config.memoryLimit}' );
define( 'WP_MAX_MEMORY_LIMIT', '${config.memoryLimit}' );

/**
 * Filesystem method.
 */
${config.fsMethod ? `define( 'FS_METHOD', '${config.fsMethod}' );` : "// define( 'FS_METHOD', 'direct' );"}

${config.multisite ? `/**
 * Multisite settings.
 */
define( 'WP_ALLOW_MULTISITE', true );
define( 'MULTISITE', true );
define( 'SUBDOMAIN_INSTALL', false );
define( 'DOMAIN_CURRENT_SITE', '${config.dbHost}' );
define( 'PATH_CURRENT_SITE', '/' );
define( 'SITE_ID_CURRENT_SITE', 1 );
define( 'BLOG_ID_CURRENT_SITE', 1 );` : "// define( 'WP_ALLOW_MULTISITE', true );"}

/**
 * Absolute path to the WordPress directory.
 */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';`;
}

export function WpConfigGeneratorTool() {
  const [config, setConfig] = useState<Config>({
    dbName: "wordpress",
    dbUser: "root",
    dbPass: "",
    dbHost: "localhost",
    dbCharset: "utf8mb4",
    tablePrefix: "wp_",
    debug: true,
    debugLog: true,
    debugDisplay: false,
    memoryLimit: "256M",
    fsMethod: "direct",
    multisite: false,
    wpDebug: true,
  });

  function updateConfig(key: keyof Config, value: string | boolean) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const output = generateWpConfig(config);

  return (
    <div className="space-y-5">
      <Card title="wp-config.php Generator">
        <p className="text-sm text-slate-600 mb-4">
          Generate a complete wp-config.php file with database settings, debug constants, memory limits, and auto-generated salts.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Database Name</label>
            <input type="text" value={config.dbName} onChange={(e) => updateConfig("dbName", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Database User</label>
            <input type="text" value={config.dbUser} onChange={(e) => updateConfig("dbUser", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Database Password</label>
            <input type="password" value={config.dbPass} onChange={(e) => updateConfig("dbPass", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Database Host</label>
            <input type="text" value={config.dbHost} onChange={(e) => updateConfig("dbHost", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Table Prefix</label>
            <input type="text" value={config.tablePrefix} onChange={(e) => updateConfig("tablePrefix", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Memory Limit</label>
            <input type="text" value={config.memoryLimit} onChange={(e) => updateConfig("memoryLimit", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.wpDebug} onChange={(e) => updateConfig("wpDebug", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
            <span className="text-sm font-semibold text-slate-700">WP_DEBUG</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.debugLog} onChange={(e) => updateConfig("debugLog", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
            <span className="text-sm font-semibold text-slate-700">WP_DEBUG_LOG</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.debugDisplay} onChange={(e) => updateConfig("debugDisplay", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
            <span className="text-sm font-semibold text-slate-700">WP_DEBUG_DISPLAY</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.multisite} onChange={(e) => updateConfig("multisite", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
            <span className="text-sm font-semibold text-slate-700">Multisite</span>
          </label>
        </div>
      </Card>

      <OutputBox value={output} label="wp-config.php" />
    </div>
  );
}