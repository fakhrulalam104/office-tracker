"use client";

import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass, softButtonClass } from "./shared";

type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

interface DnsResult {
  type: string;
  name: string;
  ttl: number;
  data: string;
}

const RECORD_TYPES: RecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

export function DnsLookupTool() {
  const [domain, setDomain] = useState("example.com");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [results, setResults] = useState<DnsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookupDns() {
    setLoading(true);
    setError("");
    setResults([]);
    
    try {
      // Using Google's DNS-over-HTTPS API
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`
      );
      const data = await response.json();
      
      if (data.Status !== 0) {
        setError(`DNS lookup failed with status: ${data.Status}`);
        return;
      }
      
      if (!data.Answer || data.Answer.length === 0) {
        setError("No records found for this query.");
        return;
      }
      
      setResults(data.Answer.map((r: DnsResult) => ({
        type: RECORD_TYPES[r.type - 1] || `Type ${r.type}`,
        name: r.name,
        ttl: r.TTL,
        data: r.data,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to perform DNS lookup");
    } finally {
      setLoading(false);
    }
  }

  const output = results.length > 0
    ? results.map((r) => `${r.type}\t${r.ttl}\t${r.data}`).join("\n")
    : "";

  return (
    <div className="space-y-5">
      <Card title="DNS Lookup Tool">
        <p className="text-sm text-slate-600 mb-4">
          Query A, AAAA, CNAME, MX, TXT, NS records for any domain. Useful for verifying DNS configuration during launches and migrations.
        </p>
        
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={inputClass}
                placeholder="example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Record Type</label>
              <div className="flex flex-wrap gap-2">
                {RECORD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecordType(type)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
                      recordType === type ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={lookupDns} disabled={loading} className={buttonClass}>
              {loading ? "Looking up..." : "Lookup DNS"}
            </button>
            <button type="button" onClick={() => { setResults([]); setError(""); }} className={softButtonClass}>
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Results ({results.length} records)</h3>
            <div className="space-y-2">
              {results.map((result, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded">{result.type}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-slate-800 break-all">{result.data}</div>
                    <div className="text-xs text-slate-400 mt-1">TTL: {result.ttl}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {output && <OutputBox value={output} label="Raw DNS Output" />}
    </div>
  );
}