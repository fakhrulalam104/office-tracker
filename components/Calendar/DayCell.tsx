"use client";

import { dayStatusLabel, defaultDayStatusForDate, getHolidayForDate, normalizeDayStatus, normalizeLeaveType } from "@/lib/utils";
import type { EntryItem } from "@/types";

function CateringIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 17h14M7 17a5 5 0 0 1 10 0M12 9v-2M10 7h4M4 20h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function DayCell({
  day,
  dateKey,
  inMonth,
  isToday,
  weeklyHolidays,
  entry,
  monthTotalDelayMinutes,
  onClick
}: {
  day: number;
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
  weeklyHolidays: number[];
  entry?: EntryItem;
  monthTotalDelayMinutes: number;
  onClick: () => void;
}) {
  const dayStatus = entry ? normalizeDayStatus(entry.dayStatus) : defaultDayStatusForDate(dateKey, { weeklyHolidays });
  const leaveType = dayStatus === "leave" ? normalizeLeaveType(entry?.leaveType) : "regular";
  const holiday = getHolidayForDate(dateKey);
  const delayMinutes = dayStatus === "work" ? entry?.delayMinutes ?? 0 : 0;
  const hadLunch = dayStatus === "work" ? entry?.hadLunch ?? false : false;
  const hasDelay = delayMinutes > 0;
  const warningTone = monthTotalDelayMinutes >= 130 && dayStatus === "work" && Boolean(entry) && !hasDelay;

  const cellClass = warningTone
    ? "border-red-200 bg-red-50/80"
    : dayStatus === "holiday"
      ? "border-emerald-200 bg-emerald-50/80"
      : dayStatus === "sick"
        ? "border-violet-200 bg-violet-50/80"
        : dayStatus === "leave"
          ? "border-slate-200 bg-slate-100/90"
          : hasDelay
            ? "border-amber-200 bg-amber-50/80"
            : entry
              ? "border-indigo-200 bg-indigo-50/80"
              : "border-slate-200 bg-white";

  const dotClass =
    dayStatus === "holiday"
      ? "bg-emerald-500"
      : dayStatus === "sick"
        ? "bg-violet-500"
          : dayStatus === "leave"
            ? "bg-slate-500"
            : hasDelay
              ? "bg-amber-500"
              : hadLunch
                ? "bg-sky-500"
                : "bg-indigo-500";

  const badgeClass =
    dayStatus === "holiday"
      ? "bg-emerald-100 text-emerald-700"
      : dayStatus === "sick"
        ? "bg-violet-100 text-violet-700"
        : dayStatus === "leave"
          ? "bg-slate-200 text-slate-700"
          : warningTone
            ? "bg-red-100 text-red-700"
              : "bg-indigo-100 text-indigo-700";

  const todayClass = isToday ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-50" : "";
  const todayLabelClass = isToday ? "text-sky-700" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[110px] rounded-2xl border p-3 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md ${cellClass} ${todayClass} ${inMonth ? "" : "opacity-40"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-sm font-semibold ${
            isToday
              ? "rounded-full bg-sky-600 px-2 py-0.5 text-white shadow-sm"
              : inMonth
                ? "text-slate-900"
                : "text-slate-400"
          }`}
        >
          {day}
        </span>
        <span className="flex items-center gap-1">
          {hadLunch ? (
            <span
              className="grid h-7 w-7 place-items-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-sm"
              aria-label="Meal marked"
            >
              <CateringIcon />
            </span>
          ) : null}
          {entry ? <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden="true" /> : null}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        {isToday ? <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${todayLabelClass}`}>Today</p> : null}
        {holiday && dayStatus === "holiday" ? (
          <p className="line-clamp-2 text-xs font-medium leading-4 text-emerald-700">{holiday.name}</p>
        ) : dayStatus === "leave" && leaveType === "adjustment" ? (
          <p className="text-xs font-medium text-slate-700">Adjustment leave</p>
        ) : dayStatus !== "work" ? (
          <p className="text-xs font-medium text-slate-700">{dayStatusLabel(dayStatus)}</p>
        ) : holiday ? (
          <p className="line-clamp-2 text-xs font-medium leading-4 text-indigo-700">Working: {holiday.name}</p>
        ) : null}
      </div>

      {entry ? (
        <div className="absolute bottom-3 right-3 flex gap-1">
          {dayStatus !== "work" ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
              {dayStatus === "leave" && leaveType === "adjustment" ? "Adjustment" : dayStatusLabel(dayStatus)}
            </span>
          ) : null}
          {dayStatus === "work" && !delayMinutes ? (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Work</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
