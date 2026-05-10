"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

const widgets = [
  "Calendar",
  "Tasks",
  "Leave",
  "Announcements",
  "Expenses",
  "Projects",
  "Tickets",
  "Notes",
  "Tools",
  "Reports"
];

export function DashboardSettingsPageClient() {
  const [enabled, setEnabled] = useState<string[]>(widgets.slice(0, 6));

  useEffect(() => {
    const stored = window.localStorage.getItem("office-tracker-dashboard-widgets");
    if (stored) {
      setEnabled(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("office-tracker-dashboard-widgets", JSON.stringify(enabled));
  }, [enabled]);

  function toggleWidget(widget: string) {
    setEnabled((current) => (current.includes(widget) ? current.filter((item) => item !== widget) : [...current, widget]));
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader eyebrow="Dashboard" title="Dashboard Customization" description="Choose which workspace widgets should be visible in your daily dashboard view." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((widget) => {
          const active = enabled.includes(widget);
          return (
            <button
              key={widget}
              type="button"
              onClick={() => toggleWidget(widget)}
              className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                active ? "border-sky-200 bg-sky-50 text-sky-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="block text-lg font-semibold">{widget}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-500">{active ? "Visible on dashboard" : "Hidden from dashboard"}</span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
