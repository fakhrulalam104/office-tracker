"use client";

import { useEffect, useState } from "react";
import { getFineState, MONTH_DELAY_LIMIT } from "@/lib/utils";

function StatPill({
  label,
  value,
  tone
}: {
  label: string;
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
    <div className={`rounded-2xl border px-3 py-3 text-center ${toneClasses}`}>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em]">{label}</div>
    </div>
  );
}

export function MonthlySummary({
  monthLabel,
  totalDelayMinutes,
  lunchDays,
  lunchSpend,
  holidayDays,
  sickDays,
  leaveDays,
  loading
}: {
  monthLabel: string;
  totalDelayMinutes: number;
  lunchDays: number;
  lunchSpend: number;
  holidayDays: number;
  sickDays: number;
  leaveDays: number;
  loading: boolean;
}) {
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const width = Math.min(100, Math.round((totalDelayMinutes / MONTH_DELAY_LIMIT) * 100));
    const id = window.requestAnimationFrame(() => setProgressWidth(width));
    return () => window.cancelAnimationFrame(id);
  }, [totalDelayMinutes]);

  const status = getFineState(totalDelayMinutes);
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
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{monthLabel}</h2>
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
                <p className="text-sm text-slate-500">/ {MONTH_DELAY_LIMIT} minutes</p>
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
            <p className="mt-2 text-2xl font-semibold text-slate-900">{lunchSpend} BDT</p>
            <p className="text-sm text-slate-500">
              {lunchDays} day{lunchDays === 1 ? "" : "s"} x 90 BDT
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Time Off</p>
            <p className="mt-1 text-sm text-slate-500">Holiday, sick, and other leave days are excluded from delay totals.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatPill label="Holiday" value={holidayDays} tone="emerald" />
              <StatPill label="Sick" value={sickDays} tone="violet" />
              <StatPill label="Other leave" value={leaveDays} tone="slate" />
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
