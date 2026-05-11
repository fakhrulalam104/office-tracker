import type { DailyExpenseItem, DayStatus, ExpenseCategory, ExpenseCategoryOption, LeaveType, UserSettings } from "@/types";

export const LUNCH_PRICE = 90;
export const MONTH_DELAY_LIMIT = 150;
export const COMMENT_MAX_LENGTH = 500;
export const DAILY_EXPENSE_NOTE_MAX_LENGTH = 300;
export const EXPENSE_CATEGORY_LABEL_MAX_LENGTH = 40;
export const EXPENSE_CATEGORY_LIMIT = 20;
export const DAY_STATUSES: DayStatus[] = ["work", "holiday", "sick", "leave"];
export const ANNUAL_LEAVE_ALLOWANCE_DAYS = 18;
export type HolidayDefinition = {
  name: string;
  scope: "national" | "international";
  note?: string;
};

const FIXED_HOLIDAYS: Record<string, HolidayDefinition> = {
  "01-01": { name: "New Year's Day", scope: "international" },
  "02-21": { name: "Shaheed Dibosh and International Mother Language Day", scope: "national" },
  "03-26": { name: "Independence and National Day", scope: "national" },
  "04-14": { name: "Bangla New Year", scope: "national" },
  "05-01": { name: "May Day", scope: "international" },
  "08-05": { name: "July Revolution Day", scope: "national" },
  "12-16": { name: "Victory Day", scope: "national" },
  "12-25": { name: "Christmas Day", scope: "international" }
};

const OBSERVED_HOLIDAYS_BY_DATE: Record<string, HolidayDefinition> = {
  "2026-02-04": { name: "Shab-e-Barat", scope: "national", note: "Moon sighting dependent" },
  "2026-03-17": { name: "Shab-e-Qadar", scope: "national", note: "Moon sighting dependent" },
  "2026-03-19": { name: "Eid-ul-Fitr Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-03-20": { name: "Eid-ul-Fitr and Jumatul Bidah", scope: "national", note: "Moon sighting dependent" },
  "2026-03-21": { name: "Eid-ul-Fitr Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-03-22": { name: "Eid-ul-Fitr Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-03-23": { name: "Eid-ul-Fitr Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-01": { name: "May Day and Buddha Purnima", scope: "national", note: "Buddha Purnima is lunar-calendar dependent" },
  "2026-05-26": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-27": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-28": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-29": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-30": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-05-31": { name: "Eid-ul-Azha Holiday", scope: "national", note: "Moon sighting dependent" },
  "2026-06-26": { name: "Ashura", scope: "national", note: "Moon sighting dependent" },
  "2026-08-26": { name: "Eid-e-Miladunnabi", scope: "national", note: "Moon sighting dependent" },
  "2026-09-04": { name: "Janmashtami", scope: "national" },
  "2026-10-20": { name: "Durga Puja Holiday", scope: "national" },
  "2026-10-21": { name: "Durga Puja Holiday", scope: "national" }
};
export const EXPENSE_CATEGORIES: ExpenseCategoryOption[] = [
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
  expenseCategories: EXPENSE_CATEGORIES,
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

export function getHolidayForDate(dateKey: string): HolidayDefinition | null {
  const observedHoliday = OBSERVED_HOLIDAYS_BY_DATE[dateKey];
  if (observedHoliday) {
    return observedHoliday;
  }

  const fixedHoliday = FIXED_HOLIDAYS[dateKey.slice(5)];
  return fixedHoliday ?? null;
}

export function defaultDayStatusForDate(dateKey: string, settings: Pick<UserSettings, "weeklyHolidays"> = DEFAULT_USER_SETTINGS): DayStatus {
  if (getHolidayForDate(dateKey)) {
    return "holiday";
  }

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

export function normalizeLeaveType(value: unknown): LeaveType {
  return value === "adjustment" ? "adjustment" : "regular";
}

export function isAdjustmentLeaveEntry(entry: unknown) {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  return normalizeDayStatus(readObjectValue(entry, "dayStatus")) === "leave" && normalizeLeaveType(readObjectValue(entry, "leaveType")) === "adjustment";
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

export function normalizeExpenseCategoryLabel(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, EXPENSE_CATEGORY_LABEL_MAX_LENGTH);
}

export function normalizeExpenseCategoryValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, EXPENSE_CATEGORY_LABEL_MAX_LENGTH);
}

function labelFromCategoryValue(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeExpenseCategoryOptions(value: unknown): ExpenseCategoryOption[] {
  const input = Array.isArray(value) ? value : EXPENSE_CATEGORIES;
  const seen = new Set<string>();
  const categories: ExpenseCategoryOption[] = [];

  for (const item of input) {
    const rawLabel = readObjectValue(item, "label");
    const rawValue = readObjectValue(item, "value");
    const label = normalizeExpenseCategoryLabel(rawLabel) || normalizeExpenseCategoryLabel(rawValue);
    const valueFromLabel = normalizeExpenseCategoryValue(label);
    const normalizedValue = normalizeExpenseCategoryValue(rawValue) || valueFromLabel;

    if (!label || !normalizedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    categories.push({ value: normalizedValue, label });

    if (categories.length >= EXPENSE_CATEGORY_LIMIT) {
      break;
    }
  }

  return categories.length > 0 ? categories : EXPENSE_CATEGORIES;
}

export function normalizeExpenseCategory(value: unknown): ExpenseCategory {
  const normalized = normalizeExpenseCategoryValue(value);
  return normalized || "other";
}

export function expenseCategoryLabel(value: ExpenseCategory, categories: ExpenseCategoryOption[] = EXPENSE_CATEGORIES) {
  const normalized = normalizeExpenseCategory(value);
  const options = normalizeExpenseCategoryOptions(categories);
  return options.find((category) => category.value === normalized)?.label ?? (labelFromCategoryValue(normalized) || "Other");
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
  const expenseCategories = normalizeExpenseCategoryOptions(value?.expenseCategories);
  const reminderTime =
    typeof value?.reminderTime === "string" && /^\d{2}:\d{2}$/.test(value.reminderTime) ? value.reminderTime : "18:00";

  return {
    weeklyHolidays: weeklyHolidays.length > 0 ? weeklyHolidays : DEFAULT_USER_SETTINGS.weeklyHolidays,
    lunchPrice,
    delayLimit,
    currency,
    expenseCategories,
    reminderEnabled: Boolean(value?.reminderEnabled),
    reminderTime
  };
}
