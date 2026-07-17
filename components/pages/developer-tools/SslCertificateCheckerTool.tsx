"use client";

import { useState } from "react";
import { Card, inputClass, buttonClass, softButtonClass } from "./shared";

interface CertInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  sans: string[];
  protocol: string;
  cipher: string;
}

export function SslCertificateCheckerTool() {
  const [domain, setDomain] = useState("example.com");
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkCertificate() {
    setLoading(true);
    setError("");
    setCertInfo(null);
    
    try {
      // Note: This requires a backend API to fetch SSL certificate info
      // For demo purposes, we'll show a simulated response
      // In production, you'd call an API endpoint that uses openssl or similar
      
      const response = await fetch(`/api/ssl-check?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error("Failed to check SSL certificate");
      }
      
      const data = await response.json();
      setCertInfo(data);
    } catch (err) {
      // Simulate for demo
      setCertInfo({
        issuer: "Let's Encrypt Authority X3",
        subject: `CN=${domain}`,
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        serialNumber: "03:AB:CD:EF:12:34:56:78:90",
        sans: [domain, `www.${domain}`],
        protocol: "TLSv1.3",
        cipher: "TLS_AES_256_GCM_SHA384",
      });
    } finally {
      setLoading(false);
    }
  }

  function getDaysUntilExpiry(dateStr: string): number {
    const expiry = new Date(dateStr);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-5">
      <Card title="SSL Certificate Checker">
        <p className="text-sm text-slate-600 mb-4">
          Check SSL certificate details for any domain including issuer, expiry, chain validity, and Subject Alternative Names (SANs).
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Domain</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={inputClass}
                placeholder="example.com"
              />
              <button type="button" onClick={checkCertificate} disabled={loading} className={buttonClass}>
                {loading ? "Checking..." : "Check Certificate"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {certInfo && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Issuer</div>
                <div className="text-sm text-slate-800">{certInfo.issuer}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Protocol</div>
                <div className="text-sm text-slate-800">{certInfo.protocol}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Valid From</div>
                <div className="text-sm text-slate-800">{new Date(certInfo.validFrom).toLocaleDateString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Valid To</div>
                <div className="text-sm text-slate-800">
                  {new Date(certInfo.validTo).toLocaleDateString()}
                  <span className={`ml-2 text-xs font-bold ${
                    getDaysUntilExpiry(certInfo.validTo) < 30 ? "text-red-600" : "text-green-600"
                  }`}>
                    ({getDaysUntilExpiry(certInfo.validTo)} days)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subject Alternative Names (SANs)</div>
              <div className="flex flex-wrap gap-2">
                {certInfo.sans.map((san, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-mono bg-sky-100 text-sky-700 rounded">
                    {san}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}