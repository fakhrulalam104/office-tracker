"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, OutputBox, buttonClass, softButtonClass, CopyButton } from "./shared";

interface IpInfo {
  ip: string;
  ipType: "IPv4" | "IPv6" | "Unknown";
  ipv4OnlyIp?: string;
  hasIpv6: boolean;
  latencyMs?: number;
  networkOwner?: string;
  asn?: string;
  country?: string;
  cidrRange?: string;
}

interface DiagnosticCheck {
  label: string;
  status: "pass" | "warn" | "fail" | "info";
  detail: string;
}

export function IpDetectorTool() {
  const [ipData, setIpData] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allowlistFormat, setAllowlistFormat] = useState<"plain" | "cidr32" | "cidr24" | "nginx" | "apache" | "ufw" | "aws">("plain");
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);

  const detectIpAndDiagnostics = useCallback(async () => {
    setLoading(true);
    setError("");
    setIpData(null);
    setDiagnostics([]);

    const start = performance.now();
    try {
      // 1. Fetch universal IP (can be IPv4 or IPv6)
      const primaryRes = await fetch("https://api64.ipify.org?format=json");
      const latency = Math.round(performance.now() - start);

      if (!primaryRes.ok) {
        throw new Error(`ipify API returned HTTP ${primaryRes.status}`);
      }

      const primaryJson = await primaryRes.json();
      const detectedIp: string = primaryJson.ip;

      const isV6 = detectedIp.includes(":");
      const ipType: "IPv4" | "IPv6" = isV6 ? "IPv6" : "IPv4";

      // 2. Also check IPv4-specific endpoint if universal gave IPv6
      let ipv4Ip: string | undefined = undefined;
      let hasV6 = isV6;

      try {
        const v4Res = await fetch("https://api.ipify.org?format=json");
        if (v4Res.ok) {
          const v4Json = await v4Res.json();
          ipv4Ip = v4Json.ip;
        }
      } catch {
        // v4 fetch might fail if strict v6-only or blocked
      }

      // 3. Query RDAP for IP owner / ASN if available
      let networkOwner = "Unknown ISP";
      let asn = "";
      let country = "";
      let cidrRange = "";

      try {
        const rdapRes = await fetch(`https://rdap.org/ip/${encodeURIComponent(detectedIp)}`, {
          headers: { Accept: "application/rdap+json, application/json" },
        });
        if (rdapRes.ok) {
          const rdapJson = await rdapRes.json();
          if (rdapJson.name) networkOwner = rdapJson.name;
          if (rdapJson.country) country = rdapJson.country;
          if (rdapJson.startAddress && rdapJson.endAddress) {
            cidrRange = `${rdapJson.startAddress} - ${rdapJson.endAddress}`;
          }

          // Try to extract ASN or entities
          if (rdapJson.entities && Array.isArray(rdapJson.entities)) {
            const org = rdapJson.entities.find((e: any) =>
              e.roles?.some((r: string) => ["registrant", "technical", "abuse", "administrative"].includes(r.toLowerCase()))
            );
            if (org?.vcardArray && Array.isArray(org.vcardArray[1])) {
              const fn = org.vcardArray[1].find((p: any) => p[0] === "fn");
              if (fn && fn[3]) networkOwner = fn[3];
            }
          }
        }
      } catch {
        // RDAP optional fallback
      }

      const info: IpInfo = {
        ip: detectedIp,
        ipType,
        ipv4OnlyIp: ipv4Ip,
        hasIpv6: hasV6,
        latencyMs: latency,
        networkOwner,
        asn,
        country,
        cidrRange,
      };

      setIpData(info);

      // Build diagnostic checks
      const checks: DiagnosticCheck[] = [
        {
          label: "Internet Reachability",
          status: "pass",
          detail: "Your connection is active and successfully communicating with public Internet gateways.",
        },
        {
          label: `Public ${ipType} Detected`,
          status: "pass",
          detail: `Your public facing IP address is ${detectedIp}.`,
        },
        {
          label: "IPv6 Dual-Stack Support",
          status: hasV6 ? "pass" : "info",
          detail: hasV6
            ? "Your connection supports modern IPv6 routing."
            : "Your connection is currently routing through IPv4 (IPv6 not detected).",
        },
        {
          label: "API Gateway Latency",
          status: latency < 300 ? "pass" : latency < 800 ? "warn" : "fail",
          detail: `Round-trip response time to ipify edge was ${latency}ms.`,
        },
      ];

      setDiagnostics(checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect public IP address");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    detectIpAndDiagnostics();
  }, [detectIpAndDiagnostics]);

  const generateAllowlistSnippet = (ip: string, format: string) => {
    switch (format) {
      case "cidr32":
        return `${ip}/32`;
      case "cidr24": {
        const parts = ip.split(".");
        return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : `${ip}/64`;
      }
      case "nginx":
        return `# Nginx IP Allowlist\nallow ${ip};\ndeny all;`;
      case "apache":
        return `# Apache .htaccess / VirtualHost\nRequire ip ${ip}`;
      case "ufw":
        return `sudo ufw allow from ${ip} to any port 22 proto tcp`;
      case "aws":
        return `Type: Custom TCP | Port: 22/443 | Source: ${ip}/32 | Description: My Public IP`;
      default:
        return ip;
    }
  };

  const allowlistSnippet = ipData ? generateAllowlistSnippet(ipData.ip, allowlistFormat) : "";

  return (
    <div className="space-y-6">
      <Card title="Public IP & Network Connection Diagnostic">
        <p className="text-sm text-slate-600 mb-5">
          Detect your public IPv4/IPv6 address, inspect network route diagnostics, measure round-trip gateway latency, and generate firewall allowlist rules for Nginx, Apache, AWS Security Groups, and UFW.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={detectIpAndDiagnostics}
            disabled={loading}
            className={buttonClass + " flex items-center gap-2"}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Detecting IP...
              </>
            ) : (
              "🔄 Re-detect Public IP"
            )}
          </button>
          {ipData && (
            <CopyButton value={ipData.ip} label="Copy IP Address" className={softButtonClass} />
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Detection Error
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {ipData && (
          <div className="mt-6 space-y-6">
            {/* Big IP Display Banner */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 p-6 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                  Your Public IP Address
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-sm">
                  {ipData.ipType} • {ipData.latencyMs}ms latency
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl select-all">
                  {ipData.ip}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                {ipData.networkOwner && (
                  <div>
                    <span className="text-slate-400">ISP / Network: </span>
                    <span className="font-semibold text-white">{ipData.networkOwner}</span>
                  </div>
                )}
                {ipData.country && (
                  <div>
                    <span className="text-slate-400">Country: </span>
                    <span className="font-semibold text-white">{ipData.country}</span>
                  </div>
                )}
                {ipData.ipv4OnlyIp && ipData.ipType === "IPv6" && (
                  <div>
                    <span className="text-slate-400">IPv4 Fallback: </span>
                    <span className="font-mono font-semibold text-white">{ipData.ipv4OnlyIp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Scorecard */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Connection Diagnostics Scorecard
              </h3>
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
                    <p className="mt-1 text-xs leading-relaxed opacity-80 pl-7">{diag.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Firewall & Allowlist Rule Generator */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  Firewall & IP Allowlist Generator
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "plain", label: "IP Only" },
                      { id: "cidr32", label: "/32 CIDR" },
                      { id: "cidr24", label: "/24 Subnet" },
                      { id: "nginx", label: "Nginx" },
                      { id: "apache", label: "Apache" },
                      { id: "ufw", label: "UFW" },
                      { id: "aws", label: "AWS Security Group" },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setAllowlistFormat(fmt.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        allowlistFormat === fmt.id
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <OutputBox value={allowlistSnippet} label={`${allowlistFormat.toUpperCase()} Configuration Rule`} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
