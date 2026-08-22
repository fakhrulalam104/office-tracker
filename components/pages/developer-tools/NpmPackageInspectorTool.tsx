"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton, formatBytes } from "./shared";

interface PackageSummary {
  name: string;
  description: string;
  latestVersion: string;
  license: string;
  homepage?: string;
  repository?: string;
  dependenciesCount: number;
  dependencies: Record<string, string>;
  devDependenciesCount: number;
  peerDependenciesCount: number;
  totalVersions: number;
  latestReleaseDate: string;
  nodeEngine?: string;
  unpackedSize?: number;
  distTags: Record<string, string>;
  recentReleases: { version: string; date: string }[];
}

export function NpmPackageInspectorTool() {
  const [mode, setMode] = useState<"inspect" | "compare">("inspect");
  const [packageName, setPackageName] = useState("react");
  const [compareInput, setCompareInput] = useState("react, vue, svelte, @angular/core");

  const [inspectData, setInspectData] = useState<PackageSummary | null>(null);
  const [compareData, setCompareData] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "dependencies" | "releases" | "raw">("overview");
  const [rawPackageJson, setRawPackageJson] = useState<any | null>(null);

  const cleanPkgName = (str: string) => str.trim().toLowerCase();

  async function fetchNpmPackage(name: string): Promise<PackageSummary> {
    const clean = cleanPkgName(name);
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(clean)}`);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Package "${name}" was not found on npm registry.`);
      }
      throw new Error(`npm registry returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const latestVer = data["dist-tags"]?.latest || Object.keys(data.versions || {}).pop() || "0.0.0";
    const versionObj = data.versions?.[latestVer] || {};

    const timeObj = data.time || {};
    const releases: { version: string; date: string }[] = Object.entries(timeObj)
      .filter(([v]) => v !== "created" && v !== "modified")
      .map(([version, dateStr]) => ({
        version,
        date: new Date(dateStr as string).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }))
      .reverse()
      .slice(0, 15);

    let repoUrl = "";
    if (typeof versionObj.repository === "string") {
      repoUrl = versionObj.repository;
    } else if (versionObj.repository?.url) {
      repoUrl = versionObj.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
    }

    const dependencies = versionObj.dependencies || {};
    const devDependencies = versionObj.devDependencies || {};
    const peerDependencies = versionObj.peerDependencies || {};

    return {
      name: data.name || clean,
      description: data.description || versionObj.description || "No description provided.",
      latestVersion: latestVer,
      license: versionObj.license || data.license || "UNLICENSED",
      homepage: versionObj.homepage || data.homepage,
      repository: repoUrl,
      dependenciesCount: Object.keys(dependencies).length,
      dependencies,
      devDependenciesCount: Object.keys(devDependencies).length,
      peerDependenciesCount: Object.keys(peerDependencies).length,
      totalVersions: Object.keys(data.versions || {}).length,
      latestReleaseDate: timeObj[latestVer]
        ? new Date(timeObj[latestVer]).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "N/A",
      nodeEngine: versionObj.engines?.node,
      unpackedSize: versionObj.dist?.unpackedSize,
      distTags: data["dist-tags"] || {},
      recentReleases: releases,
    };
  }

  async function handleInspect(targetPkg?: string) {
    const pkg = targetPkg || packageName;
    if (!pkg.trim()) {
      setError("Please enter a package name.");
      return;
    }

    setLoading(true);
    setError("");
    setInspectData(null);
    setRawPackageJson(null);

    try {
      const summary = await fetchNpmPackage(pkg);
      setInspectData(summary);

      // fetch full object for raw viewer
      const rawRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(cleanPkgName(pkg))}`);
      if (rawRes.ok) {
        setRawPackageJson(await rawRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to inspect package");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompare() {
    const pkgs = compareInput
      .split(/[,vs\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (pkgs.length === 0) {
      setError("Please enter package names to compare.");
      return;
    }

    setLoading(true);
    setError("");
    setCompareData([]);

    try {
      const results = await Promise.all(
        pkgs.map(async (name) => {
          try {
            return await fetchNpmPackage(name);
          } catch {
            return null;
          }
        })
      );

      const valid = results.filter((r): r is PackageSummary => r !== null);
      if (valid.length === 0) {
        throw new Error("None of the specified packages could be loaded from npm.");
      }

      setCompareData(valid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare packages");
    } finally {
      setLoading(false);
    }
  }

  const presets = [
    { label: "react", mode: "inspect" as const, value: "react" },
    { label: "next", mode: "inspect" as const, value: "next" },
    { label: "tailwindcss", mode: "inspect" as const, value: "tailwindcss" },
    { label: "axios vs ky vs got", mode: "compare" as const, value: "axios, ky, got" },
    { label: "zod vs yup vs valibot", mode: "compare" as const, value: "zod, yup, valibot" },
    { label: "react vs vue vs svelte", mode: "compare" as const, value: "react, vue, svelte, @angular/core" },
  ];

  return (
    <div className="space-y-6">
      <Card title="npm Package Inspector & Comparator">
        <p className="text-sm text-slate-600 mb-5">
          Inspect public npm package metadata directly from the official registry. Check latest versions, dependency trees, license compatibility, unpacked size, release history, and compare multiple packages side by side.
        </p>

        {/* Mode Selector */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setMode("inspect")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                mode === "inspect" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📦 Single Package Inspector
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                mode === "compare" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ⚖️ Package Comparator (vs)
            </button>
          </div>

          {mode === "inspect" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  npm Package Name
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInspect()}
                  placeholder="e.g. react, axios, lodash, @auth/core"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleInspect()}
                  disabled={loading}
                  className={buttonClass + " w-full flex items-center justify-center gap-2 py-3.5"}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Querying npm...
                    </>
                  ) : (
                    "Inspect Package"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Packages to Compare (comma or space separated)
                </label>
                <input
                  type="text"
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                  placeholder="e.g. react, vue, svelte, @angular/core"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={loading}
                  className={buttonClass + " w-full flex items-center justify-center gap-2 py-3.5"}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Comparing...
                    </>
                  ) : (
                    "Compare Packages"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Presets:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMode(preset.mode);
                  if (preset.mode === "inspect") {
                    setPackageName(preset.value);
                    handleInspect(preset.value);
                  } else {
                    setCompareInput(preset.value);
                  }
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                {preset.label}
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
              npm Registry Notice
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {/* Single Package Inspector Output */}
        {mode === "inspect" && inspectData && (
          <div className="mt-6 space-y-6">
            {/* Header Hero */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-mono text-2xl font-bold text-slate-950">{inspectData.name}</h3>
                    <span className="rounded-full bg-sky-100 px-3 py-1 font-mono text-xs font-bold text-sky-800">
                      v{inspectData.latestVersion}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {inspectData.license}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 max-w-2xl">{inspectData.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {inspectData.repository && (
                    <a
                      href={inspectData.repository}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      GitHub Repo ↗
                    </a>
                  )}
                  {inspectData.homepage && (
                    <a
                      href={inspectData.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Homepage ↗
                    </a>
                  )}
                  <CopyButton
                    value={`npm install ${inspectData.name}`}
                    label="Copy npm i"
                    className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Dependencies</span>
                  <span className="font-mono text-lg font-bold text-slate-900">{inspectData.dependenciesCount}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Total Releases</span>
                  <span className="font-mono text-lg font-bold text-slate-900">{inspectData.totalVersions}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Last Published</span>
                  <span className="font-mono text-xs font-bold text-slate-900 truncate block mt-1">{inspectData.latestReleaseDate}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                  <span className="text-xs text-slate-400 block font-medium">Unpacked Size</span>
                  <span className="font-mono text-lg font-bold text-slate-900">
                    {inspectData.unpackedSize ? formatBytes(inspectData.unpackedSize) : "N/A"}
                  </span>
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
                Overview & Tags
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dependencies")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "dependencies" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Dependencies ({inspectData.dependenciesCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("releases")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "releases" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Recent Releases ({inspectData.recentReleases.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "raw" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Raw npm JSON
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Distribution Tags</h4>
                  <div className="divide-y divide-slate-100 font-mono text-xs">
                    {Object.entries(inspectData.distTags).map(([tag, ver]) => (
                      <div key={tag} className="flex justify-between py-2">
                        <span className="font-semibold text-slate-700">{tag}</span>
                        <span className="text-sky-700 font-bold">{ver}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Environment & Engines</h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Node.js Requirement</span>
                      <span className="font-mono font-bold text-slate-800">{inspectData.nodeEngine || "Any"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Peer Dependencies</span>
                      <span className="font-mono font-semibold text-slate-800">{inspectData.peerDependenciesCount}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Dev Dependencies</span>
                      <span className="font-mono font-semibold text-slate-800">{inspectData.devDependenciesCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Dependencies */}
            {activeTab === "dependencies" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Direct Dependencies ({inspectData.dependenciesCount})
                </h4>
                {inspectData.dependenciesCount > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(inspectData.dependencies).map(([depName, depVer]) => (
                      <button
                        key={depName}
                        type="button"
                        onClick={() => {
                          setPackageName(depName);
                          handleInspect(depName);
                        }}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-sky-300 hover:bg-sky-50/50"
                      >
                        <span className="font-mono text-xs font-semibold text-slate-800 truncate">{depName}</span>
                        <span className="font-mono text-xs text-sky-700 font-medium ml-2">{depVer}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Zero dependencies! This package has zero external runtime overhead.</p>
                )}
              </div>
            )}

            {/* Tab: Releases */}
            {activeTab === "releases" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Recent Versions Timeline
                </h4>
                <div className="divide-y divide-slate-100 font-mono text-xs">
                  {inspectData.recentReleases.map((rel) => (
                    <div key={rel.version} className="flex items-center justify-between py-2.5">
                      <span className="font-bold text-slate-800">v{rel.version}</span>
                      <span className="text-slate-400">{rel.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Raw */}
            {activeTab === "raw" && (
              <OutputBox value={JSON.stringify(rawPackageJson, null, 2)} label="Full Registry Document" />
            )}
          </div>
        )}

        {/* Multi-Package Comparison Output */}
        {mode === "compare" && compareData.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Side-by-Side Package Comparison</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">Metric / Feature</th>
                    {compareData.map((p) => (
                      <th key={p.name} className="px-4 py-3.5 font-mono text-slate-900 font-bold">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Latest Version</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-mono font-bold text-sky-700">
                        v{p.latestVersion}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">License</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-medium text-slate-800">
                        {p.license}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Dependencies</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-mono font-bold text-slate-900">
                        {p.dependenciesCount} deps
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Unpacked Size</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-mono text-slate-800">
                        {p.unpackedSize ? formatBytes(p.unpackedSize) : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Total Versions</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-mono text-slate-700">
                        {p.totalVersions} releases
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Latest Release</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 text-slate-600">
                        {p.latestReleaseDate}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Node Engine</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3 font-mono text-slate-700">
                        {p.nodeEngine || "Any"}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-500">Install Command</td>
                    {compareData.map((p) => (
                      <td key={p.name} className="px-4 py-3">
                        <CopyButton
                          value={`npm i ${p.name}`}
                          label={`npm i ${p.name}`}
                          className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
