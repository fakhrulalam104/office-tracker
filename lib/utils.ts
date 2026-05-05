import type { DayStatus } from "@/types";

export const LUNCH_PRICE = 90;
export const MONTH_DELAY_LIMIT = 150;
export const COMMENT_MAX_LENGTH = 500;
export const DAY_STATUSES: DayStatus[] = ["work", "holiday", "sick", "leave"];

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function parseMonthKey(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return toMonthKey(new Date());
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));

  if (month < 1 || month > 12) {
    return toMonthKey(new Date());
  }

  return `${year}-${pad2(month)}`;
}

export function parseDateKey(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

export function monthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: toDateKey(start),
    end: toDateKey(end)
  };
}

export function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function monthNavigate(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return toMonthKey(date);
}

export function buildMonthGrid(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - leadingDays);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      dateKey: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1
    };
  });
}

export function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function getFineState(totalDelayMinutes: number) {
  if (totalDelayMinutes >= 150) {
    return {
      tone: "danger" as const,
      label: "Fine incurred!",
      description: "You exceeded 150 minutes."
    };
  }

  if (totalDelayMinutes >= 130) {
    return {
      tone: "warning" as const,
      label: "Warning",
      description: `Only ${150 - totalDelayMinutes} mins remaining.`
    };
  }

  if (totalDelayMinutes >= 100) {
    return {
      tone: "caution" as const,
      label: "Getting close to limit",
      description: "You are nearing the 150-minute threshold."
    };
  }

  return {
    tone: "success" as const,
    label: "On track",
    description: "You are safely below the fine threshold."
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeDayStatus(value: unknown): DayStatus {
  switch (value) {
    case "holiday":
    case "sick":
    case "leave":
      return value;
    default:
      return "work";
  }
}

export function isTimeOffStatus(value: unknown) {
  return normalizeDayStatus(value) !== "work";
}

export function dayStatusLabel(value: DayStatus) {
  switch (value) {
    case "holiday":
      return "Holiday";
    case "sick":
      return "Sick";
    case "leave":
      return "Leave for other reason";
    default:
      return "Work";
  }
}

export function normalizeComment(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, COMMENT_MAX_LENGTH);
}
