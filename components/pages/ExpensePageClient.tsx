"use client";

import { useEffect, useState } from "react";
import type { EntryItem, MonthlySummary } from "@/types";
import { DEFAULT_USER_SETTINGS, expenseCategoryLabel, monthLabel, monthNavigate, toMonthKey, totalDailyExpenses } from "@/lib/utils";
import { PageHeader } from "@/components/pages/PageHeader";

export function ExpensePageClient() {
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [entriesResponse, summaryResponse] = await Promise.all([fetch(`/api/entries?month=${month}`), fetch(`/api/summary?month=${month}`)]);
      const entriesData = (await entriesResponse.json()) as { entries: EntryItem[] };
      const summaryData = (await summaryResponse.json()) as MonthlySummary;

      if (active) {
        setEntries(entriesData.entries ?? []);
        setSummary(summaryData);
        setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [month]);

  const expenses = entries.flatMap((entry) => entry.dailyExpenses.map((expense) => ({ ...expense, date: entry.date })));
  const currency = summary?.currency ?? DEFAULT_USER_SETTINGS.currency;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Expenses" title="Monthly Expense Summary" description="Track personal money notes separately from office lunch spend." />
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Expense Total</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {(summary?.dailyExpenseTotal ?? 0).toLocaleString("en-US")} {currency}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.dailyExpenseCount ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Lunch Spend</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {(summary?.lunchSpend ?? 0).toLocaleString("en-US")} {currency}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">By Category</p>
          <div className="mt-4 space-y-3">
            {(summary?.expenseCategories ?? []).map((category) => (
              <div key={category.category}>
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>{category.label}</span>
                  <span>
                    {category.total.toLocaleString("en-US")} {currency}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.min(100, (category.total / Math.max(1, summary?.dailyExpenseTotal ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!loading && (summary?.expenseCategories.length ?? 0) === 0 ? <p className="text-sm text-slate-500">No expenses yet.</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Expense Items</p>
          <div className="mt-4 divide-y divide-slate-100">
            {expenses.map((expense) => (
              <div key={`${expense.date}-${expense.id}`} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{expenseCategoryLabel(expense.category)}</p>
                  <p className="text-sm text-slate-500">{expense.date}</p>
                  {expense.note ? <p className="mt-1 text-sm text-slate-600">{expense.note}</p> : null}
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {expense.amount.toLocaleString("en-US")} {currency}
                </p>
              </div>
            ))}
            {!loading && expenses.length === 0 ? <p className="py-8 text-sm text-slate-500">No expense items for this month.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
