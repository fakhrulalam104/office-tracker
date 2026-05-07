"use client";

import { useEffect, useState } from "react";
import type { AuditItem } from "@/types";

export function AdminAuditClient() {
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudit() {
      try {
        const response = await fetch("/api/audit?limit=80");
        if (!response.ok) {
          throw new Error("Failed to load audit log.");
        }

        const data = (await response.json()) as { audit: AuditItem[] };
        setAudit(data.audit);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load audit log.");
      }
    }

    void loadAudit();
  }, []);

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      {audit.length > 0 ? (
        audit.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-950">{item.action}</p>
                <p className="text-sm text-slate-500">
                  {item.userName ?? item.userEmail} | {item.entityType} | {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.entityId || "n/a"}</span>
            </div>

            {Object.keys(item.details ?? {}).length > 0 ? (
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs text-slate-100">
                {JSON.stringify(item.details, null, 2)}
              </pre>
            ) : null}
          </div>
        ))
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">No audit events yet.</div>
      )}
    </div>
  );
}
