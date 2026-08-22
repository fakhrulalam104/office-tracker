"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass, CopyButton } from "./shared";

type LookupMode = "domain" | "ip" | "asn";

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: any[];
  handle?: string;
  publicIds?: { type: string; identifier: string }[];
}

export function RdapLookupTool() {
  const [mode, setMode] = useState<LookupMode>("domain");
  const [query, setQuery] = useState("example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "nameservers" | "entities" | "raw">("summary");

  const cleanQuery = (input: string, m: LookupMode) => {
    let clean = input.trim();
    if (m === "domain") {
      clean = clean.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
    } else if (m === "asn") {
      clean = clean.replace(/^AS/i, "");
    }
    return clean;
  };

  async function performLookup(customQuery?: string, customMode?: LookupMode) {
    const activeM = customMode || mode;
    const target = cleanQuery(customQuery || query, activeM);

    if (!target) {
      setError("Please enter a query value.");
      return;
    }

    setLoading(true);
    setError("");
    setRawData(null);

    let url = "";
    if (activeM === "domain") {
      url = `https://rdap.org/domain/${encodeURIComponent(target)}`;
    } else if (activeM === "ip") {
      url = `https://rdap.org/ip/${encodeURIComponent(target)}`;
    } else {
      url = `https://rdap.org/autnum/${encodeURIComponent(target)}`;
    }

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/rdap+json, application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`RDAP record not found for "${target}". The domain, IP, or ASN may be unregistered or not available in the public bootstrap registry.`);
        }
        throw new Error(`RDAP server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve RDAP information");
    } finally {
      setLoading(false);
    }
  }

  // Parse events
  const getEventDate = (action: string): string => {
    if (!rawData?.events || !Array.isArray(rawData.events)) return "N/A";
    const evt = rawData.events.find((e: RdapEvent) =>
      e.eventAction?.toLowerCase().includes(action.toLowerCase())
    );
    if (!evt?.eventDate) return "N/A";
    try {
      const date = new Date(evt.eventDate);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return evt.eventDate;
    }
  };

  const getExpirationDays = (): number | null => {
    if (!rawData?.events || !Array.isArray(rawData.events)) return null;
    const evt = rawData.events.find((e: RdapEvent) =>
      e.eventAction?.toLowerCase().includes("expiration")
    );
    if (!evt?.eventDate) return null;
    try {
      const diff = new Date(evt.eventDate).getTime() - Date.now();
      return Math.round(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // Find Registrar
  const getRegistrarName = (): string => {
    if (!rawData?.entities || !Array.isArray(rawData.entities)) return "N/A";
    const registrar = rawData.entities.find((e: RdapEntity) =>
      e.roles?.some((r) => r.toLowerCase() === "registrar")
    );
    if (!registrar) return "N/A";

    if (registrar.vcardArray && Array.isArray(registrar.vcardArray[1])) {
      const fnEntry = registrar.vcardArray[1].find((prop: any[]) => prop[0] === "fn");
      if (fnEntry && fnEntry[3]) return fnEntry[3];
    }
    if (registrar.publicIds && registrar.publicIds[0]?.identifier) {
      return registrar.publicIds[0].identifier;
    }
    return registrar.handle || "Registered Registrar";
  };

  const nameservers: string[] = Array.isArray(rawData?.nameservers)
    ? rawData.nameservers.map((ns: { ldhName?: string; handle?: string }) => ns.ldhName || ns.handle || "").filter(Boolean)
    : [];

  const statuses: string[] = Array.isArray(rawData?.status) ? rawData.status : [];
  const expDays = getExpirationDays();

  const presets = [
    { label: "google.com", value: "google.com", mode: "domain" as const },
    { label: "github.com", value: "github.com", mode: "domain" as const },
    { label: "8.8.8.8 (Google DNS)", value: "8.8.8.8", mode: "ip" as const },
    { label: "1.1.1.1 (Cloudflare)", value: "1.1.1.1", mode: "ip" as const },
    { label: "AS15169 (Google ASN)", value: "15169", mode: "asn" as const },
    { label: "AS13335 (Cloudflare ASN)", value: "13335", mode: "asn" as const },
  ];

  return (
    <div className="space-y-6">
      <Card title="RDAP Registration Diagnostic (Modern WHOIS)">
        <p className="text-sm text-slate-600 mb-5">
          Query the Registration Data Access Protocol (RDAP)—ICANN&apos;s modern, authoritative replacement for legacy WHOIS. Inspect domain registration dates, registrar details, nameservers, status flags, IP network allocations, and ASN ownership.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => {
                setMode("domain");
                setQuery("example.com");
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                mode === "domain" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🌐 Domain Lookup
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("ip");
                setQuery("8.8.8.8");
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                mode === "ip" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📡 IP Address Lookup
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("asn");
                setQuery("15169");
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                mode === "asn" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🏢 ASN (Autonomous System)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                {mode === "domain" ? "Domain Name" : mode === "ip" ? "IP Address" : "Autonomous System Number (ASN)"}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && performLookup()}
                placeholder={
                  mode === "domain" ? "e.g. example.com" : mode === "ip" ? "e.g. 8.8.8.8 or 2606:4700::" : "e.g. 15169 or AS13335"
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => performLookup()}
                disabled={loading}
                className={buttonClass + " w-full flex items-center justify-center gap-2 py-3.5"}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Querying RDAP...
                  </>
                ) : (
                  `Inspect ${mode.toUpperCase()}`
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Quick Try:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMode(preset.mode);
                  setQuery(preset.value);
                  performLookup(preset.value, preset.mode);
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
              RDAP Notice
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{error}</p>
          </div>
        )}

        {rawData && (
          <div className="mt-6 space-y-5">
            {/* Header / Summary Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {mode === "domain" ? "Domain Record" : mode === "ip" ? "Network Block" : "Autonomous System"}
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  {rawData.ldhName || rawData.handle || rawData.name || query}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {expDays !== null && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expDays < 30
                        ? "bg-red-100 text-red-800"
                        : expDays < 90
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {expDays > 0 ? `Expires in ${expDays} days` : `Expired ${Math.abs(expDays)} days ago`}
                  </span>
                )}
                {rawData.port43 && (
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-mono text-slate-700">
                    WHOIS: {rawData.port43}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "summary" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Overview & Timeline
              </button>
              {nameservers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("nameservers")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "nameservers" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Nameservers ({nameservers.length})
                </button>
              )}
              {rawData.entities && rawData.entities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("entities")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "entities" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Entities & Roles ({rawData.entities.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeTab === "raw" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Raw JSON
              </button>
            </div>

            {/* Tab: Summary */}
            {activeTab === "summary" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Registration Details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registration Information
                  </h4>
                  <div className="divide-y divide-slate-100 text-sm">
                    {mode === "domain" && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Registrar</span>
                        <span className="font-semibold text-slate-900 text-right">{getRegistrarName()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Registered On</span>
                      <span className="font-medium text-slate-800">{getEventDate("registration")}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Expires On</span>
                      <span className="font-medium text-slate-800">{getEventDate("expiration")}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Last Changed</span>
                      <span className="font-medium text-slate-800">{getEventDate("last changed")}</span>
                    </div>
                    {rawData.handle && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Registry Handle</span>
                        <span className="font-mono text-xs text-slate-700 break-all">{rawData.handle}</span>
                      </div>
                    )}
                    {rawData.country && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Country</span>
                        <span className="font-semibold text-slate-900">{rawData.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Flags & IP Block */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Registration Status Codes
                    </h4>
                    {statuses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {statuses.map((st, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-700"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No status codes provided.</span>
                    )}
                  </div>

                  {mode === "ip" && (
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">IP Version</span>
                        <span className="font-semibold text-slate-900">{rawData.ipVersion?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start Address</span>
                        <span className="font-mono text-xs text-slate-800">{rawData.startAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">End Address</span>
                        <span className="font-mono text-xs text-slate-800">{rawData.endAddress}</span>
                      </div>
                      {rawData.parentHandle && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Parent Handle</span>
                          <span className="font-mono text-xs text-slate-700">{rawData.parentHandle}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {mode === "asn" && (
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ASN Range</span>
                        <span className="font-mono text-xs text-slate-800">
                          {rawData.startAutnum} - {rawData.endAutnum}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type</span>
                        <span className="font-semibold text-slate-900">{rawData.type || "DIRECT"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Nameservers */}
            {activeTab === "nameservers" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Delegated Nameservers ({nameservers.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {nameservers.map((ns, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="font-mono text-sm font-semibold text-slate-800">{ns}</span>
                      <CopyButton value={ns} label="Copy" className="text-xs text-sky-700 hover:text-sky-900" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Entities */}
            {activeTab === "entities" && (
              <div className="space-y-3">
                {rawData.entities?.map((ent: RdapEntity, i: number) => {
                  let fn = "";
                  let email = "";
                  let org = "";
                  if (ent.vcardArray && Array.isArray(ent.vcardArray[1])) {
                    ent.vcardArray[1].forEach((prop: any[]) => {
                      if (prop[0] === "fn") fn = prop[3];
                      if (prop[0] === "email") email = prop[3];
                      if (prop[0] === "org") org = prop[3];
                    });
                  }

                  return (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex flex-wrap gap-1.5">
                          {ent.roles?.map((r, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 uppercase"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                        {ent.handle && (
                          <span className="font-mono text-xs text-slate-400">Handle: {ent.handle}</span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                        {fn && (
                          <div>
                            <span className="text-xs text-slate-400 block">Name</span>
                            <span className="font-semibold text-slate-800">{fn}</span>
                          </div>
                        )}
                        {org && (
                          <div>
                            <span className="text-xs text-slate-400 block">Organization</span>
                            <span className="font-semibold text-slate-800">{org}</span>
                          </div>
                        )}
                        {email && (
                          <div>
                            <span className="text-xs text-slate-400 block">Email</span>
                            <span className="font-mono text-xs text-slate-700">{email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Raw JSON */}
            {activeTab === "raw" && (
              <OutputBox value={JSON.stringify(rawData, null, 2)} label="Full RDAP JSON Response" />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
