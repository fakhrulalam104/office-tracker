export type DayStatus = "work" | "holiday" | "sick" | "leave";

export type ExpenseCategory = "transport" | "food" | "supplies" | "personal" | "other";

export type DailyExpenseItem = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
};

export type EntryItem = {
  id: string;
  date: string;
  delayMinutes: number;
  hadLunch: boolean;
  dayStatus: DayStatus;
  comment?: string;
  dailyExpenses: DailyExpenseItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type MonthlySummary = {
  totalDelayMinutes: number;
  lunchDays: number;
  lunchSpend: number;
  holidayDays: number;
  sickDays: number;
  leaveDays: number;
  workDays: number;
  dailyExpenseTotal: number;
  dailyExpenseCount: number;
  expenseCategories: Array<{
    category: ExpenseCategory;
    label: string;
    total: number;
    count: number;
  }>;
  weeklyDelayMinutes: Array<{
    label: string;
    minutes: number;
  }>;
  insights: string[];
  delayLimit: number;
  lunchPrice: number;
  currency: string;
};

export type UserSettings = {
  weeklyHolidays: number[];
  lunchPrice: number;
  delayLimit: number;
  currency: string;
  reminderEnabled: boolean;
  reminderTime: string;
};
