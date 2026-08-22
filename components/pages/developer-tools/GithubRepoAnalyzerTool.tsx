"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton, formatBytes } from "./shared";

interface RepoAnalysis {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  homepage?: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string;
  license: string;
  defaultBranch: string;
  createdAt: string;
  pushedAt: string;
  updatedAt: string;
  sizeKb: number;
  topics: string[];
  isArchived: boolean;
  isFork: boolean;
  activityScore: number;
  activityLabel: "Very High" | "High" | "Moderate" | "Low" | "Inactive";
  maintenanceScore: number;
  maintenanceLabel: "Active & Maintained" | "Moderate" | "Needs Attention" | "Stale / Archived";
  latestRelease?: {
    name: string;
    tagName: string;
    publishedAt: string;
    htmlUrl: string;
  };
}

const PRESETS = [
  "facebook/react",
  "vercel/next.js",
  "tailwindlabs/tailwindcss",
  "nodejs/node",
  "microsoft/typescript",
  "torvalds/linux",
];

export function GithubRepoAnalyzerTool() {
  const [repoInput, setRepoInput] = useState("facebook/react");
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawJson, setRawJson] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "health" | "raw">("overview");

  const parseRepoString = (input: string): { owner: string; repo: string } | null => {
    let clean = input.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
    clean = clean.replace(/\.git$/i, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  };

  async function analyzeRepo(overrideInput?: string) {
    const targetStr = overrideInput || repoInput;
    const parsed = parseRepoString(targetStr);

    if (!parsed) {
      setError("Please enter a valid GitHub repository in 'owner/repo' or 'https://github.com/owner/repo' format.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setRawJson(null);

    try {
      const { owner, repo } = parsed;
      const repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          throw new Error(`Repository "${owner}/${repo}" not found on GitHub. Check spelling or ensure repository is public.`);
        }
        if (repoRes.status === 403) {
          throw new Error("GitHub API hourly rate limit reached (60 unauthenticated requests/hour per IP). Please try again in a few minutes.");
        }
        throw new Error(`GitHub API returned HTTP ${repoRes.status}`);
      }

      const repoData = await repoRes.json();
      setRawJson(repoData);

      // Try fetching latest release
      let latestRel: any = undefined;
      try {
        const relRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=1`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (relRes.ok) {
          const relList = await relRes.json();
          if (Array.isArray(relList) && relList.length > 0) {
            latestRel = {
              name: relList[0].name || relList[0].tag_name,
              tagName: relList[0].tag_name,
              publishedAt: new Date(relList[0].published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
              htmlUrl: relList[0].html_url,
            };
          }
        }
      } catch {
        // Releases optional
      }

      // Calculate health & activity scores
      const lastPushedDays = Math.max(0, Math.round((Date.now() - new Date(repoData.pushed_at).getTime()) / (1000 * 60 * 60 * 24)));
      
      let activityScore = 100;
      if (lastPushedDays > 365) activityScore = 10;
      else if (lastPushedDays > 180) activityScore = 30;
      else if (lastPushedDays > 60) activityScore = 55;
      else if (lastPushedDays > 14) activityScore = 80;

      let activityLabel: RepoAnalysis["activityLabel"] = "Very High";
      if (activityScore < 20) activityLabel = "Inactive";
      else if (activityScore < 45) activityLabel = "Low";
      else if (activityScore < 75) activityLabel = "Moderate";
      else if (activityScore < 90) activityLabel = "High";

      let maintenanceScore = 95;
      if (repoData.archived) maintenanceScore = 15;
      else if (lastPushedDays > 180) maintenanceScore = 40;
      else if (repoData.open_issues_count > 1500) maintenanceScore = 80;

      let maintenanceLabel: RepoAnalysis["maintenanceLabel"] = "Active & Maintained";
      if (repoData.archived) maintenanceLabel = "Stale / Archived";
      else if (maintenanceScore < 50) maintenanceLabel = "Needs Attention";
      else if (maintenanceScore < 85) maintenanceLabel = "Moderate";

      const result: RepoAnalysis = {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description || "No description provided.",
        htmlUrl: repoData.html_url,
        homepage: repoData.homepage,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.subscribers_count || repoData.watchers_count,
        openIssues: repoData.open_issues_count,
        language: repoData.language || "Multi-language",
        license: repoData.license?.spdx_id || repoData.license?.name || "No License",
        defaultBranch: repoData.default_branch,
        createdAt: new Date(repoData.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        pushedAt: new Date(repoData.pushed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        updatedAt: new Date(repoData.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        sizeKb: repoData.size,
        topics: Array.isArray(repoData.topics) ? repoData.topics : [],
        isArchived: Boolean(repoData.archived),
        isFork: Boolean(repoData.fork),
        activityScore,
        activityLabel,
        maintenanceScore,
        maintenanceLabel,
        latestRelease: latestRel,
      };

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card title="GitHub Repository Analyzer">
        <p className="text-sm text-slate-600 mb-5">
          Inspect public GitHub repository health, popularity metrics, license distribution, open issues ratio, language breakdown, recent release cadence, and codebase activity indicators.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                GitHub Repository (owner/repo or URL)
              </label>
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeRepo()}
                placeholder="e.g. facebook/react or https://github.com/vercel/next.js"
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => analyzeRepo()}
                disabled={loading}
                className={buttonClass + " w-full flex items-center justify-center gap-2 py-3.5"}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing Repo...
                  </>
                ) : (
                  "Analyze Repository"
                )}
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Popular Repos:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setRepoInput(preset);
                  analyzeRepo(preset);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              GitHub API Notice
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="mt-6 space-y-6">
            {/* Header Hero Banner */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-mono text-2xl font-bold text-slate-950">{analysis.fullName}</h3>
                    {analysis.isArchived && (
                      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                        Archived
                      </span>
                    )}
                    {analysis.isFork && (
                      <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-700">
                        Fork
                      </span>
                    )}
                    <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-bold text-sky-800">
                      {analysis.language}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                      {analysis.license}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 max-w-2xl">{analysis.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={analysis.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    View on GitHub ↗
                  </a>
                  {analysis.homepage && (
                    <a
                      href={analysis.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Website ↗
                    </a>
                  )}
                  <CopyButton
                    value={`git clone ${analysis.htmlUrl}.git`}
                    label="Copy Clone"
                    className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <span className="text-xs text-slate-400 block font-medium">⭐ Stargazers</span>
                  <span className="font-mono text-xl font-bold text-slate-900">{formatNumber(analysis.stars)}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <span className="text-xs text-slate-400 block font-medium">🍴 Forks</span>
                  <span className="font-mono text-xl font-bold text-slate-900">{formatNumber(analysis.forks)}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <span className="text-xs text-slate-400 block font-medium">🐛 Open Issues</span>
                  <span className="font-mono text-xl font-bold text-slate-900">{formatNumber(analysis.openIssues)}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                  <span className="text-xs text-slate-400 block font-medium">👁️ Watchers</span>
                  <span className="font-mono text-xl font-bold text-slate-900">{formatNumber(analysis.watchers)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "overview" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Overview & Health Scores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("health")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "health" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Topics & Releases
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "raw" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Raw GitHub JSON
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Health & Maintenance Meter */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Repository Health & Activity
                  </h4>

                  {/* Activity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">Commit Activity</span>
                      <span className="font-bold text-sky-700">{analysis.activityLabel} ({analysis.activityScore}%)</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${analysis.activityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Maintenance Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">Maintenance Status</span>
                      <span className="font-bold text-emerald-700">{analysis.maintenanceLabel}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${analysis.maintenanceScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Last Pushed</span>
                      <span className="font-semibold text-slate-800">{analysis.pushedAt}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Repository Size</span>
                      <span className="font-mono text-slate-800">{formatBytes(analysis.sizeKb * 1024)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Default Branch</span>
                      <span className="font-mono font-bold text-slate-800">{analysis.defaultBranch}</span>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Repository Metadata
                  </h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Created Date</span>
                      <span className="font-medium text-slate-800">{analysis.createdAt}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">SPDX License</span>
                      <span className="font-semibold text-slate-800">{analysis.license}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Latest Release</span>
                      <span className="font-mono font-bold text-sky-700">
                        {analysis.latestRelease ? analysis.latestRelease.tagName : "No published releases"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Primary Language</span>
                      <span className="font-semibold text-slate-800">{analysis.language}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Topics & Releases */}
            {activeTab === "health" && (
              <div className="space-y-4">
                {/* Topics */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Repository Topics & Tags ({analysis.topics.length})
                  </h4>
                  {analysis.topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.topics.map((t) => (
                        <span key={t} className="rounded-lg bg-sky-50 px-3 py-1 font-mono text-xs font-semibold text-sky-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No topics configured for this repository.</p>
                  )}
                </div>

                {/* Latest Release Card */}
                {analysis.latestRelease && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Latest Release</div>
                      <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                        {analysis.latestRelease.tagName} ({analysis.latestRelease.name})
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Published on {analysis.latestRelease.publishedAt}</div>
                    </div>
                    <a
                      href={analysis.latestRelease.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Release Notes ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Raw */}
            {activeTab === "raw" && (
              <OutputBox value={JSON.stringify(rawJson, null, 2)} label="GitHub REST API Output" />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
