"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMMENT_MAX_LENGTH,
  DAILY_EXPENSE_NOTE_MAX_LENGTH,
  EXPENSE_CATEGORIES,
  clamp,
  dayStatusLabel,
  defaultDayStatusForDate,
  expenseCategoryLabel,
  formatDateLabel,
  getHolidayForDate,
  normalizeDailyExpenseNote,
  normalizeDailyExpenses,
  normalizeDayStatus,
  totalDailyExpenses
} from "@/lib/utils";
import type { DailyExpenseItem, DayStatus, EntryItem, ExpenseCategory, LeaveType } from "@/types";
import type { ExpenseCategoryOption } from "@/types";

const presets = [0, 10, 20, 30, 45, 60, 90];
const statusOrder: DayStatus[] = ["work", "holiday", "sick", "leave"];

function createExpenseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function DayModal({
  open,
  dateKey,
  entry,
  weeklyHolidays,
  lunchPrice,
  currency,
  expenseCategories = EXPENSE_CATEGORIES,
  saving,
  onClose,
  onSave,
  onDelete
}: {
  open: boolean;
  dateKey: string | null;
  entry?: EntryItem;
  weeklyHolidays: number[];
  lunchPrice: number;
  currency: string;
  expenseCategories?: ExpenseCategoryOption[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: {
    delayMinutes: number;
    hadLunch: boolean;
    dayStatus: DayStatus;
    leaveType: LeaveType;
    comment: string;
    dailyExpenses: DailyExpenseItem[];
  }) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [customMinutes, setCustomMinutes] = useState("");
  const [hadLunch, setHadLunch] = useState(false);
  const [dayStatus, setDayStatus] = useState<DayStatus>("work");
  const [leaveType, setLeaveType] = useState<LeaveType>("regular");
  const [comment, setComment] = useState("");
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenseItem[]>([]);
  const [expenseDraftAmount, setExpenseDraftAmount] = useState("");
  const [expenseDraftCategory, setExpenseDraftCategory] = useState<ExpenseCategory>("transport");
  const [expenseDraftNote, setExpenseDraftNote] = useState("");

  useEffect(() => {
    setMounted(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentStatus = entry ? normalizeDayStatus(entry.dayStatus) : dateKey ? defaultDayStatusForDate(dateKey, { weeklyHolidays }) : "work";
    const currentMinutes = currentStatus === "work" ? entry?.delayMinutes ?? 0 : 0;
    const matchedPreset = presets.includes(currentMinutes) ? currentMinutes : null;

    setDayStatus(currentStatus);
    setLeaveType(currentStatus === "leave" ? entry?.leaveType ?? "regular" : "regular");
    setSelectedPreset(matchedPreset);
    setCustomMinutes(matchedPreset === null && currentMinutes > 0 ? String(currentMinutes) : "");
    setHadLunch(currentStatus === "work" ? Boolean(entry?.hadLunch) : false);
    setComment(currentStatus !== "work" ? entry?.comment ?? "" : "");
    setDailyExpenses(normalizeDailyExpenses(entry?.dailyExpenses));
    setExpenseDraftAmount("");
    setExpenseDraftCategory(expenseCategories[0]?.value ?? "other");
    setExpenseDraftNote("");
  }, [dateKey, entry, expenseCategories, open, weeklyHolidays]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  const dateTitle = useMemo(() => (dateKey ? formatDateLabel(dateKey) : "Select a day"), [dateKey]);
  const detectedHoliday = useMemo(() => (dateKey ? getHolidayForDate(dateKey) : null), [dateKey]);
  const isWorkDay = dayStatus === "work";
  const activeMinutes = customMinutes !== "" ? clamp(Number(customMinutes || 0), 0, 480) : selectedPreset ?? 0;
  const draftExpenseAmount = clamp(Number(expenseDraftAmount || 0), 0, 1_000_000);
  const draftExpenseNote = normalizeDailyExpenseNote(expenseDraftNote);
  const hasDraftExpense = draftExpenseAmount > 0 || Boolean(draftExpenseNote);
  const activeDailyExpense = totalDailyExpenses(dailyExpenses) + (hasDraftExpense ? draftExpenseAmount : 0);

  function addExpenseItem() {
    if (!hasDraftExpense) {
      return;
    }

    setDailyExpenses((current) => [...current, { id: createExpenseId(), amount: draftExpenseAmount, category: expenseDraftCategory, note: draftExpenseNote }]);
    setExpenseDraftAmount("");
    setExpenseDraftCategory(expenseCategories[0]?.value ?? "other");
    setExpenseDraftNote("");
  }

  function removeExpenseItem(id: string) {
    setDailyExpenses((current) => current.filter((expense) => expense.id !== id));
  }

  if (!open) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition ${mounted ? "opacity-100" : "opacity-0"}`}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div
        className={`relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-soft transition duration-150 ease-out sm:p-8 ${
          mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Day Details</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{dateTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Day type</p>
              <p className="mt-1 text-sm text-slate-500">Pick the status that best matches this day.</p>
              {detectedHoliday ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold">Holiday details</p>
                  <p className="mt-1">{detectedHoliday.name}</p>
                  <p className="mt-1 text-xs text-emerald-700">Choose Work and save if you have to work that day.</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {statusOrder.map((value) => {
                  const active = dayStatus === value;
                  const activeClass =
                    value === "work"
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                      : value === "holiday"
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : value === "sick"
                          ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                          : "border-slate-700 bg-slate-700 text-white shadow-sm";

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDayStatus(value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        active ? activeClass : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block">{dayStatusLabel(value)}</span>
                      <span className={`mt-1 block text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                        {value === "work"
                          ? "Regular office day"
                          : value === "holiday"
                            ? "Public or company holiday"
                            : value === "sick"
                              ? "Sick leave"
                              : "Leave for other reason"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isWorkDay ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Late arrival delay</p>
                  <p className="mt-1 text-sm text-slate-500">Pick a preset or enter a custom value.</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {presets.map((minute) => {
                      const active = customMinutes === "" && selectedPreset === minute;
                      return (
                        <button
                          key={minute}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(minute);
                            setCustomMinutes("");
                          }}
                          className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                            active
                              ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                          }`}
                        >
                          {minute}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-5 block">
                    <span className="text-sm font-medium text-slate-700">Custom minutes</span>
                    <input
                      type="number"
                      min={0}
                      max={480}
                      placeholder="Enter minutes"
                      value={customMinutes}
                      onChange={(event) => {
                        setCustomMinutes(event.target.value);
                        setSelectedPreset(null);
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Lunch</p>
                  <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={hadLunch}
                      onChange={(event) => setHadLunch(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Had office lunch today? (+{lunchPrice} {currency})
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {lunchPrice} {currency} will be added to your monthly spend.
                      </p>
                    </div>
                  </label>

                  <div className="mt-6 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    Selected delay: <span className="font-semibold">{activeMinutes} min</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-semibold">{dayStatusLabel(dayStatus)} selected</p>
                <p>Delay and lunch are disabled for time off days and will be cleared when you save.</p>
                {dayStatus === "leave" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 text-slate-700">
                    <p className="text-sm font-medium text-slate-800">Leave type</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        { value: "regular" as const, label: "Regular leave", helper: "Counts against the 18-day yearly leave balance." },
                        { value: "adjustment" as const, label: "Adjustment leave", helper: "Does not count against yearly leave balance." }
                      ].map((option) => {
                        const active = leaveType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setLeaveType(option.value)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                              active ? "border-indigo-500 bg-indigo-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <span className="block text-sm font-semibold">{option.label}</span>
                            <span className={`mt-1 block text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{option.helper}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <label className="block rounded-2xl border border-emerald-200 bg-white/80 p-4 text-slate-700">
                  <span className="block text-sm font-medium text-slate-800">Comment for time off</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={COMMENT_MAX_LENGTH}
                    rows={4}
                    placeholder="Add a note about this leave day"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="mt-2 block text-xs text-slate-500">
                    Optional. This helps explain why the day was marked as holiday, sick, or leave.
                  </span>
                </label>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Expenses</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">Daily expense list</h3>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{currency}</div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-200">Amount</span>
              <input
                type="number"
                min={0}
                max={1000000}
                step={1}
                placeholder="0"
                value={expenseDraftAmount}
                onChange={(event) => setExpenseDraftAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/30"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-200">Category</span>
              <select
                value={expenseDraftCategory}
                onChange={(event) => setExpenseDraftCategory(event.target.value as ExpenseCategory)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/30"
              >
                {expenseCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-200">Note</span>
              <textarea
                value={expenseDraftNote}
                onChange={(event) => setExpenseDraftNote(event.target.value)}
                maxLength={DAILY_EXPENSE_NOTE_MAX_LENGTH}
                rows={4}
                placeholder="Transport, snacks, supplies..."
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/30"
              />
            </label>

            <button
              type="button"
              onClick={addExpenseItem}
              className="mt-4 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasDraftExpense}
            >
              Add expense
            </button>

            <div className="mt-5 space-y-2">
              {dailyExpenses.length > 0 ? (
                dailyExpenses.map((expense) => (
                  <div key={expense.id} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {expense.amount.toLocaleString("en-US")} {currency}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                          {expenseCategoryLabel(expense.category, expenseCategories)}
                        </p>
                        {expense.note ? <p className="mt-1 break-words text-xs leading-5 text-slate-300">{expense.note}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpenseItem(expense.id)}
                        className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-sm text-slate-300">
                  No extra expenses added yet.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Tracked today</p>
              <p className="mt-2 text-2xl font-semibold">
                {activeDailyExpense.toLocaleString("en-US")} {currency}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Personal expense tracking only. Lunch spend stays separate.</p>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={!entry || saving}
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Day
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                void onSave({
                  delayMinutes: isWorkDay ? activeMinutes : 0,
                  hadLunch: isWorkDay ? hadLunch : false,
                  dayStatus,
                  leaveType: dayStatus === "leave" ? leaveType : "regular",
                  comment: dayStatus !== "work" ? comment.trim() : "",
                  dailyExpenses: hasDraftExpense
                    ? [...dailyExpenses, { id: createExpenseId(), amount: draftExpenseAmount, category: expenseDraftCategory, note: draftExpenseNote }]
                    : dailyExpenses
                })
              }
              disabled={saving}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
