"use client";

import { useState } from "react";
import { Card } from "./shared";

type CheatCategory = "http" | "css" | "sql" | "linux" | "git";

const sheets: Record<CheatCategory, { title: string; items: { code: string; desc: string }[] }> = {
  http: {
    title: "HTTP Status Codes",
    items: [
      { code: "200", desc: "OK" },
      { code: "201", desc: "Created" },
      { code: "204", desc: "No Content" },
      { code: "301", desc: "Moved Permanently" },
      { code: "304", desc: "Not Modified" },
      { code: "400", desc: "Bad Request" },
      { code: "401", desc: "Unauthorized" },
      { code: "403", desc: "Forbidden" },
      { code: "404", desc: "Not Found" },
      { code: "409", desc: "Conflict" },
      { code: "422", desc: "Unprocessable Entity" },
      { code: "429", desc: "Too Many Requests" },
      { code: "500", desc: "Internal Server Error" },
      { code: "502", desc: "Bad Gateway" },
      { code: "503", desc: "Service Unavailable" },
    ]
  },
  css: {
    title: "CSS Properties",
    items: [
      { code: "display: flex", desc: "Flexbox container" },
      { code: "display: grid", desc: "Grid container" },
      { code: "position: sticky", desc: "Sticky positioning" },
      { code: "gap: 1rem", desc: "Grid/flex gap" },
      { code: "aspect-ratio: 16/9", desc: "Aspect ratio" },
      { code: "overflow: clip", desc: "Clip overflow" },
      { code: "text-overflow: ellipsis", desc: "Truncate text" },
      { code: "backdrop-filter: blur()", desc: "Background blur" },
      { code: "accent-color: #xxx", desc: "Form accent color" },
      { code: "scroll-behavior: smooth", desc: "Smooth scroll" },
      { code: "container-type: inline-size", desc: "Container queries" },
      { code: "color-scheme: dark", desc: "Dark mode hint" },
    ]
  },
  sql: {
    title: "SQL Queries",
    items: [
      { code: "SELECT * FROM t", desc: "Select all" },
      { code: "WHERE x IN (1,2,3)", desc: "In list" },
      { code: "GROUP BY col HAVING ...", desc: "Group filter" },
      { code: "JOIN t2 ON t.id = t2.id", desc: "Inner join" },
      { code: "LEFT JOIN t2 ON ...", desc: "Left join" },
      { code: "ORDER BY col DESC", desc: "Sort descending" },
      { code: "LIMIT 10 OFFSET 20", desc: "Pagination" },
      { code: "INSERT INTO t (a) VALUES (1)", desc: "Insert row" },
      { code: "UPDATE t SET a = 1 WHERE ...", desc: "Update rows" },
      { code: "DELETE FROM t WHERE ...", desc: "Delete rows" },
      { code: "CREATE INDEX idx ON t(col)", desc: "Create index" },
      { code: "CASE WHEN ... THEN ... END", desc: "Conditional" },
    ]
  },
  linux: {
    title: "Linux Commands",
    items: [
      { code: "ls -la", desc: "List all files" },
      { code: "grep -rn \"text\"", desc: "Recursive search" },
      { code: "find . -name \"*.ts\"", desc: "Find files" },
      { code: "cat file | head -20", desc: "First 20 lines" },
      { code: "du -sh *", desc: "Directory sizes" },
      { code: "ps aux | grep node", desc: "Find processes" },
      { code: "kill -9 PID", desc: "Force kill" },
      { code: "curl -I url", desc: "Headers only" },
      { code: "tar -czf a.tar.gz dir", desc: "Compress" },
      { code: "chmod 755 file", desc: "Set permissions" },
      { code: "ssh user@host", desc: "Remote login" },
      { code: "rsync -avz src dest", desc: "Sync files" },
    ]
  },
  git: {
    title: "Git Commands",
    items: [
      { code: "git stash", desc: "Stash changes" },
      { code: "git stash pop", desc: "Apply stash" },
      { code: "git rebase main", desc: "Rebase on main" },
      { code: "git cherry-pick abc123", desc: "Pick commit" },
      { code: "git log --oneline -10", desc: "Recent commits" },
      { code: "git diff --staged", desc: "Staged changes" },
      { code: "git reset --soft HEAD~1", desc: "Undo last commit" },
      { code: "git branch -d name", desc: "Delete branch" },
      { code: "git reflog", desc: "Recover lost commits" },
      { code: "git bisect start", desc: "Binary search bug" },
      { code: "git worktree add ../dir", desc: "Parallel worktree" },
      { code: "git shortlog -sn", desc: "Contributor stats" },
    ]
  }
};

const categories: { key: CheatCategory; label: string }[] = [
  { key: "http", label: "HTTP" },
  { key: "css", label: "CSS" },
  { key: "sql", label: "SQL" },
  { key: "linux", label: "Linux" },
  { key: "git", label: "Git" }
];

export function CheatSheetTool() {
  const [active, setActive] = useState<CheatCategory>("http");
  const sheet = sheets[active];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActive(cat.key)}
            className={active === cat.key ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <Card title={sheet.title}>
        <div className="grid gap-2 sm:grid-cols-2">
          {sheet.items.map((item) => (
            <div key={item.code} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <code className="shrink-0 font-mono text-sm font-semibold text-sky-700">{item.code}</code>
              <span className="text-sm text-slate-600">{item.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
