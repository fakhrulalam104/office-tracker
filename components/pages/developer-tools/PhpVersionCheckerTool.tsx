"use client";
import { useState } from "react";
import { Card, OutputBox, textAreaClass, buttonClass, softButtonClass } from "./shared";

interface DeprecatedFunction {
  pattern: RegExp;
  name: string;
  removedIn: string;
  replacement: string;
  severity: "error" | "warning";
}

const DEPRECATED_FUNCTIONS: DeprecatedFunction[] = [
  { pattern: /\bcreate_function\s*\(/g, name: "create_function()", removedIn: "PHP 8.0", replacement: "Use anonymous functions (closures) instead", severity: "error" },
  { pattern: /\beach\s*\(/g, name: "each()", removedIn: "PHP 8.0", replacement: "Use foreach() or reset()/key()/current()", severity: "error" },
  { pattern: /\bmysql_connect\s*\(/g, name: "mysql_connect()", removedIn: "PHP 7.0", replacement: "Use mysqli_connect() or PDO", severity: "error" },
  { pattern: /\bmysql_query\s*\(/g, name: "mysql_query()", removedIn: "PHP 7.0", replacement: "Use mysqli_query()", severity: "error" },
  { pattern: /\bmysql_fetch_array\s*\(/g, name: "mysql_fetch_array()", removedIn: "PHP 7.0", replacement: "Use mysqli_fetch_array()", severity: "error" },
  { pattern: /\bmysql_real_escape_string\s*\(/g, name: "mysql_real_escape_string()", removedIn: "PHP 7.0", replacement: "Use mysqli_real_escape_string()", severity: "error" },
  { pattern: /\bereg\s*\(/g, name: "ereg()", removedIn: "PHP 7.0", replacement: "Use preg_match() instead", severity: "error" },
  { pattern: /\beregi\s*\(/g, name: "eregi()", removedIn: "PHP 7.0", replacement: "Use preg_match() with /i modifier", severity: "error" },
  { pattern: /\bereg_replace\s*\(/g, name: "ereg_replace()", removedIn: "PHP 7.0", replacement: "Use preg_replace() instead", severity: "error" },
  { pattern: /\bsplit\s*\(/g, name: "split()", removedIn: "PHP 7.0", replacement: "Use explode() or preg_split()", severity: "error" },
  { pattern: /\bmysql_num_rows\s*\(/g, name: "mysql_num_rows()", removedIn: "PHP 7.0", replacement: "Use mysqli_num_rows()", severity: "error" },
  { pattern: /\bmysql_error\s*\(/g, name: "mysql_error()", removedIn: "PHP 7.0", replacement: "Use mysqli_error()", severity: "error" },
  { pattern: /\bget_magic_quotes_gpc\s*\(/g, name: "get_magic_quotes_gpc()", removedIn: "PHP 7.4", replacement: "Magic quotes removed entirely; strip slashes manually if needed", severity: "warning" },
  { pattern: /\bget_magic_quotes_runtime\s*\(/g, name: "get_magic_quotes_runtime()", removedIn: "PHP 7.4", replacement: "Removed entirely", severity: "warning" },
  { pattern: /\bFILTER_SANITIZE_STRING\b/g, name: "FILTER_SANITIZE_STRING", removedIn: "PHP 8.1", replacement: "Use FILTER_SANITIZE_FULL_SPECIAL_CHARS or htmlspecialchars()", severity: "warning" },
  { pattern: /\butf8_encode\s*\(/g, name: "utf8_encode()", removedIn: "PHP 8.2", replacement: "Use mb_convert_encoding($str, 'UTF-8', 'ISO-8859-1')", severity: "warning" },
  { pattern: /\butf8_decode\s*\(/g, name: "utf8_decode()", removedIn: "PHP 8.2", replacement: "Use mb_convert_encoding($str, 'ISO-8859-1', 'UTF-8')", severity: "warning" },
  { pattern: /\bDynamicProperties\b/g, name: "Dynamic Properties", removedIn: "PHP 8.2", replacement: "Add #[\\AllowDynamicProperties] attribute or declare properties explicitly", severity: "warning" },
  { pattern: /\b(FILTER_SANITIZE_STRIPPED)\b/g, name: "FILTER_SANITIZE_STRIPPED", removedIn: "PHP 8.1", replacement: "Use FILTER_SANITIZE_FULL_SPECIAL_CHARS", severity: "warning" },
];

export function PhpVersionCheckerTool() {
  const [code, setCode] = useState(`<?php
// Example: Paste plugin/theme code here
function old_function() {
    \$result = create_function('\$a, \$b', 'return \$a * \$b;');
    \$arr = array(1, 2, 3);
    each(\$arr);
    \$link = mysql_connect('localhost', 'user', 'pass');
}`);
  const [findings, setFindings] = useState<{ function: DeprecatedFunction; line: number }[]>([]);

  function checkCode() {
    const lines = code.split("\n");
    const results: { function: DeprecatedFunction; line: number }[] = [];

    lines.forEach((line, index) => {
      for (const fn of DEPRECATED_FUNCTIONS) {
        if (fn.pattern.test(line)) {
          results.push({ function: fn, line: index + 1 });
        }
        // Reset regex lastIndex
        fn.pattern.lastIndex = 0;
      }
    });

    setFindings(results);
  }

  const output = findings.length === 0
    ? "Click 'Check Code' to scan for deprecated functions."
    : findings.map((f) => `Line ${f.line}: ${f.function.name}\n  Removed in: ${f.function.removedIn}\n  Severity: ${f.function.severity.toUpperCase()}\n  Fix: ${f.function.replacement}\n`).join("\n");

  return (
    <div className="space-y-5">
      <Card title="PHP Version Compatibility Checker">
        <p className="text-sm text-slate-600 mb-4">
          Paste PHP code to flag deprecated functions that break on PHP 8+. Useful before hosting upgrades.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">PHP Code to Check</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={textAreaClass}
              rows={12}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={checkCode} className={buttonClass}>Check Code</button>
            <button type="button" onClick={() => { setCode(""); setFindings([]); }} className={softButtonClass}>Clear</button>
          </div>
        </div>

        {findings.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-bold text-slate-700">Found {findings.length} issue(s):</div>
            {findings.map((f, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${
                f.function.severity === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <span className="font-mono font-bold">Line {f.line}:</span> {f.function.name} — removed in {f.function.removedIn}
                <div className="text-xs mt-1 opacity-80">Fix: {f.function.replacement}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <OutputBox value={output} label="Compatibility Report" />
    </div>
  );
}