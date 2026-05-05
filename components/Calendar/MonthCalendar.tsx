"use client";

import type { EntryItem } from "@/types";
import { buildMonthGrid, monthLabel } from "@/lib/utils";
import { DayCell } from "@/components/Calendar/DayCell";

export function MonthCalendar({
  monthKey,
  entries,
  totalDelayMinutes,
  onPrevMonth,
  onNextMonth,
  onSelectDay
}: {
  monthKey: string;
  entries: EntryItem[];
  totalDelayMinutes: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dateKey: string) => void;
}) {
  const grid = buildMonthGrid(monthKey);
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{monthLabel(monthKey)}</h1>
          <p className="text-sm text-slate-500">View and update office entries for any month.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {grid.map((cell) => (
          <DayCell
            key={cell.dateKey}
            day={cell.day}
            dateKey={cell.dateKey}
            inMonth={cell.inMonth}
            entry={entryMap.get(cell.dateKey)}
            monthTotalDelayMinutes={totalDelayMinutes}
            onClick={() => onSelectDay(cell.dateKey)}
          />
        ))}
      </div>
    </section>
  );
}
