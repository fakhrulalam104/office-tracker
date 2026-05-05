export type DayStatus = "work" | "holiday" | "sick" | "leave";

export type EntryItem = {
  id: string;
  date: string;
  delayMinutes: number;
  hadLunch: boolean;
  dayStatus: DayStatus;
  comment?: string;
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
};
