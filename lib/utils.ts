import type { DailyExpenseItem, DayStatus, ExpenseCategory, UserSettings } from "@/types";

export const LUNCH_PRICE = 90;
export const MONTH_DELAY_LIMIT = 150;
export const COMMENT_MAX_LENGTH = 500;
export const DAILY_EXPENSE_NOTE_MAX_LENGTH = 300;
export const DAY_STATUSES: DayStatus[] = ["work", "holiday", "sick", "leave"];
export const EXPENSE_CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "transport", label: "Transport" },
  { value: "food", label: "Food" },
  { value: "supplies", label: "Office Supplies" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" }
];
export const DEFAULT_USER_SETTINGS: UserSettings = {
  weeklyHolidays: [0],
  lunchPrice: LUNCH_PRICE,
  delayLimit: MONTH_DELAY_LIMIT,
  currency: "BDT",
  reminderEnabled: false,
  reminderTime: "18:00"
};

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

export function dayOfWeekForDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day).getDay();
}

export function isSundayDateKey(dateKey: string) {
  return dayOfWeekForDateKey(dateKey) === 0;
}

export function defaultDayStatusForDate(dateKey: string, settings: Pick<UserSettings, "weeklyHolidays"> = DEFAULT_USER_SETTINGS): DayStatus {
  const dayOfWeek = dayOfWeekForDateKey(dateKey);
  return dayOfWeek !== null && settings.weeklyHolidays.includes(dayOfWeek) ? "holiday" : "work";
}

export function countHolidayDaysForMonth(
  monthKey: string,
  entries: unknown[],
  settings: Pick<UserSettings, "weeklyHolidays"> = DEFAULT_USER_SETTINGS
) {
  const [year, month] = monthKey.split("-").map(Number);
  const entryMap = new Map(
    entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || !("date" in entry) || typeof entry.date !== "string") {
        return [];
      }

      return [[entry.date, { dayStatus: "dayStatus" in entry ? entry.dayStatus : undefined }]];
    })
  );
  const daysInMonth = new Date(year, month, 0).getDate();
  let holidayDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(new Date(year, month - 1, day));
    const entry = entryMap.get(dateKey);
    const dayStatus = entry ? normalizeDayStatus(entry.dayStatus) : defaultDayStatusForDate(dateKey, settings);

    if (dayStatus === "holiday") {
      holidayDays += 1;
    }
  }

  return holidayDays;
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

export function getFineStateForLimit(totalDelayMinutes: number, limit = MONTH_DELAY_LIMIT) {
  if (totalDelayMinutes >= limit) {
    return {
      tone: "danger" as const,
      label: "Fine incurred!",
      description: `You exceeded ${limit} minutes.`
    };
  }

  const warningAt = Math.max(0, limit - 20);
  const cautionAt = Math.max(0, limit - 50);

  if (totalDelayMinutes >= warningAt) {
    return {
      tone: "warning" as const,
      label: "Warning",
      description: `Only ${limit - totalDelayMinutes} mins remaining.`
    };
  }

  if (totalDelayMinutes >= cautionAt) {
    return {
      tone: "caution" as const,
      label: "Getting close to limit",
      description: `You are nearing the ${limit}-minute threshold.`
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

export function normalizeDailyExpenseAmount(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return clamp(amount, 0, 1_000_000);
}

export function normalizeDailyExpenseNote(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, DAILY_EXPENSE_NOTE_MAX_LENGTH);
}

export function normalizeExpenseCategory(value: unknown): ExpenseCategory {
  return EXPENSE_CATEGORIES.some((category) => category.value === value) ? (value as ExpenseCategory) : "other";
}

export function expenseCategoryLabel(value: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((category) => category.value === value)?.label ?? "Other";
}

function readObjectValue(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

export function normalizeDailyExpenses(value: unknown, legacyAmount?: unknown, legacyNote?: unknown): DailyExpenseItem[] {
  const items = Array.isArray(value)
    ? value.flatMap((item, index) => {
        const amount = normalizeDailyExpenseAmount(readObjectValue(item, "amount"));
        const note = normalizeDailyExpenseNote(readObjectValue(item, "note"));
        const category = normalizeExpenseCategory(readObjectValue(item, "category"));
        const rawId = readObjectValue(item, "id") ?? readObjectValue(item, "_id");
        const id = typeof rawId === "string" && rawId.trim() ? rawId.trim() : `expense-${index + 1}`;

        if (amount <= 0 && !note) {
          return [];
        }

        return [{ id, amount, category, note }];
      })
    : [];

  if (items.length > 0) {
    return items.slice(0, 50);
  }

  const amount = normalizeDailyExpenseAmount(legacyAmount);
  const note = normalizeDailyExpenseNote(legacyNote);
  return amount > 0 || note ? [{ id: "legacy-expense", amount, category: "other", note }] : [];
}

export function totalDailyExpenses(expenses: DailyExpenseItem[]) {
  return expenses.reduce((total, expense) => total + normalizeDailyExpenseAmount(expense.amount), 0);
}

export function normalizeUserSettings(value: Partial<UserSettings> | null | undefined): UserSettings {
  const weeklyHolidays = Array.isArray(value?.weeklyHolidays)
    ? value.weeklyHolidays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : DEFAULT_USER_SETTINGS.weeklyHolidays;

  const lunchPrice = normalizeDailyExpenseAmount(value?.lunchPrice || DEFAULT_USER_SETTINGS.lunchPrice);
  const delayLimit = clamp(Number(value?.delayLimit ?? DEFAULT_USER_SETTINGS.delayLimit), 1, 1000);
  const currency = typeof value?.currency === "string" && value.currency.trim() ? value.currency.trim().slice(0, 8).toUpperCase() : "BDT";
  const reminderTime =
    typeof value?.reminderTime === "string" && /^\d{2}:\d{2}$/.test(value.reminderTime) ? value.reminderTime : "18:00";

  return {
    weeklyHolidays: weeklyHolidays.length > 0 ? weeklyHolidays : DEFAULT_USER_SETTINGS.weeklyHolidays,
    lunchPrice,
    delayLimit,
    currency,
    reminderEnabled: Boolean(value?.reminderEnabled),
    reminderTime
  };
}
