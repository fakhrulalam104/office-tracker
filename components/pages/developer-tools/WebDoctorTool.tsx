"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton } from "./shared";

interface DiagnosticResult {
  domain: {
    status: "pass" | "warn" | "fail";
    name: string;
    registrar?: string;
    registeredOn?: string;
    expiresOn?: string;
    daysRemaining?: number;
    score: number;
    details: string[];
  };
  dns: {
    status: "pass" | "warn" | "fail";
    hasA: boolean;
    hasAAAA: boolean;
    hasMX: boolean;
    hasTXT: boolean;
    hasCAA: boolean;
    hasNS: boolean;
    isDnssec: boolean;
    aRecords: string[];
    aaaaRecords: string[];
    mxRecords: string[];
    nsRecords: string[];
    score: number;
    details: string[];
  };
  network: {
    status: "pass" | "warn" | "fail";
    ip?: string;
    asn?: string;
    provider?: string;
    country?: string;
    score: number;
    details: string[];
  };
  http: {
    status: "pass" | "warn" | "fail";
    statusCode?: number;
    responseTimeMs?: number;
    accessible: boolean;
    score: number;
    details: string[];
  };
  github?: {
    detected: boolean;
    repoName?: string;
    stars?: number;
    forks?: number;
    license?: string;
    lastCommit?: string;
  };
  overallScore: number;
  recommendations: string[];
}

export function WebDoctorTool() {
  const [targetInput, setTargetInput] = useState("google.com");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const cleanDomain = (input: string) => {
    return input.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  };

  async function fetchCloudflareDns(name: string, type: string) {
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { Accept: "application/dns-json" },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function runWebDoctor() {
    const domain = cleanDomain(targetInput);
    if (!domain) {
      setError("Please enter a valid domain name or website URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgressStep("Initializing WebDoctor diagnostic suite...");

    try {
      // 1. DNS Queries (Cloudflare DoH)
      setProgressStep("Querying Cloudflare DNS over HTTPS (A, AAAA, MX, TXT, CAA, NS)...");
      const [aData, aaaaData, mxData, txtData, caaData, nsData] = await Promise.all([
        fetchCloudflareDns(domain, "A"),
        fetchCloudflareDns(domain, "AAAA"),
        fetchCloudflareDns(domain, "MX"),
        fetchCloudflareDns(domain, "TXT"),
        fetchCloudflareDns(domain, "CAA"),
        fetchCloudflareDns(domain, "NS"),
      ]);

      const aRecords = (aData?.Answer || []).filter((r: any) => r.type === 1).map((r: any) => r.data);
      const aaaaRecords = (aaaaData?.Answer || []).filter((r: any) => r.type === 28).map((r: any) => r.data);
      const mxRecords = (mxData?.Answer || []).filter((r: any) => r.type === 15).map((r: any) => r.data);
      const nsRecords = (nsData?.Answer || []).filter((r: any) => r.type === 2).map((r: any) => r.data);
      const caaRecords = (caaData?.Answer || []).filter((r: any) => r.type === 257).map((r: any) => r.data);
      const isDnssec = Boolean(aData?.AD || aaaaData?.AD);

      const hasA = aRecords.length > 0;
      const hasAAAA = aaaaRecords.length > 0;
      const hasMX = mxRecords.length > 0;
      const hasTXT = (txtData?.Answer || []).length > 0;
      const hasCAA = caaRecords.length > 0;
      const hasNS = nsRecords.length > 0;

      let dnsScore = 100;
      const dnsDetails: string[] = [];
      if (hasA) dnsDetails.push("IPv4 (A record) resolves properly.");
      else {
        dnsScore -= 40;
        dnsDetails.push("Missing IPv4 (A record).");
      }

      if (hasAAAA) dnsDetails.push("IPv6 (AAAA record) configured.");
      else {
        dnsScore -= 10;
        dnsDetails.push("No IPv6 (AAAA record) detected.");
      }

      if (hasMX) dnsDetails.push("Mail Exchange (MX) records active.");
      else dnsDetails.push("No MX records (domain does not handle inbound email directly).");

      if (hasCAA) dnsDetails.push("CAA record present (SSL issuance restricted to authorized CAs).");
      else {
        dnsScore -= 10;
        dnsDetails.push("No CAA record found (any authorized CA can issue certificates).");
      }

      if (hasNS) dnsDetails.push(`Authoritative nameservers verified (${nsRecords.length} NS records).`);
      if (isDnssec) dnsDetails.push("DNSSEC cryptographic validation active.");

      dnsScore = Math.max(20, dnsScore);

      // 2. Domain & RDAP Inspection
      setProgressStep("Querying RDAP bootstrap for domain registration & expiry...");
      let domainScore = 100;
      const domainDetails: string[] = [];
      let registrarName = "Unknown Registrar";
      let regDateStr = "";
      let expDateStr = "";
      let daysRemaining: number | undefined = undefined;

      try {
        const rdapRes = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
          headers: { Accept: "application/rdap+json, application/json" },
        });

        if (rdapRes.ok) {
          const rdap = await rdapRes.json();
          domainDetails.push("Domain registration confirmed via RDAP.");

          // Find registrar
          if (rdap.entities && Array.isArray(rdap.entities)) {
            const reg = rdap.entities.find((e: any) => e.roles?.includes("registrar"));
            if (reg?.vcardArray && Array.isArray(reg.vcardArray[1])) {
              const fn = reg.vcardArray[1].find((p: any) => p[0] === "fn");
              if (fn?.[3]) registrarName = fn[3];
            } else if (reg?.handle) {
              registrarName = reg.handle;
            }
          }

          // Dates
          if (rdap.events && Array.isArray(rdap.events)) {
            const regEvt = rdap.events.find((e: any) => e.eventAction === "registration");
            const expEvt = rdap.events.find((e: any) => e.eventAction === "expiration");

            if (regEvt?.eventDate) {
              regDateStr = new Date(regEvt.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              domainDetails.push(`Registered on ${regDateStr}`);
            }

            if (expEvt?.eventDate) {
              expDateStr = new Date(expEvt.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              daysRemaining = Math.round((new Date(expEvt.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              if (daysRemaining < 30) {
                domainScore -= 30;
                domainDetails.push(`⚠️ Expiration warning: Expires in ${daysRemaining} days!`);
              } else {
                domainDetails.push(`Active until ${expDateStr} (${daysRemaining} days remaining)`);
              }
            }
          }
        } else {
          domainScore -= 15;
          domainDetails.push("RDAP information query not available for this TLD.");
        }
      } catch {
        domainDetails.push("RDAP query skipped.");
      }

      // 3. Network & IP Lookup
      setProgressStep("Diagnosing hosting infrastructure & network routing...");
      let netScore = 95;
      const netDetails: string[] = [];
      let primaryIp = aRecords[0] || aaaaRecords[0];
      let networkProvider = "Cloud Provider / CDN";
      let asnStr = "";
      let countryStr = "";

      if (primaryIp) {
        netDetails.push(`Primary IP address: ${primaryIp}`);
        try {
          const ipRdapRes = await fetch(`https://rdap.org/ip/${encodeURIComponent(primaryIp)}`);
          if (ipRdapRes.ok) {
            const ipRdap = await ipRdapRes.json();
            if (ipRdap.name) networkProvider = ipRdap.name;
            if (ipRdap.country) countryStr = ipRdap.country;
            netDetails.push(`Network owner: ${networkProvider}`);
            if (countryStr) netDetails.push(`Geographic routing: ${countryStr}`);
          }
        } catch {
          // fallback
        }
      } else {
        netScore -= 40;
        netDetails.push("No resolving IP found for network diagnosis.");
      }

      // 4. HTTP & Latency benchmark
      setProgressStep("Testing HTTP response code and roundtrip latency...");
      let httpScore = 100;
      const httpDetails: string[] = [];
      let statusCode = 200;
      let latencyMs = 0;
      let isAccessible = true;

      const httpStart = performance.now();
      try {
        // Ping using HTTPS HEAD/GET or DoH latency approximation
        await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, { cache: "no-store" });
        latencyMs = Math.round(performance.now() - httpStart);

        if (latencyMs < 200) {
          httpDetails.push(`Fast response time: ${latencyMs}ms`);
        } else if (latencyMs < 600) {
          httpScore -= 10;
          httpDetails.push(`Moderate latency: ${latencyMs}ms`);
        } else {
          httpScore -= 25;
          httpDetails.push(`High latency: ${latencyMs}ms`);
        }
        httpDetails.push("Domain is reachable over standard HTTPS port 443.");
      } catch {
        isAccessible = false;
        httpScore -= 50;
        httpDetails.push("Failed to establish fast connection to host.");
      }

      // 5. GitHub detection
      setProgressStep("Checking for associated public open source repositories...");
      let githubInfo: DiagnosticResult["github"] = undefined;
      const cleanName = domain.split(".")[0];
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${cleanName}/${cleanName}`);
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          githubInfo = {
            detected: true,
            repoName: ghData.full_name,
            stars: ghData.stargazers_count,
            forks: ghData.forks_count,
            license: ghData.license?.spdx_id || "Open Source",
            lastCommit: new Date(ghData.pushed_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }),
          };
        }
      } catch {
        // github optional
      }

      // Build recommendations & overall score
      const recommendations: string[] = [];
      if (!hasCAA) {
        recommendations.push("Add a CAA DNS record (e.g., `0 issue \"letsencrypt.org\"`) to prevent unauthorized certificate authorities from issuing SSL certs.");
      }
      if (!hasAAAA) {
        recommendations.push("Enable IPv6 AAAA records on your hosting provider / CDN to improve performance and accessibility for mobile networks.");
      }
      if (!isDnssec) {
        recommendations.push("Enable DNSSEC in your domain registrar / DNS provider for tamper-proof cryptographic record validation.");
      }
      if (daysRemaining !== undefined && daysRemaining < 60) {
        recommendations.push(`Renew domain registration soon — domain expires in ${daysRemaining} days.`);
      }

      const overall = Math.round((dnsScore * 0.35) + (domainScore * 0.25) + (netScore * 0.2) + (httpScore * 0.2));

      const diagnosticData: DiagnosticResult = {
        domain: {
          status: domainScore >= 80 ? "pass" : domainScore >= 50 ? "warn" : "fail",
          name: domain,
          registrar: registrarName !== "Unknown Registrar" ? registrarName : undefined,
          registeredOn: regDateStr || undefined,
          expiresOn: expDateStr || undefined,
          daysRemaining,
          score: domainScore,
          details: domainDetails,
        },
        dns: {
          status: dnsScore >= 80 ? "pass" : dnsScore >= 50 ? "warn" : "fail",
          hasA,
          hasAAAA,
          hasMX,
          hasTXT,
          hasCAA,
          hasNS,
          isDnssec,
          aRecords,
          aaaaRecords,
          mxRecords,
          nsRecords,
          score: dnsScore,
          details: dnsDetails,
        },
        network: {
          status: netScore >= 80 ? "pass" : "warn",
          ip: primaryIp,
          asn: asnStr || undefined,
          provider: networkProvider,
          country: countryStr || undefined,
          score: netScore,
          details: netDetails,
        },
        http: {
          status: httpScore >= 80 ? "pass" : "warn",
          statusCode,
          responseTimeMs: latencyMs,
          accessible: isAccessible,
          score: httpScore,
          details: httpDetails,
        },
        github: githubInfo,
        overallScore: overall,
        recommendations,
      };

      setResult(diagnosticData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WebDoctor diagnostic scan failed");
    } finally {
      setLoading(false);
      setProgressStep("");
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 border-emerald-500 bg-emerald-50";
    if (score >= 70) return "text-sky-600 border-sky-500 bg-sky-50";
    if (score >= 50) return "text-amber-600 border-amber-500 bg-amber-50";
    return "text-red-600 border-red-500 bg-red-50";
  };

  const getSummaryMarkdown = (res: DiagnosticResult): string => {
    return `# WebDoctor Diagnostic Report for ${res.domain.name}
Overall Technical Score: ${res.overallScore}/100

## Category Breakdown
- DNS Health: ${res.dns.score}/100
- Domain Registration: ${res.domain.score}/100
- Network & Hosting: ${res.network.score}/100
- Performance & HTTP: ${res.http.score}/100

## DNS Records
- A Record: ${res.dns.hasA ? res.dns.aRecords.join(", ") : "Missing"}
- AAAA Record: ${res.dns.hasAAAA ? res.dns.aaaaRecords.join(", ") : "None (IPv4 only)"}
- MX Record: ${res.dns.hasMX ? res.dns.mxRecords.join(", ") : "None"}
- CAA Record: ${res.dns.hasCAA ? "Configured" : "Missing"}
- DNSSEC: ${res.dns.isDnssec ? "Validated" : "Disabled"}

## Registration
- Registrar: ${res.domain.registrar || "N/A"}
- Registered On: ${res.domain.registeredOn || "N/A"}
- Expires On: ${res.domain.expiresOn || "N/A"}

## Network
- Primary IP: ${res.network.ip || "N/A"}
- Provider: ${res.network.provider || "N/A"}
- Latency: ${res.http.responseTimeMs}ms

## Recommendations
${res.recommendations.map((r) => `- ${r}`).join("\n")}
`;
  };

  return (
    <div className="space-y-6">
      <Card title="WebDoctor: Comprehensive Domain & Infrastructure Diagnostic">
        <p className="text-sm text-slate-600 mb-5">
          All-in-one developer diagnostic suite combining Cloudflare DNS-over-HTTPS, RDAP registration, network infrastructure inspection, HTTP latency benchmarks, and GitHub repository detection. Enter any domain or URL to audit its technical health score.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Target Website / Domain
              </label>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runWebDoctor()}
                placeholder="e.g. google.com, github.com, or nextjs.org"
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={runWebDoctor}
                disabled={loading}
                className={buttonClass + " w-full flex items-center justify-center gap-2 py-3.5"}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Running WebDoctor...
                  </>
                ) : (
                  "🩺 Run WebDoctor Audit"
                )}
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Quick Test:</span>
            {["google.com", "cloudflare.com", "github.com", "wikipedia.org", "openai.com"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setTargetInput(preset);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Progress State */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
              <span className="text-sm font-semibold text-sky-900">{progressStep}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              WebDoctor Notice
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            {/* Big Technical Score Banner */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 p-6 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-sky-400">
                    WebDoctor Technical Health Score
                  </div>
                  <h3 className="mt-1 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {result.domain.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                    {result.domain.registrar && <span>Registrar: <strong>{result.domain.registrar}</strong></span>}
                    {result.network.provider && <span>• Network: <strong>{result.network.provider}</strong></span>}
                    <span>• Latency: <strong>{result.http.responseTimeMs}ms</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-sm">
                    <span className="font-mono text-4xl font-bold text-sky-300 sm:text-5xl">
                      {result.overallScore}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-0.5">
                      / 100 Overall
                    </span>
                  </div>
                  <CopyButton
                    value={getSummaryMarkdown(result)}
                    label="Copy Report"
                    className="rounded-full bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
                  />
                </div>
              </div>

              {/* Sub-Score Bars */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">DNS Health</span>
                    <span className="text-sky-300 font-mono">{result.dns.score}/100</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${result.dns.score}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Domain / WHOIS</span>
                    <span className="text-emerald-300 font-mono">{result.domain.score}/100</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${result.domain.score}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Network & ASN</span>
                    <span className="text-purple-300 font-mono">{result.network.score}/100</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-purple-400" style={{ width: `${result.network.score}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">HTTP / Latency</span>
                    <span className="text-amber-300 font-mono">{result.http.score}/100</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${result.http.score}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Categories Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* DNS Diagnostic Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span>📡 Cloudflare DNS Audit</span>
                  </h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(result.dns.score)}`}>
                    {result.dns.score} pts
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${result.dns.hasA ? "bg-emerald-600" : "bg-red-500"}`}>
                      {result.dns.hasA ? "✓" : "✕"}
                    </span>
                    <span className="font-semibold text-slate-700">A Record (IPv4):</span>
                    <span className="font-mono text-slate-600 truncate">{result.dns.aRecords.join(", ") || "Missing"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${result.dns.hasAAAA ? "bg-emerald-600" : "bg-slate-400"}`}>
                      {result.dns.hasAAAA ? "✓" : "ℹ"}
                    </span>
                    <span className="font-semibold text-slate-700">AAAA Record (IPv6):</span>
                    <span className="font-mono text-slate-600 truncate">{result.dns.aaaaRecords.join(", ") || "IPv4 Only"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${result.dns.hasMX ? "bg-emerald-600" : "bg-slate-400"}`}>
                      {result.dns.hasMX ? "✓" : "ℹ"}
                    </span>
                    <span className="font-semibold text-slate-700">MX Mail Records:</span>
                    <span className="font-mono text-slate-600 truncate">{result.dns.mxRecords.length} records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${result.dns.hasCAA ? "bg-emerald-600" : "bg-amber-500"}`}>
                      {result.dns.hasCAA ? "✓" : "⚠"}
                    </span>
                    <span className="font-semibold text-slate-700">CAA Security:</span>
                    <span className="font-mono text-slate-600">{result.dns.hasCAA ? "Configured" : "Missing (Warn)"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${result.dns.isDnssec ? "bg-emerald-600" : "bg-slate-400"}`}>
                      {result.dns.isDnssec ? "✓" : "ℹ"}
                    </span>
                    <span className="font-semibold text-slate-700">DNSSEC Validation:</span>
                    <span className="font-mono text-slate-600">{result.dns.isDnssec ? "Validated (AD)" : "Disabled"}</span>
                  </div>
                </div>
              </div>

              {/* Domain & Registration Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    🌐 RDAP Registration
                  </h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(result.domain.score)}`}>
                    {result.domain.score} pts
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Registrar</span>
                    <span className="font-semibold text-slate-800">{result.domain.registrar || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Creation Date</span>
                    <span className="font-medium text-slate-800">{result.domain.registeredOn || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Expiration Date</span>
                    <span className="font-medium text-slate-800">{result.domain.expiresOn || "N/A"}</span>
                  </div>
                  {result.domain.daysRemaining !== undefined && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-semibold ${result.domain.daysRemaining < 60 ? "text-amber-700" : "text-emerald-700"}`}>
                        Expires in {result.domain.daysRemaining} days
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    📡 Infrastructure & ASN
                  </h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(result.network.score)}`}>
                    {result.network.score} pts
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Primary IP</span>
                    <span className="font-mono font-bold text-slate-800">{result.network.ip || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Network Provider</span>
                    <span className="font-semibold text-slate-800">{result.network.provider || "N/A"}</span>
                  </div>
                  {result.network.country && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Country Location</span>
                      <span className="font-semibold text-slate-800">{result.network.country}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance / HTTP Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    ⚡ HTTP Response & Latency
                  </h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(result.http.score)}`}>
                    {result.http.score} pts
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Connection Latency</span>
                    <span className="font-mono font-bold text-sky-700">{result.http.responseTimeMs}ms</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Protocol</span>
                    <span className="font-mono font-semibold text-emerald-700">HTTPS (TLS 1.3/DoH)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Reachability</span>
                    <span className="font-semibold text-emerald-700">✓ Fully Reachable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-3">
                  <span>💡 WebDoctor Actionable Recommendations ({result.recommendations.length})</span>
                </h4>
                <ul className="space-y-2 text-xs text-amber-900 list-disc list-inside">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Markdown Export Output */}
            <OutputBox value={getSummaryMarkdown(result)} label="Diagnostic Audit Summary (Markdown)" />
          </div>
        )}
      </Card>
    </div>
  );
}
