"use client";

import { useEffect, useState } from "react";
import type { MonthlySummary } from "@/types";
import { monthLabel, monthNavigate, toMonthKey } from "@/lib/utils";
import { PageHeader } from "@/components/pages/PageHeader";

export function InsightsPageClient() {
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const [summary, setSummary] = useState<MonthlySummary | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch(`/api/summary?month=${month}`);
      const data = (await response.json()) as MonthlySummary;
      if (active) {
        setSummary(data);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [month]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Insights" title="Monthly Patterns" description="A compact readout of delays, attendance status, lunch spend, and expense behavior." />
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

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Delay", `${summary?.totalDelayMinutes ?? 0} min`],
          ["Work Days", summary?.workDays ?? 0],
          ["Lunch", `${summary?.lunchSpend ?? 0} ${summary?.currency ?? "BDT"}`],
          ["Expenses", `${summary?.dailyExpenseTotal ?? 0} ${summary?.currency ?? "BDT"}`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Smart Notes</p>
          <div className="mt-4 space-y-3">
            {(summary?.insights ?? []).map((insight) => (
              <p key={insight} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {insight}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Delay Chart</p>
          <div className="mt-5 space-y-4">
            {(summary?.weeklyDelayMinutes ?? []).map((week) => (
              <div key={week.label}>
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>{week.label}</span>
                  <span>{week.minutes} min</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-sky-500"
                    style={{ width: `${Math.min(100, (week.minutes / Math.max(1, summary?.delayLimit ?? 150)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
