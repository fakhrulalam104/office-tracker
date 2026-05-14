"use client";

import { useEffect, useState } from "react";
import { getFineStateForLimit } from "@/lib/utils";

function StatPill({
  label,
  shortLabel,
  value,
  tone
}: {
  label: string;
  shortLabel?: string;
  value: number;
  tone: "emerald" | "violet" | "slate";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "violet"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <div className={`min-w-0 rounded-2xl border px-2 py-3 text-center ${toneClasses}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="mt-1 break-words text-[10px] font-medium uppercase leading-3 tracking-[0.08em]" title={label}>
        {shortLabel ?? label}
      </div>
    </div>
  );
}

export function MonthlySummary({
  totalDelayMinutes,
  lunchDays,
  lunchSpend,
  holidayDays,
  sickDays,
  leaveDays,
  adjustmentLeaveDays,
  annualLeaveAllowanceDays,
  annualLeaveUsedDays,
  annualLeaveRemainingDays,
  delayLimit,
  lunchPrice,
  currency,
  loading
}: {
  totalDelayMinutes: number;
  lunchDays: number;
  lunchSpend: number;
  holidayDays: number;
  sickDays: number;
  leaveDays: number;
  adjustmentLeaveDays: number;
  annualLeaveAllowanceDays: number;
  annualLeaveUsedDays: number;
  annualLeaveRemainingDays: number;
  delayLimit: number;
  lunchPrice: number;
  currency: string;
  loading: boolean;
}) {
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const width = Math.min(100, Math.round((totalDelayMinutes / delayLimit) * 100));
    const id = window.requestAnimationFrame(() => setProgressWidth(width));
    return () => window.cancelAnimationFrame(id);
  }, [delayLimit, totalDelayMinutes]);

  const status = getFineStateForLimit(totalDelayMinutes, delayLimit);
  const progressClass =
    status.tone === "danger"
      ? "bg-red-500"
      : status.tone === "warning"
        ? "bg-amber-500"
        : status.tone === "caution"
          ? "bg-yellow-500"
          : "bg-emerald-500";

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Monthly Summary</p>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Total Delay</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{totalDelayMinutes}</p>
                <p className="text-sm text-slate-500">/ {delayLimit} minutes</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${progressClass} text-white`}>{status.label}</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-slate-200">
              <div
                className={`h-3 rounded-full transition-[width] duration-700 ease-out ${progressClass}`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Lunch Spend</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {lunchSpend.toLocaleString("en-US")} {currency}
            </p>
            <p className="text-sm text-slate-500">
              {lunchDays} day{lunchDays === 1 ? "" : "s"} x {lunchPrice} {currency}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Time Off</p>
            <p className="mt-1 text-sm text-slate-500">Monthly holiday, sick, and other leave days are excluded from delay totals.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatPill label="Holiday" value={holidayDays} tone="emerald" />
              <StatPill label="Sick" value={sickDays} tone="violet" />
              <StatPill label="Other leave" shortLabel="Other" value={leaveDays} tone="slate" />
              <StatPill label="Adjustment leave" shortLabel="Adjust" value={adjustmentLeaveDays} tone="slate" />
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-950">Annual leave balance</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-700">Sick + regular leave only. Holidays, worked holidays, and adjustment leave are not counted.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-indigo-950">{annualLeaveRemainingDays}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Left</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, Math.round((annualLeaveUsedDays / Math.max(1, annualLeaveAllowanceDays)) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-indigo-700">
                {annualLeaveUsedDays} used of {annualLeaveAllowanceDays} days this year
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Fine Status</p>
            <p
              className={`mt-2 text-sm font-medium ${
                status.tone === "danger"
                  ? "text-red-700"
                  : status.tone === "warning"
                    ? "text-amber-700"
                    : status.tone === "caution"
                      ? "text-yellow-700"
                      : "text-emerald-700"
              }`}
            >
              {status.label}
            </p>
            <p className="mt-1 text-sm text-slate-500">{status.description}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
