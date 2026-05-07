"use client";

import { useState } from "react";
import { monthLabel, monthNavigate, toMonthKey } from "@/lib/utils";
import { PageHeader } from "@/components/pages/PageHeader";

export function ReportsPageClient() {
  const [month, setMonth] = useState(toMonthKey(new Date()));

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
    </div>
  );
}
