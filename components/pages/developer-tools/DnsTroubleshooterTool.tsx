"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton } from "./shared";

type RecordType = "ALL" | "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "CAA" | "SRV" | "SOA";

interface DnsRecord {
  type: string;
  name: string;
  ttl: number;
  data: string;
}

interface DiagnosticItem {
  label: string;
  status: "pass" | "warn" | "fail" | "info";
  message: string;
}

const RECORD_TYPES: RecordType[] = ["ALL", "A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA", "SRV", "SOA"];

const TYPE_MAP: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

export function DnsTroubleshooterTool() {
  const [domain, setDomain] = useState("google.com");
  const [recordType, setRecordType] = useState<RecordType>("ALL");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [dnssecValidated, setDnssecValidated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"visual" | "table" | "raw">("visual");

  const cleanDomain = (input: string) => {
    return input.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  };

  async function fetchDnsRecord(name: string, type: string) {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Cloudflare DNS returned HTTP ${res.status}`);
    }
    return await res.json();
  }

  async function runTroubleshooter() {
    const targetDomain = cleanDomain(domain);
    if (!targetDomain) {
      setError("Please enter a valid domain name");
      return;
    }

    setLoading(true);
    setError("");
    setRecords([]);
    setDiagnostics([]);
    setDnssecValidated(null);

    try {
      if (recordType === "ALL") {
        // Run parallel queries for full diagnostic
        const queries = ["A", "AAAA", "MX", "TXT", "NS", "CAA", "CNAME", "SOA"];
        const queryResults = await Promise.allSettled(
          queries.map((type) => fetchDnsRecord(targetDomain, type))
        );

        const allRecords: DnsRecord[] = [];
        let hasA = false;
        let hasAAAA = false;
        let hasMX = false;
        let hasCAA = false;
        let hasNS = false;
        let isDnssec = false;
        let resolved = false;

        queryResults.forEach((result, idx) => {
          const queriedType = queries[idx];
          if (result.status === "fulfilled") {
            const data = result.value;
            if (data.AD) isDnssec = true;
            if (data.Answer && Array.isArray(data.Answer)) {
              if (data.Answer.length > 0) resolved = true;
              data.Answer.forEach((ans: { type: number; name: string; TTL: number; data: string }) => {
                const typeName = TYPE_MAP[ans.type] || queriedType;
                if (typeName === "A") hasA = true;
                if (typeName === "AAAA") hasAAAA = true;
                if (typeName === "MX") hasMX = true;
                if (typeName === "CAA") hasCAA = true;
                if (typeName === "NS") hasNS = true;

                allRecords.push({
                  type: typeName,
                  name: ans.name.replace(/\.$/, ""),
                  ttl: ans.TTL,
                  data: ans.data,
                });
              });
            }
          }
        });

        // Diagnostic evaluations
        const diagList: DiagnosticItem[] = [];

        if (resolved || hasA || hasAAAA) {
          diagList.push({
            label: "Domain Resolution",
            status: "pass",
            message: "Domain resolves successfully via Cloudflare DNS over HTTPS.",
          });
        } else {
          diagList.push({
            label: "Domain Resolution",
            status: "fail",
            message: "Domain failed to resolve. Check if the domain is registered and nameservers are active.",
          });
        }

        if (hasA) {
          diagList.push({
            label: "IPv4 (A Record)",
            status: "pass",
            message: "IPv4 A records are properly configured.",
          });
        } else {
          diagList.push({
            label: "IPv4 (A Record)",
            status: "warn",
            message: "No IPv4 A record detected for this host.",
          });
        }

        if (hasAAAA) {
          diagList.push({
            label: "IPv6 (AAAA Record)",
            status: "pass",
            message: "IPv6 is enabled and AAAA records are present.",
          });
        } else {
          diagList.push({
            label: "IPv6 (AAAA Record)",
            status: "info",
            message: "No IPv6 AAAA record found (IPv4-only hosting).",
          });
        }

        if (hasMX) {
          diagList.push({
            label: "Mail Exchange (MX)",
            status: "pass",
            message: "MX records are configured for email delivery.",
          });
        } else {
          diagList.push({
            label: "Mail Exchange (MX)",
            status: "info",
            message: "No MX records found (domain does not receive mail directly).",
          });
        }

        if (hasCAA) {
          diagList.push({
            label: "Certificate Authority Authorization (CAA)",
            status: "pass",
            message: "CAA record found. Restricts which CAs can issue SSL certificates.",
          });
        } else {
          diagList.push({
            label: "Certificate Authority Authorization (CAA)",
            status: "warn",
            message: "No CAA record found. Any authorized CA can issue certificates for this domain.",
          });
        }

        if (hasNS) {
          diagList.push({
            label: "Authoritative Nameservers (NS)",
            status: "pass",
            message: "Authoritative NS records configured correctly.",
          });
        }

        diagList.push({
          label: "DNSSEC Validation",
          status: isDnssec ? "pass" : "info",
          message: isDnssec
            ? "DNSSEC is enabled and cryptographically validated (AD flag present)."
            : "DNSSEC is not active or not validated for this zone.",
        });

        setRecords(allRecords);
        setDiagnostics(diagList);
        setDnssecValidated(isDnssec);
      } else {
        // Query single record
        const data = await fetchDnsRecord(targetDomain, recordType);
        if (data.Status !== 0) {
          const statusNames: Record<number, string> = {
            1: "Format Error (FORMERR)",
            2: "Server Failure (SERVFAIL)",
            3: "Non-Existent Domain (NXDOMAIN)",
            4: "Not Implemented (NOTIMP)",
            5: "Query Refused (REFUSED)",
          };
          setError(`Cloudflare DNS returned status: ${statusNames[data.Status] || data.Status}`);
          return;
        }

        const isDnssec = Boolean(data.AD);
        setDnssecValidated(isDnssec);

        if (!data.Answer || data.Answer.length === 0) {
          setError(`No ${recordType} records found for ${targetDomain}.`);
          return;
        }

        const parsed = data.Answer.map((ans: { type: number; name: string; TTL: number; data: string }) => ({
          type: TYPE_MAP[ans.type] || recordType,
          name: ans.name.replace(/\.$/, ""),
          ttl: ans.TTL,
          data: ans.data,
        }));
        setRecords(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query Cloudflare DNS-over-HTTPS");
    } finally {
      setLoading(false);
    }
  }

  const rawJson = records.length > 0 ? JSON.stringify({ domain: cleanDomain(domain), records, dnssec: dnssecValidated }, null, 2) : "";

  return (
    <div className="space-y-6">
      <Card title="Cloudflare DNS Troubleshooter">
        <p className="text-sm text-slate-600 mb-5">
          Diagnose DNS records and configuration issues in real-time using Cloudflare&apos;s authenticated DNS-over-HTTPS (DoH) resolver. Inspect A, AAAA, MX, CAA, TXT, NS records and DNSSEC validation status.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Target Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runTroubleshooter()}
                placeholder="e.g. google.com or github.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Query Mode
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as RecordType)}
                aria-label="Query Mode"
                className={inputClass}
              >
                <option value="ALL">🔍 Full Diagnostic Audit (All)</option>
                {RECORD_TYPES.filter((t) => t !== "ALL").map((type) => (
                  <option key={type} value={type}>
                    {type} Record
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Popular:</span>
            {["google.com", "cloudflare.com", "github.com", "vercel.com", "wikipedia.org"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setDomain(preset);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={runTroubleshooter}
              disabled={loading}
              className={buttonClass + " flex items-center gap-2"}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resolving with DoH...
                </>
              ) : (
                "Run DNS Troubleshooter"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setRecords([]);
                setDiagnostics([]);
                setError("");
                setDnssecValidated(null);
              }}
              className={softButtonClass}
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              DNS Query Notice
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {/* Diagnostics Checklist */}
        {diagnostics.length > 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>DNS Health & Configuration Audit</span>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  Cloudflare 1.1.1.1
                </span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {records.length} records returned
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {diagnostics.map((diag, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-3.5 transition ${
                    diag.status === "pass"
                      ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                      : diag.status === "warn"
                      ? "border-amber-200 bg-amber-50/60 text-amber-950"
                      : diag.status === "fail"
                      ? "border-red-200 bg-red-50/60 text-red-950"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {diag.status === "pass" && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                    {diag.status === "warn" && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                        ⚠
                      </span>
                    )}
                    {diag.status === "fail" && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">
                        ✕
                      </span>
                    )}
                    {diag.status === "info" && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-400 text-xs font-bold text-white">
                        ℹ
                      </span>
                    )}
                    <span className="text-sm font-semibold">{diag.label}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-80 pl-7">{diag.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results view tabs */}
        {records.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("visual")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "visual"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Visual Cards
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("table")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "table"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Table View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("raw")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "raw"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              <CopyButton
                value={records.map((r) => `${r.type}\t${r.ttl}\t${r.data}`).join("\n")}
                label="Copy TSV"
              />
            </div>

            {activeTab === "visual" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {records.map((rec, i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                        {rec.type}
                      </span>
                      <span className="text-xs font-mono text-slate-400">TTL: {rec.ttl}s</span>
                    </div>
                    <div className="font-mono text-sm font-medium text-slate-800 break-all select-all">
                      {rec.data}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                      <span className="truncate max-w-[200px]">{rec.name}</span>
                      <CopyButton value={rec.data} label="Copy" className="text-xs text-sky-700 hover:text-sky-900" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "table" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Host / Name</th>
                      <th className="px-4 py-3">TTL</th>
                      <th className="px-4 py-3">Target / Record Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {records.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-bold text-sky-700">{rec.type}</td>
                        <td className="px-4 py-2.5 text-slate-600">{rec.name}</td>
                        <td className="px-4 py-2.5 text-slate-400">{rec.ttl}</td>
                        <td className="px-4 py-2.5 text-slate-900 break-all">{rec.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "raw" && <OutputBox value={rawJson} label="Cloudflare DoH Response" />}
          </div>
        )}
      </Card>
    </div>
  );
}
