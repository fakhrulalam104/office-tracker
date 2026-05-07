"use client";

import { useEffect, useState } from "react";
import type { ApprovalItem } from "@/types";

export function AdminApprovalsClient() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [error, setError] = useState<string | null>(null);

  async function loadApprovals(nextStatus: typeof status) {
    try {
      const query = nextStatus === "all" ? "" : `?status=${nextStatus}`;
      const response = await fetch(`/api/approvals${query}`);
      if (!response.ok) {
        throw new Error("Failed to load approvals.");
      }

      const data = (await response.json()) as { approvals: ApprovalItem[] };
      setApprovals(data.approvals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load approvals.");
    }
  }

  useEffect(() => {
    void loadApprovals(status);
  }, [status]);

  async function reviewApproval(approvalId: string, nextStatus: "approved" | "rejected") {
    const response = await fetch(`/api/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Failed to update approval.");
      return;
    }

    await loadApprovals(status);
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-950">Approval Queue</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review leave, expense, and correction requests without mixing them into the rest of the dashboard.</p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-4">
        {approvals.length > 0 ? (
          approvals.map((approval) => (
            <div key={approval.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-950">{approval.title}</p>
                  <p className="text-sm text-slate-500">
                    {approval.userName ?? approval.userEmail} | {approval.type} | {approval.date}
                  </p>
                  {approval.note ? <p className="text-sm leading-6 text-slate-600">{approval.note}</p> : null}
                  <p className="text-sm text-slate-400">Status: <span className="font-semibold capitalize text-slate-600">{approval.status}</span></p>
                </div>

                {approval.status === "pending" ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void reviewApproval(approval.id, "approved")}
                      className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void reviewApproval(approval.id, "rejected")}
                      className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">No approvals found for this filter.</div>
        )}
      </div>
    </div>
  );
}
