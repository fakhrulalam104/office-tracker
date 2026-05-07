"use client";

import { useEffect, useState } from "react";
import type { ApprovalItem } from "@/types";
import { PageHeader } from "@/components/pages/PageHeader";

export function ApprovalsPageClient() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<ApprovalItem["type"]>("expense");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");

  async function loadApprovals() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/approvals");
      if (!response.ok) {
        throw new Error("Failed to load approvals.");
      }

      const data = (await response.json()) as { approvals: ApprovalItem[] };
      setApprovals(data.approvals ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load approvals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApprovals();
  }, []);

  async function handleRequestApproval() {
    if (!requestTitle.trim() || !requestDate) {
      setError("Title and date are required.");
      return;
    }

    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: requestType,
        title: requestTitle,
        date: requestDate,
        amount: Number(requestAmount || 0),
        note: requestNote
      })
    });

    if (!response.ok) {
      setError("Could not submit approval request.");
      return;
    }

    setRequestTitle("");
    setRequestDate("");
    setRequestAmount("");
    setRequestNote("");
    await loadApprovals();
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Approvals"
        title="Requests And Status"
        description="Submit leave, expense, and correction requests from one organized page and track their status without crowding the main dashboard."
      />

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-base font-semibold text-slate-950">Request Approval</p>
          <div className="mt-5 space-y-4">
            <select
              value={requestType}
              onChange={(event) => setRequestType(event.target.value as ApprovalItem["type"])}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="expense">Expense reimbursement</option>
              <option value="leave">Leave request</option>
              <option value="correction">Day correction</option>
            </select>
            <input
              value={requestTitle}
              onChange={(event) => setRequestTitle(event.target.value)}
              placeholder="Short request title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="date"
              value={requestDate}
              onChange={(event) => setRequestDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="number"
              value={requestAmount}
              onChange={(event) => setRequestAmount(event.target.value)}
              placeholder="Amount if needed"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <textarea
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              rows={4}
              placeholder="Optional note"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => void handleRequestApproval()}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Submit request
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-950">My Requests</p>
            {loading ? <span className="text-sm text-slate-400">Loading...</span> : null}
          </div>

          <div className="mt-5 space-y-4">
            {approvals.length > 0 ? (
              approvals.map((approval) => (
                <div key={approval.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{approval.title}</p>
                      <p className="text-sm text-slate-500">
                        {approval.date} | {approval.type}
                      </p>
                      {approval.note ? <p className="pt-1 text-sm leading-6 text-slate-600">{approval.note}</p> : null}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">{approval.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                No approval requests yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
