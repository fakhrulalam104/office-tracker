"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntryItem, MonthlySummary, UserSettings } from "@/types";
import {
  DEFAULT_USER_SETTINGS,
  buildMonthGrid,
  dayStatusLabel,
  defaultDayStatusForDate,
  formatDateLabel,
  monthLabel,
  monthNavigate,
  normalizeDailyExpenses,
  normalizeDayStatus,
  normalizeLeaveType,
  toMonthKey,
  totalDailyExpenses
} from "@/lib/utils";
import { PageHeader } from "@/components/pages/PageHeader";

export function ReportsPageClient() {
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        const [entriesResponse, summaryResponse, settingsResponse] = await Promise.all([
          fetch(`/api/entries?month=${month}`),
          fetch(`/api/summary?month=${month}`),
          fetch("/api/settings")
        ]);

        if (!entriesResponse.ok || !summaryResponse.ok || !settingsResponse.ok) {
          throw new Error("Could not load the monthly report.");
        }

        const entriesData = (await entriesResponse.json()) as { entries: EntryItem[] };
        const summaryData = (await summaryResponse.json()) as MonthlySummary;
        const settingsData = (await settingsResponse.json()) as { settings: UserSettings };

        if (!active) {
          return;
        }

        setEntries(entriesData.entries ?? []);
        setSummary(summaryData);
        setSettings(settingsData.settings ?? DEFAULT_USER_SETTINGS);
      } catch (reportError) {
        if (active) {
          setError(reportError instanceof Error ? reportError.message : "Could not load the monthly report.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [month]);

  const rows = useMemo(() => {
    const entryMap = new Map(entries.map((entry) => [entry.date, entry]));

    return buildMonthGrid(month)
      .filter((cell) => cell.inMonth)
      .map((cell) => {
        const entry = entryMap.get(cell.dateKey);
        const dayStatus = normalizeDayStatus(entry?.dayStatus ?? defaultDayStatusForDate(cell.dateKey, settings));
        const leaveType = normalizeLeaveType(entry?.leaveType);
        const dailyExpenses = normalizeDailyExpenses(entry?.dailyExpenses);
        const expenseTotal = totalDailyExpenses(dailyExpenses);

        return {
          date: cell.dateKey,
          label: formatDateLabel(cell.dateKey),
          status: dayStatus === "leave" && leaveType === "adjustment" ? "Adjustment leave" : dayStatusLabel(dayStatus),
          delayMinutes: dayStatus === "work" ? entry?.delayMinutes ?? 0 : 0,
          hadLunch: dayStatus === "work" ? Boolean(entry?.hadLunch) : false,
          expenseTotal,
          comment: entry?.comment ?? "",
          saved: Boolean(entry)
        };
      });
  }, [entries, month, settings]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Reports" title="Monthly Export" description="Download the selected month as a CSV file with day status, delay, lunch, expenses, and comments." />
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" onClick={() => setMonth(monthNavigate(month, -1))}>
            &larr;
          </button>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{monthLabel(month)}</span>
          <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" onClick={() => setMonth(monthNavigate(month, 1))}>
            &rarr;
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-950">Export CSV</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          CSV opens cleanly in Excel or Google Sheets and keeps daily expenses separate from lunch spend.
        </p>
        <a
          href={`/api/export?month=${month}`}
          className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Download {monthLabel(month)}
        </a>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <p className="text-lg font-semibold text-slate-950">Monthly Attendance Table</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Scan every day in the selected month before exporting or sharing the report.</p>
          </div>
          {summary ? (
            <div className="grid grid-cols-2 gap-2 text-right text-sm sm:grid-cols-4">
              <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-indigo-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Work</p>
                <p className="text-lg font-semibold">{summary.workDays}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Delay</p>
                <p className="text-lg font-semibold">{summary.totalDelayMinutes}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 px-3 py-2 text-sky-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Lunch</p>
                <p className="text-lg font-semibold">{summary.lunchDays}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Leave</p>
                <p className="text-lg font-semibold">{summary.leaveDays + summary.sickDays}</p>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="m-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Delay</th>
                <th className="px-6 py-3">Lunch</th>
                <th className="px-6 py-3">Expenses</th>
                <th className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-6 py-4" colSpan={6}>
                      <div className="h-5 rounded-full bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : (
                rows.map((row) => (
                  <tr key={row.date} className={row.saved ? "bg-white" : "bg-slate-50/60"}>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">{row.label}</td>
                    <td className="px-6 py-4 text-slate-700">{row.status}</td>
                    <td className={`px-6 py-4 font-semibold ${row.delayMinutes > 0 ? "text-amber-700" : "text-slate-500"}`}>{row.delayMinutes} min</td>
                    <td className="px-6 py-4 text-slate-700">{row.hadLunch ? "Yes" : "No"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {row.expenseTotal.toLocaleString("en-US")} {summary?.currency ?? settings.currency}
                    </td>
                    <td className="max-w-[260px] px-6 py-4 text-slate-500">{row.comment || (row.saved ? "-" : "No saved entry")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
