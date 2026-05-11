"use client";

import { useEffect, useState } from "react";
import type { EntryItem } from "@/types";
import { buildMonthGrid, defaultDayStatusForDate, monthLabel, normalizeLeaveType, toDateKey } from "@/lib/utils";
import { DayCell } from "@/components/Calendar/DayCell";

export function MonthCalendar({
  monthKey,
  entries,
  totalDelayMinutes,
  weeklyHolidays,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay
}: {
  monthKey: string;
  entries: EntryItem[];
  totalDelayMinutes: number;
  weeklyHolidays: number[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (dateKey: string) => void;
}) {
  const grid = buildMonthGrid(monthKey);
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    setTodayKey(toDateKey(new Date()));
  }, []);

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
            &larr;
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Next month"
          >
            &rarr;
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
          >
            Today
          </button>
        </div>
      </div>

      <div className="hidden grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 hidden grid-cols-7 gap-2 md:grid">
        {grid.map((cell) => (
          <DayCell
            key={cell.dateKey}
            day={cell.day}
            dateKey={cell.dateKey}
            inMonth={cell.inMonth}
            isToday={todayKey === cell.dateKey}
            weeklyHolidays={weeklyHolidays}
            entry={entryMap.get(cell.dateKey)}
            monthTotalDelayMinutes={totalDelayMinutes}
            onClick={() => onSelectDay(cell.dateKey)}
          />
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {grid
          .filter((cell) => cell.inMonth)
          .map((cell) => {
            const entry = entryMap.get(cell.dateKey);
            const status = entry?.dayStatus ?? defaultDayStatusForDate(cell.dateKey, { weeklyHolidays });
            const leaveType = status === "leave" ? normalizeLeaveType(entry?.leaveType) : "regular";

            return (
              <button
                key={`mobile-${cell.dateKey}`}
                type="button"
                onClick={() => onSelectDay(cell.dateKey)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {cell.day} {todayKey === cell.dateKey ? "Today" : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {status === "leave" && leaveType === "adjustment" ? "Adjustment" : status}
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-500">{entry ? "Saved" : "Open"}</span>
              </button>
            );
          })}
      </div>
    </section>
  );
}
