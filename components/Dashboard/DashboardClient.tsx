"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyExpenseItem, EntryItem, MonthlySummary } from "@/types";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DayModal } from "@/components/Calendar/DayModal";
import { MonthCalendar } from "@/components/Calendar/MonthCalendar";
import { MonthlySummary as SummaryCard } from "@/components/Sidebar/MonthlySummary";
import { getFineState, monthLabel, monthNavigate } from "@/lib/utils";

export function DashboardClient({ initialMonth }: { initialMonth: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({
    totalDelayMinutes: 0,
    lunchDays: 0,
    lunchSpend: 0,
    holidayDays: 0,
    sickDays: 0,
    leaveDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    let active = true;

    async function loadMonthData() {
      setLoading(true);
      setError(null);

      try {
        const [entriesResponse, summaryResponse] = await Promise.all([
          fetch(`/api/entries?month=${month}`),
          fetch(`/api/summary?month=${month}`)
        ]);

        if (!entriesResponse.ok) {
          throw new Error("Failed to load entries.");
        }

        if (!summaryResponse.ok) {
          throw new Error("Failed to load summary.");
        }

        const entriesData = (await entriesResponse.json()) as { entries: EntryItem[] };
        const summaryData = (await summaryResponse.json()) as MonthlySummary & { month: string };

        if (!active) {
          return;
        }

        setEntries(entriesData.entries ?? []);
        setSummary({
          totalDelayMinutes: summaryData.totalDelayMinutes ?? 0,
          lunchDays: summaryData.lunchDays ?? 0,
          lunchSpend: summaryData.lunchSpend ?? 0,
          holidayDays: summaryData.holidayDays ?? 0,
          sickDays: summaryData.sickDays ?? 0,
          leaveDays: summaryData.leaveDays ?? 0
        });
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMonthData();

    return () => {
      active = false;
    };
  }, [month]);

  const status = useMemo(() => getFineState(summary.totalDelayMinutes), [summary.totalDelayMinutes]);
  const selectedEntry = useMemo(() => entries.find((entry) => entry.date === selectedDate), [entries, selectedDate]);

  function goToMonth(nextMonth: string) {
    setMonth(nextMonth);
    router.push(`/dashboard?month=${nextMonth}`, { scroll: false });
  }

  async function reloadMonth() {
    const [entriesResponse, summaryResponse] = await Promise.all([
      fetch(`/api/entries?month=${month}`),
      fetch(`/api/summary?month=${month}`)
    ]);

    if (!entriesResponse.ok || !summaryResponse.ok) {
      throw new Error("Unable to refresh the month.");
    }

    const entriesData = (await entriesResponse.json()) as { entries: EntryItem[] };
    const summaryData = (await summaryResponse.json()) as MonthlySummary;

    setEntries(entriesData.entries ?? []);
    setSummary({
      totalDelayMinutes: summaryData.totalDelayMinutes ?? 0,
      lunchDays: summaryData.lunchDays ?? 0,
      lunchSpend: summaryData.lunchSpend ?? 0,
      holidayDays: summaryData.holidayDays ?? 0,
      sickDays: summaryData.sickDays ?? 0,
      leaveDays: summaryData.leaveDays ?? 0
    });
  }

  async function handleSave(payload: {
    delayMinutes: number;
    hadLunch: boolean;
    dayStatus: EntryItem["dayStatus"];
    comment: string;
    dailyExpenses: DailyExpenseItem[];
  }) {
    if (!selectedDate) {
      return;
    }

    setSaving(true);
    try {
      if (selectedEntry) {
        const response = await fetch(`/api/entries/${selectedEntry.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: selectedDate,
            ...payload
          })
        });

        if (!response.ok) {
          throw new Error("Failed to update the day.");
        }
      } else {
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: selectedDate,
            ...payload
          })
        });

        if (!response.ok) {
          throw new Error("Failed to create the day.");
        }
      }

      await reloadMonth();
      setModalOpen(false);
      setSelectedDate(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEntry) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/entries/${selectedEntry.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete the day.");
      }

      await reloadMonth();
      setModalOpen(false);
      setSelectedDate(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the entry.");
    } finally {
      setSaving(false);
    }
  }

  const bannerMessage =
    status.tone === "danger"
      ? "Fine incurred! You exceeded the 150-minute fine threshold."
      : status.tone === "warning"
        ? "You are close to the 150-minute fine threshold!"
        : null;

  return (
    <>
      {bannerMessage ? (
        <AlertBanner tone={status.tone === "danger" ? "danger" : "warning"} message={bannerMessage} />
      ) : null}

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.8fr)] lg:px-8">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <MonthCalendar
            monthKey={month}
            entries={entries}
            totalDelayMinutes={summary.totalDelayMinutes}
            onPrevMonth={() => goToMonth(monthNavigate(month, -1))}
            onNextMonth={() => goToMonth(monthNavigate(month, 1))}
            onSelectDay={(dateKey) => {
              setSelectedDate(dateKey);
              setModalOpen(true);
            }}
          />
        </div>

        <div className="space-y-4">
          <SummaryCard
            monthLabel={monthLabel(month)}
            totalDelayMinutes={summary.totalDelayMinutes}
            lunchDays={summary.lunchDays}
            lunchSpend={summary.lunchSpend}
            holidayDays={summary.holidayDays}
            sickDays={summary.sickDays}
            leaveDays={summary.leaveDays}
            loading={loading}
          />
        </div>
      </div>

      <DayModal
        open={modalOpen}
        dateKey={selectedDate}
        entry={selectedEntry}
        saving={saving}
        onClose={() => {
          setModalOpen(false);
          setSelectedDate(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
