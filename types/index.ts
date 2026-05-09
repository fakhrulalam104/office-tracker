export type DayStatus = "work" | "holiday" | "sick" | "leave";
export type UserRole = "super_admin" | "owner" | "admin" | "member";

export type ExpenseCategory = string;

export type ExpenseCategoryOption = {
  value: ExpenseCategory;
  label: string;
};

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
  expenseCategories: ExpenseCategoryOption[];
  reminderEnabled: boolean;
  reminderTime: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  organizationId?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  phone: string;
  jobTitle: string;
  department: string;
  employeeCode: string;
  location: string;
  bio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt?: string | null;
};

export type ApprovalItem = {
  id: string;
  userId: string;
  organizationId?: string | null;
  type: "leave" | "expense" | "correction";
  date: string;
  title: string;
  amount: number;
  note: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
  createdAt?: string;
  userName?: string;
  userEmail?: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  organizationId?: string | null;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt?: string;
  userName?: string;
  userEmail?: string;
};

export type AuditItem = {
  id: string;
  userId: string;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt?: string;
  userName?: string;
  userEmail?: string;
};

export type OrganizationItem = {
  id: string;
  name: string;
  ownerId?: string | null;
  plan: "trial" | "starter" | "team" | "enterprise";
  createdAt?: string;
  ownerName?: string;
  ownerEmail?: string;
};
