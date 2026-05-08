"use client";

import { useEffect, useState } from "react";
import type { UserSettings } from "@/types";
import { DEFAULT_USER_SETTINGS, EXPENSE_CATEGORY_LIMIT, normalizeExpenseCategoryLabel, normalizeExpenseCategoryValue } from "@/lib/utils";
import { PageHeader } from "@/components/pages/PageHeader";

const weekdays = [
  ["0", "Sun"],
  ["1", "Mon"],
  ["2", "Tue"],
  ["3", "Wed"],
  ["4", "Thu"],
  ["5", "Fri"],
  ["6", "Sat"]
];

export function SettingsPageClient() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as { settings: UserSettings };
      setSettings(data.settings ?? DEFAULT_USER_SETTINGS);
    }

    void load();
  }, []);

  async function saveSettings() {
    setSaved(false);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    if (response.ok) {
      const data = (await response.json()) as { settings: UserSettings };
      setSettings(data.settings);
      setSaved(true);
    }
  }

  function toggleHoliday(day: number) {
    setSettings((current) => ({
      ...current,
      weeklyHolidays: current.weeklyHolidays.includes(day)
        ? current.weeklyHolidays.filter((value) => value !== day)
        : [...current.weeklyHolidays, day].sort()
    }));
  }

  function updateExpenseCategory(value: string, label: string) {
    setSettings((current) => ({
      ...current,
      expenseCategories: current.expenseCategories.map((category) =>
        category.value === value ? { ...category, label } : category
      )
    }));
  }

  function addExpenseCategory() {
    const label = normalizeExpenseCategoryLabel(categoryDraft);
    if (!label || settings.expenseCategories.length >= EXPENSE_CATEGORY_LIMIT) {
      return;
    }

    const baseValue = normalizeExpenseCategoryValue(label);
    const existingValues = new Set(settings.expenseCategories.map((category) => category.value));
    let value = baseValue;
    let suffix = 2;

    while (existingValues.has(value)) {
      value = `${baseValue}-${suffix}`;
      suffix += 1;
    }

    setSettings((current) => ({
      ...current,
      expenseCategories: [...current.expenseCategories, { value, label }]
    }));
    setCategoryDraft("");
  }

  function removeExpenseCategory(value: string) {
    setSettings((current) => ({
      ...current,
      expenseCategories:
        current.expenseCategories.length > 1
          ? current.expenseCategories.filter((category) => category.value !== value)
          : current.expenseCategories
    }));
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader eyebrow="Settings" title="Office Rules" description="Configure holidays, delay rules, lunch pricing, expense categories, currency, and daily reminder preferences." />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Weekly Holidays</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {weekdays.map(([value, label]) => {
            const day = Number(value);
            const active = settings.weeklyHolidays.includes(day);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleHoliday(day)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label>
          <span className="text-sm font-semibold text-slate-700">Lunch Price</span>
          <input
            type="number"
            value={settings.lunchPrice}
            onChange={(event) => setSettings((current) => ({ ...current, lunchPrice: Number(event.target.value) }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-700">Delay Limit</span>
          <input
            type="number"
            value={settings.delayLimit}
            onChange={(event) => setSettings((current) => ({ ...current, delayLimit: Number(event.target.value) }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-700">Currency</span>
          <input
            value={settings.currency}
            onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Expense Categories</p>
            <p className="mt-1 text-sm text-slate-500">These options appear when you add a daily expense from the calendar.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {settings.expenseCategories.length}/{EXPENSE_CATEGORY_LIMIT}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {settings.expenseCategories.map((category) => (
            <div key={category.value} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
              <input
                value={category.label}
                onChange={(event) => updateExpenseCategory(category.value, event.target.value)}
                maxLength={40}
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={() => removeExpenseCategory(category.value)}
                disabled={settings.expenseCategories.length <= 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={categoryDraft}
            onChange={(event) => setCategoryDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addExpenseCategory();
              }
            }}
            maxLength={40}
            placeholder="Add category"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="button"
            onClick={addExpenseCategory}
            disabled={!categoryDraft.trim() || settings.expenseCategories.length >= EXPENSE_CATEGORY_LIMIT}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Add category
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Daily Reminder</p>
            <p className="mt-1 text-sm text-slate-500">Shows as an in-app preference for now and is ready for email or push reminders later.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={settings.reminderEnabled}
              onChange={(event) => setSettings((current) => ({ ...current, reminderEnabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Enabled
          </label>
        </div>
        <label className="mt-4 block max-w-xs">
          <span className="text-sm font-semibold text-slate-700">Reminder Time</span>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(event) => setSettings((current) => ({ ...current, reminderTime: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </section>

      <button type="button" onClick={saveSettings} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm">
        Save settings
      </button>
      {saved ? <span className="ml-3 text-sm font-semibold text-emerald-700">Saved</span> : null}
    </div>
  );
}
